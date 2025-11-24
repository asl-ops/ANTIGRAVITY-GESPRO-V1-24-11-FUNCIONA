import { collection, doc, getDocs, setDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { PrefixConfig, PrefixLine } from '@/types';

const PREFIXES_COLLECTION = 'prefixes';

/**
 * Get all prefix configurations
 */
export const getPrefixes = async (): Promise<PrefixConfig[]> => {
    try {
        const prefixesRef = collection(db, PREFIXES_COLLECTION);
        const q = query(prefixesRef, orderBy('code', 'asc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as PrefixConfig));
    } catch (error) {
        console.error('Error getting prefixes:', error);
        return [];
    }
};

/**
 * Get only active prefix configurations
 */
export const getActivePrefixes = async (): Promise<PrefixConfig[]> => {
    try {
        const prefixesRef = collection(db, PREFIXES_COLLECTION);
        const q = query(
            prefixesRef,
            where('isActive', '==', true),
            orderBy('code', 'asc')
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as PrefixConfig));
    } catch (error) {
        console.error('Error getting active prefixes:', error);
        return [];
    }
};

/**
 * Get a single prefix by ID
 */
export const getPrefixById = async (prefixId: string): Promise<PrefixConfig | null> => {
    try {
        const prefixes = await getPrefixes();
        return prefixes.find(p => p.id === prefixId) || null;
    } catch (error) {
        console.error('Error getting prefix by ID:', error);
        return null;
    }
};

/**
 * Save or update a prefix configuration
 */
export const savePrefix = async (prefix: PrefixConfig): Promise<void> => {
    try {
        const prefixRef = doc(db, PREFIXES_COLLECTION, prefix.id);
        await setDoc(prefixRef, {
            ...prefix,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error saving prefix:', error);
        throw new Error('No se pudo guardar el prefijo. Verifica tu conexión.');
    }
};

/**
 * Delete a prefix configuration (soft delete by setting isActive to false)
 */
export const deletePrefix = async (prefixId: string): Promise<void> => {
    try {
        const prefix = await getPrefixById(prefixId);
        if (!prefix) {
            throw new Error('Prefijo no encontrado');
        }

        // Soft delete: just mark as inactive
        await savePrefix({
            ...prefix,
            isActive: false
        });
    } catch (error) {
        console.error('Error deleting prefix:', error);
        throw new Error('No se pudo eliminar el prefijo.');
    }
};

/**
 * Hard delete a prefix (use with caution)
 */
export const hardDeletePrefix = async (prefixId: string): Promise<void> => {
    try {
        const prefixRef = doc(db, PREFIXES_COLLECTION, prefixId);
        await deleteDoc(prefixRef);
    } catch (error) {
        console.error('Error hard deleting prefix:', error);
        throw new Error('No se pudo eliminar el prefijo permanentemente.');
    }
};

/**
 * Create a new prefix with default configuration
 */
export const createPrefix = async (code: string, description: string): Promise<PrefixConfig> => {
    const newPrefix: PrefixConfig = {
        id: `prefix_${Date.now()}`,
        code: code.toUpperCase(),
        description,
        isActive: true,
        lines: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    await savePrefix(newPrefix);
    return newPrefix;
};

/**
 * Update prefix lines
 */
export const updatePrefixLines = async (prefixId: string, lines: PrefixLine[]): Promise<void> => {
    try {
        const prefix = await getPrefixById(prefixId);
        if (!prefix) {
            throw new Error('Prefijo no encontrado');
        }

        await savePrefix({
            ...prefix,
            lines
        });
    } catch (error) {
        console.error('Error updating prefix lines:', error);
        throw new Error('No se pudieron actualizar las líneas del prefijo.');
    }
};
