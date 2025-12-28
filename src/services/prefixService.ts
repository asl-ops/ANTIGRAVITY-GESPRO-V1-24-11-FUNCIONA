import { db } from '../services/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { PrefixConfig } from '../types';

const prefixesCollection = collection(db, 'prefixes');

// Fetch all active prefixes
export const getPrefixes = async (): Promise<PrefixConfig[]> => {
    try {
        const snapshot = await getDocs(prefixesCollection);
        const data: PrefixConfig[] = [];
        snapshot.forEach((docSnapshot) => {
            const pref = { ...docSnapshot.data(), id: docSnapshot.id } as PrefixConfig;
            if (pref.isActive) {
                data.push(pref);
            }
        });
        return data;
    } catch (error) {
        console.error('Error fetching prefixes:', error);
        return [];
    }
};

// Create a new prefix
export const createPrefix = async (prefix: PrefixConfig): Promise<void> => {
    try {
        const prefixDoc = doc(prefixesCollection, prefix.id);
        await setDoc(prefixDoc, prefix);
    } catch (error) {
        console.error('Error creating prefix:', error);
        throw error;
    }
};

// Save/update an existing prefix
export const savePrefix = async (prefix: PrefixConfig): Promise<void> => {
    try {
        const prefixDoc = doc(prefixesCollection, prefix.id);
        await setDoc(prefixDoc, prefix, { merge: true });
    } catch (error) {
        console.error('Error saving prefix:', error);
        throw error;
    }
};

// Delete a prefix
export const deletePrefix = async (prefixId: string): Promise<void> => {
    try {
        const prefixDoc = doc(prefixesCollection, prefixId);
        await deleteDoc(prefixDoc);
    } catch (error) {
        console.error('Error deleting prefix:', error);
        throw error;
    }
};
