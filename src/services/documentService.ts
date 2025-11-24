import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import { getTemplateUrl } from './cloudStorageService';



export const generateDocx = async ({ templateName, data, fileName }: { templateName: string; data: Record<string, any>; fileName: string }): Promise<void> => {
    try {
        // 1. Get the template URL from Firebase Storage
        const templateUrl = await getTemplateUrl(templateName);

        // 2. Fetch the template file
        const response = await fetch(templateUrl);
        if (!response.ok) {
            throw new Error(`Could not fetch template: ${response.statusText}`);
        }
        const templateBlob = await response.blob();
        const templateArrayBuffer = await templateBlob.arrayBuffer();

        // 3. Process the template with docxtemplater
        const zip = new PizZip(templateArrayBuffer);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        doc.render(data);

        // 4. Generate the output file as a Blob
        const out = doc.getZip().generate({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });

        // 5. Trigger download using FileSaver.js
        saveAs(out, fileName);

    } catch (error) {
        console.error('Error generating DOCX:', error);
        throw error;
    }
};

import { jsPDF } from 'jspdf';

export const generateMandatoPDF = async ({ data, fileName }: { data: Record<string, any>; fileName: string }): Promise<void> => {
    const doc = new jsPDF();

    doc.setFont("times", "roman");
    doc.setFontSize(12);

    // Header
    doc.setFontSize(18);
    doc.text("CONTRATO DE MANDATO", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.text(`En ${data.CURRENT_CITY || 'ESPAÑA'}, a ${data.CURRENT_DAY} de ${data.CURRENT_MONTH} de ${data.CURRENT_YEAR}`, 105, 30, { align: "center" });

    // Body content (simplified for PDF)
    const splitTitle = doc.splitTextToSize("REUNIDOS", 170);
    doc.text(splitTitle, 20, 45);

    const bodyText = `
De una parte, ${data.GESTOR_NAME}, con DNI ${data.GESTOR_DNI} y número de colegiado ${data.GESTOR_COLEGIADO_NUM}, en nombre y representación de ${data.GESTOR_DESPACHO}, con domicilio en ${data.GESTOR_DESPACHO_DIRECCION}.

Y de otra parte, ${data.CLIENT_FULL_NAME}, con NIF/CIF ${data.CLIENT_NIF}, y domicilio en ${data.CLIENT_ADDRESS}.

INTERVIENEN

Ambas partes se reconocen mutuamente la capacidad legal necesaria para otorgar el presente CONTRATO DE MANDATO, y a tal efecto,

EXPONEN

Que el MANDANTE está interesado en realizar la gestión de:
${data.ASUNTO}

Que encarga dicha gestión al GESTOR ADMINISTRATIVO, quien acepta el encargo.

CLÁUSULAS

PRIMERA.- El MANDANTE encarga al GESTOR la realización de los trámites necesarios para el asunto descrito.

SEGUNDA.- El GESTOR acepta el encargo y se compromete a realizarlo conforme a la lex artis.

TERCERA.- Los honorarios se fijan según lo acordado.

Y en prueba de conformidad, firman el presente documento por duplicado en el lugar y fecha indicados.
    `;

    const splitBody = doc.splitTextToSize(bodyText, 170);
    doc.text(splitBody, 20, 55);

    // Signatures
    const finalY = 200; // Approximate
    doc.text("EL MANDANTE", 50, finalY, { align: "center" });
    doc.text("EL GESTOR", 160, finalY, { align: "center" });

    doc.save(fileName);
};

/**
 * Generate mandate contract as DOCX (editable Word document)
 */
export const generateMandatoDOCX = async ({ data, fileName, templateUrl }: { data: Record<string, any>; fileName: string; templateUrl?: string }): Promise<void> => {
    try {
        if (templateUrl) {
            // Use custom template from URL
            const response = await fetch(templateUrl);
            if (!response.ok) throw new Error('Failed to fetch template');
            const content = await response.arrayBuffer();

            const zip = new PizZip(content);
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
            });

            doc.render(data);

            const out = doc.getZip().generate({
                type: 'blob',
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            });

            saveAs(out, fileName);
            return;
        }

        // Fallback to manual generation (simplified)
        const content = `
CONTRATO DE MANDATO

En ${data.CURRENT_CITY || 'ESPAÑA'}, a ${data.CURRENT_DAY} de ${data.CURRENT_MONTH} de ${data.CURRENT_YEAR}

REUNIDOS

De una parte, ${data.GESTOR_NAME}, con DNI ${data.GESTOR_DNI} y número de colegiado ${data.GESTOR_COLEGIADO_NUM}, en nombre y representación de ${data.GESTOR_DESPACHO}, con domicilio en ${data.GESTOR_DESPACHO_DIRECCION}.

Y de otra parte, ${data.CLIENT_FULL_NAME}, con NIF/CIF ${data.CLIENT_NIF}, y domicilio en ${data.CLIENT_ADDRESS}.

INTERVIENEN

Ambas partes se reconocen mutuamente la capacidad legal necesaria para otorgar el presente CONTRATO DE MANDATO, y a tal efecto,

EXPONEN

Que el MANDANTE está interesado en realizar la gestión de:
${data.ASUNTO}

Que encarga dicha gestión al GESTOR ADMINISTRATIVO, quien acepta el encargo.

CLÁUSULAS

PRIMERA.- El MANDANTE encarga al GESTOR la realización de los trámites necesarios para el asunto descrito.

SEGUNDA.- El GESTOR acepta el encargo y se compromete a realizarlo conforme a la lex artis.

TERCERA.- Los honorarios se fijan según lo acordado.

Y en prueba de conformidad, firman el presente documento por duplicado en el lugar y fecha indicados.


EL MANDANTE                                    EL GESTOR
        `;

        // Create a minimal DOCX structure
        // Note: For production use, you should use a proper template file
        const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        saveAs(blob, fileName);

    } catch (error) {
        console.error('Error generating DOCX:', error);
        throw error;
    }
};