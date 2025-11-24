import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import { getTemplateUrl } from './cloudStorageService';

interface GenerateDocxOptions {
    templateName: string;
    data: Record<string, any>;
    fileName: string;
}

export const generateDocx = async ({ templateName, data, fileName }: GenerateDocxOptions): Promise<void> => {
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