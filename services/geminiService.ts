import { GoogleGenAI, Type } from "@google/genai";
import { Client, Vehicle, Communication, User, Task } from "../types";

let ai: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
    if (!ai) {
        const apiKey = (typeof process !== 'undefined' && process?.env) ? process.env.API_KEY : undefined;
        if (!apiKey) {
            const error = new Error(
                "La API Key de Gemini no está configurada. Por favor, asegúrate de que la variable de entorno API_KEY esté disponible."
            );
            (error as any).code = 'gemini/api-key-not-set';
            throw error;
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        if (reader.result) {
            resolve((reader.result as string).split(',')[1]);
        } else {
            reject(new Error("FileReader result is null."));
        }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

type ExtractedClientData = Omit<Client, 'id' | 'phone' | 'email'>;

const handleGeminiError = (error: any, context: string): Error => {
    if (error.code === 'gemini/api-key-not-set') {
      return error;
    }
    console.error(`Error calling Gemini API for ${context}:`, error);
    if (error.message && /api key/i.test(error.message)) {
      return new Error("Error con la API Key de Gemini. Revisa que sea correcta y esté disponible en el entorno de ejecución.");
    }
    return new Error(`Fallo en la IA al ${context}. Revisa la consola para más detalles.`);
};

export const extractDataFromImage = async (file: File): Promise<ExtractedClientData> => {
  try {
    const aiClient = getAiClient();
    const imagePart = await fileToGenerativePart(file);
    const textPart = {
      text: "Analiza este documento de identidad (DNI/NIE) o fiscal (CIF de empresa). Extrae los siguientes datos: apellidos (o razón social si es una empresa), nombre (si es una persona física, dejar vacío si es empresa), NIF/CIF, dirección completa, localidad, provincia y código postal. Responde únicamente en formato JSON."
    };
    
    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            surnames: {
              type: Type.STRING,
              description: "Apellidos de la persona o Razón Social completa si es una empresa."
            },
            firstName: {
              type: Type.STRING,
              description: "Nombre de la persona. Dejar vacío si es una empresa."
            },
            nif: {
              type: Type.STRING,
              description: "Número de Identificación Fiscal (NIF, DNI, o NIE)."
            },
            address: {
              type: Type.STRING,
              description: "La dirección completa (calle, número, etc.) sin incluir la localidad o provincia."
            },
            city: {
              type: Type.STRING,
              description: "La localidad o municipio."
            },
            province: {
              type: Type.STRING,
              description: "La provincia."
            },
            postalCode: {
                type: Type.STRING,
                description: "El código postal."
            }
          },
          required: ["surnames", "nif", "address", "city", "province", "postalCode"]
        }
      }
    });
    
    const text = (response.text ?? '').trim();
    return JSON.parse(text);

  } catch (error: any) {
    throw handleGeminiError(error, "extraer datos del documento");
  }
};

export const extractVehicleDataFromImage = async (file: File): Promise<{ vin: string; brand: string; model: string; year: string; engineSize: string; fuelType: string; }> => {
  try {
    const aiClient = getAiClient();
    const imagePart = await fileToGenerativePart(file);
    const textPart = {
      text: "Analiza este documento de ficha técnica de vehículo (ITV). Extrae el número de bastidor (VIN), la marca, el modelo, la fecha de primera matriculación, la cilindrada (en cc) y el tipo de combustible. Responde únicamente en formato JSON."
    };
    
    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vin: {
              type: Type.STRING,
              description: "Número de bastidor (VIN)."
            },
            brand: {
              type: Type.STRING,
              description: "Marca del vehículo (ej. SEAT, VOLKSWAGEN)."
            },
            model: {
              type: Type.STRING,
              description: "Modelo del vehículo (ej. León, Golf)."
            },
            year: {
              type: Type.STRING,
              description: "Fecha de primera matriculación (formato DD/MM/AAAA)."
            },
            engineSize: {
              type: Type.STRING,
              description: "Cilindrada del motor en centímetros cúbicos (cc)."
            },
            fuelType: {
              type: Type.STRING,
              description: "Tipo de combustible (ej. Gasolina, Diesel, Eléctrico)."
            }
          },
          required: ["vin", "brand", "model"]
        }
      }
    });
    
    const text = (response.text ?? '').trim();
    return JSON.parse(text);

  } catch (error: any) {
    throw handleGeminiError(error, "extraer datos del vehículo");
  }
};

export const classifyAndRenameDocument = async (file: File, fileNumber: string, client: Client, vehicle: Vehicle): Promise<string> => {
    try {
        const aiClient = getAiClient();
        const imagePart = await fileToGenerativePart(file);
        const clientName = client.surnames || client.firstName;
        
        const prompt = `Analiza el siguiente documento y clasifícalo en una de las siguientes categorías:
        - DNI_CIF
        - Ficha_Tecnica_ITV
        - Permiso_Circulacion
        - Factura_Compra
        - Contrato_Compraventa
        - Impuesto_Matriculacion_576
        - Impuesto_Transmisiones_620
        - Mandato_Gestoria
        - Justificante_Pago_Tasas
        - Otro_Documento
    
        El documento pertenece al expediente ${fileNumber} para el cliente ${clientName} (NIF: ${client.nif}) y vehículo con bastidor ${vehicle.vin}.
        Responde únicamente con el JSON que contenga la categoría.`;

        const textPart = { text: prompt };
    
        const response = await aiClient.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        documentType: {
                            type: Type.STRING,
                            description: "La categoría del documento de la lista proporcionada, por ejemplo: DNI_CIF o Ficha_Tecnica_ITV."
                        }
                    },
                    required: ["documentType"]
                }
            }
        });
    
        const text = (response.text ?? '').trim();
        const result = JSON.parse(text);
        const docType = result.documentType || 'Otro_Documento';
        const clientIdentifier = (client.nif || client.surnames || 'CLIENTE').replace(/[\s/]/g, '_');
        
        const originalName = file.name;
        const parts = originalName.split('.');
        const extension = parts.length > 1 ? `.${parts.pop()}` : '';

        // Format: N_EXPEDIENTE_IDENTIFICADOR-CLIENTE_TIPO-DOCUMENTO.ext
        const newName = `${fileNumber}_${clientIdentifier}_${docType}${extension}`;
    
        return newName;

    } catch (error: any) {
        throw handleGeminiError(error, "clasificar el documento");
    }
};

export const getGroundedAnswer = async (query: string): Promise<{ answer: string; sources: any[] }> => {
    try {
        const aiClient = getAiClient();
        const response = await aiClient.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Eres un asistente experto en trámites administrativos de vehículos en España. Responde a la siguiente pregunta de forma clara y concisa, basándote en la información de búsqueda proporcionada: ${query}`,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const answer = response.text.trim();
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => chunk.web).filter(Boolean) || [];
        
        return { answer, sources };
    } catch (error: any) {
        throw handleGeminiError(error, "obtener respuesta del asistente");
    }
};

export const summarizeCommunications = async (communications: Communication[], users: User[], client: Client): Promise<string> => {
    try {
        const aiClient = getAiClient();
        const clientName = `${client.firstName} ${client.surnames}`.trim();

        const log = communications
            .map(comm => {
                const author = users.find(u => u.id === comm.authorUserId)?.initials || '??';
                const date = new Date(comm.date).toLocaleDateString('es-ES');
                return `- ${date} [${author}]: ${comm.concept}`;
            })
            .join('\n');

        const prompt = `Eres un asistente administrativo eficiente. Resume el siguiente registro de comunicaciones para el cliente "${clientName}" de forma concisa, destacando los puntos clave y las acciones pendientes si las hubiera. El resumen debe ser claro y breve.\n\nREGISTRO:\n${log}`;

        const response = await aiClient.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text.trim();
    } catch (error: any) {
        throw handleGeminiError(error, "resumir comunicaciones");
    }
};

export const draftCommunication = async (intent: string, clientName: string): Promise<string> => {
    try {
        const aiClient = getAiClient();
        const prompt = `Redacta una comunicación profesional y amable para un cliente llamado "${clientName}". El objetivo es el siguiente: "${intent}". El tono debe ser servicial y claro.`;
        
        const response = await aiClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
              systemInstruction: 'Eres un asistente administrativo experto en comunicación con clientes para una gestoría.',
            },
        });

        return response.text.trim();
    } catch (error: any) {
        throw handleGeminiError(error, "redactar comunicación");
    }
};

export const suggestTasks = async (fileType: string, attachmentNames: string[], existingTasks: Task[]): Promise<string[]> => {
    try {
        const aiClient = getAiClient();
        const prompt = `
        Analiza la siguiente información de un expediente y sugiere una lista de tareas pendientes.
        
        DATOS DEL EXPEDIENTE:
        - Tipo de trámite: "${fileType}"
        - Documentos ya adjuntos: ${attachmentNames.length > 0 ? attachmentNames.join(', ') : 'Ninguno'}
        - Tareas ya existentes: ${existingTasks.length > 0 ? existingTasks.map(t => t.text).join(', ') : 'Ninguna'}

        Basándote en el tipo de trámite y los documentos disponibles, genera una lista de los siguientes pasos lógicos y necesarios. No sugieras tareas que ya existen.
        Por ejemplo, si el trámite es 'Transferencia' y no está el 'Impuesto de Transmisiones', una tarea podría ser 'Preparar y liquidar Modelo 620'. Si ya está la 'Ficha Técnica' y el 'DNI', no sugieras 'Solicitar DNI al cliente'.

        Responde únicamente con un array JSON de strings, donde cada string es una tarea. Si no hay sugerencias, devuelve un array vacío.
        Ejemplo de respuesta: ["Contactar con el cliente para solicitar el justificante de pago de tasas", "Verificar la firma del mandato"]
      `;
        
        const response = await aiClient.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                systemInstruction: "Eres un experto gestor administrativo en España, especializado en trámites de vehículos. Tu objetivo es sugerir las siguientes tareas necesarias para completar un expediente.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        tasks: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING,
                                description: 'Una tarea sugerida'
                            }
                        }
                    },
                    required: ["tasks"]
                }
            },
        });

        const text = (response.text ?? '{"tasks":[]}').trim();
        const result = JSON.parse(text);
        return result.tasks || [];
    } catch (error: any) {
        throw handleGeminiError(error, "sugerir tareas");
    }
};