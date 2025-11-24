import { collection, doc, getDocs, setDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { MandateTemplate } from '@/types';

const TEMPLATES_COLLECTION = 'mandateTemplates';
const TEMPLATES_STORAGE_PATH = 'mandate-templates';

/**
 * Upload template file to Firebase Storage
 */
export const uploadTemplateFile = async (file: File): Promise<string> => {
    try {
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        const storageRef = ref(storage, `${TEMPLATES_STORAGE_PATH}/${fileName}`);

        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        return downloadURL;
    } catch (error) {
        console.error('Error uploading template file:', error);
        throw error;
    }
};

/**
 * Create a new mandate template
 */
export const createTemplate = async (
    name: string,
    file: File,
    userId: string,
    prefixId?: string,
    description?: string
): Promise<MandateTemplate> => {
    try {
        const fileUrl = await uploadTemplateFile(file);

        // Extract variables from template (simplified - in production, parse DOCX)
        const commonVariables = [
            'CLIENT_FULL_NAME', 'CLIENT_NIF', 'CLIENT_ADDRESS',
            'GESTOR_NAME', 'GESTOR_DNI', 'GESTOR_COLEGIADO_NUM',
            'GESTOR_DESPACHO', 'GESTOR_DESPACHO_DIRECCION',
            'CURRENT_CITY', 'CURRENT_DAY', 'CURRENT_MONTH', 'CURRENT_YEAR',
            'ASUNTO', 'VEHICLE_VIN', 'VEHICLE_BRAND', 'VEHICLE_MODEL'
        ];

        const template: MandateTemplate = {
            id: `template_${Date.now()}`,
            name,
            description,
            prefixId,
            fileUrl,
            fileName: file.name,
            variables: commonVariables,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: userId
        };

        await setDoc(doc(db, TEMPLATES_COLLECTION, template.id), template);
        return template;
    } catch (error) {
        console.error('Error creating template:', error);
        throw error;
    }
};

/**
 * Get all templates
 */
export const getTemplates = async (): Promise<MandateTemplate[]> => {
    try {
        const templatesRef = collection(db, TEMPLATES_COLLECTION);
        const q = query(templatesRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => doc.data() as MandateTemplate);
    } catch (error) {
        console.error('Error getting templates:', error);
        return [];
    }
};

/**
 * Get active templates
 */
export const getActiveTemplates = async (): Promise<MandateTemplate[]> => {
    try {
        const templatesRef = collection(db, TEMPLATES_COLLECTION);
        const q = query(
            templatesRef,
            where('isActive', '==', true),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => doc.data() as MandateTemplate);
    } catch (error) {
        console.error('Error getting active templates:', error);
        return [];
    }
};

/**
 * Get template by prefix
 */
export const getTemplateByPrefix = async (prefixId: string): Promise<MandateTemplate | null> => {
    try {
        const templatesRef = collection(db, TEMPLATES_COLLECTION);
        const q = query(
            templatesRef,
            where('prefixId', '==', prefixId),
            where('isActive', '==', true),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            // Try to get global template
            return getGlobalTemplate();
        }

        return snapshot.docs[0].data() as MandateTemplate;
    } catch (error) {
        console.error('Error getting template by prefix:', error);
        return null;
    }
};

/**
 * Get global template (no prefix)
 */
export const getGlobalTemplate = async (): Promise<MandateTemplate | null> => {
    try {
        const templatesRef = collection(db, TEMPLATES_COLLECTION);
        const q = query(
            templatesRef,
            where('prefixId', '==', null),
            where('isActive', '==', true),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;
        return snapshot.docs[0].data() as MandateTemplate;
    } catch (error) {
        console.error('Error getting global template:', error);
        return null;
    }
};

/**
 * Update template
 */
export const updateTemplate = async (
    templateId: string,
    updates: Partial<MandateTemplate>
): Promise<void> => {
    try {
        const templateRef = doc(db, TEMPLATES_COLLECTION, templateId);
        await setDoc(templateRef, {
            ...updates,
            updatedAt: new Date().toISOString()
        }, { merge: true });
    } catch (error) {
        console.error('Error updating template:', error);
        throw error;
    }
};

/**
 * Delete template (soft delete)
 */
export const deleteTemplate = async (templateId: string): Promise<void> => {
    try {
        await updateTemplate(templateId, { isActive: false });
    } catch (error) {
        console.error('Error deleting template:', error);
        throw error;
    }
};

/**
 * Permanently delete template and file
 */
export const permanentlyDeleteTemplate = async (template: MandateTemplate): Promise<void> => {
    try {
        // Delete from Firestore
        await deleteDoc(doc(db, TEMPLATES_COLLECTION, template.id));

        // Delete from Storage
        const storageRef = ref(storage, template.fileUrl);
        await deleteObject(storageRef);
    } catch (error) {
        console.error('Error permanently deleting template:', error);
        throw error;
    }
};
