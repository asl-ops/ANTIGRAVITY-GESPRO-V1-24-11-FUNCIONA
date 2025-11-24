
import Tesseract from 'tesseract.js';

export const processVehicleDocs = async (imageFile: File): Promise<Partial<{ bastidor: string; matricula: string }>> => {
  try {
    const result = await Tesseract.recognize(
      imageFile,
      'eng', // Usar 'eng' suele funcionar mejor para códigos alfanuméricos que 'spa'
      { logger: m => console.log(m) }
    );

    const text = result.data.text;
    
    // Expresiones regulares básicas para documentos españoles
    // Bastidor: 17 caracteres alfanuméricos (excluyendo I, O, Q)
    const vinRegex = /[A-HJ-NPR-Z0-9]{17}/g;
    // Matrícula: 4 números 3 letras (moderna) o Letras-Numeros-Letras (antigua)
    const plateRegex = /\d{4}\s?[BCDFGHJKLMNPRSTVWXYZ]{3}/g;

    const foundVin = text.match(vinRegex);
    const foundPlate = text.match(plateRegex);

    return {
      bastidor: foundVin ? foundVin[0] : '',
      matricula: foundPlate ? foundPlate[0] : ''
    };
  } catch (error) {
    console.error("OCR Error:", error);
    throw new Error("Error procesando la imagen");
  }
};
