
import { db } from './firebase';
import { collection, doc, getDocs, getDoc, setDoc, writeBatch, deleteDoc, query, where } from 'firebase/firestore';
import { CaseRecord, Client, EconomicTemplates, AppSettings, Vehicle, DEFAULT_CASE_STATUSES, FileCategory } from '@/types';
import { INITIAL_ECONOMIC_TEMPLATES } from './templates';
import { DEFAULT_MANDATO_BODY } from './templateContent';

const caseCollection = collection(db, 'cases');
const clientCollection = collection(db, 'clients');
const vehicleCollection = collection(db, 'vehicles');
const settingsDoc = doc(db, 'settings', 'app-settings');
const templatesDoc = doc(db, 'economicTemplates', 'default');


export const getCaseHistory = async (): Promise<CaseRecord[]> => {
    const snapshot = await getDocs(caseCollection);
    return snapshot.docs.map(doc => doc.data() as CaseRecord);
};

/**
 * 🆕 Obtiene expedientes de un cliente específico (sistema centralizado)
 */
export const getCasesByClientId = async (clientId: string): Promise<CaseRecord[]> => {
    const q = query(caseCollection, where('clienteId', '==', clientId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as CaseRecord);
};

export const saveOrUpdateCase = async (caseRecord: CaseRecord): Promise<{ updatedHistory: CaseRecord[], isNew: boolean }> => {
    const caseDocRef = doc(db, 'cases', caseRecord.fileNumber);
    const caseDoc = await getDoc(caseDocRef);
    const isNew = !caseDoc.exists();

    const serializableRecord = {
        ...caseRecord,
        attachments: caseRecord.attachments.map(({ file, ...rest }) => rest),
    };

    const recordToSave: CaseRecord = {
        ...serializableRecord,
        updatedAt: new Date().toISOString(),
        createdAt: isNew ? new Date().toISOString() : caseRecord.createdAt,
    };

    await setDoc(caseDocRef, recordToSave, { merge: true });

    const updatedHistory = await getCaseHistory();
    return { updatedHistory, isNew };
};

export const deleteCase = async (fileNumber: string): Promise<CaseRecord[]> => {
    const caseDocRef = doc(db, 'cases', fileNumber);
    await deleteDoc(caseDocRef);
    return getCaseHistory();
};

export const saveMultipleCases = async (cases: CaseRecord[]): Promise<CaseRecord[]> => {
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    const serializableCases = cases.map(caseRecord => {
        // Create a shallow copy to modify
        const docData = { ...caseRecord };

        // Handle attachments (strip file objects)
        docData.attachments = caseRecord.attachments.map(({ file, ...rest }) => rest);

        // Update timestamps
        docData.updatedAt = now;
        // Only set createdAt if it doesn't exist (handle new cases vs updates)
        if (!docData.createdAt) {
            docData.createdAt = now;
        }

        // Sanitize undefined values (Firestore doesn't like them)
        Object.keys(docData).forEach(key => {
            const k = key as keyof CaseRecord;
            if (docData[k] === undefined) {
                delete docData[k];
            }
        });

        return docData;
    });

    serializableCases.forEach(c => {
        const docRef = doc(db, 'cases', c.fileNumber);
        batch.set(docRef, c);
    });

    await batch.commit();
    return getCaseHistory();
};

export const getNextFileNumber = async (_category: string): Promise<string> => {
    const allCases = await getCaseHistory();
    // Filter by category if needed, but usually numbering is global or per type. 
    // The requirement says "assign automatically the next correlative number available for that type of expedient".
    // Assuming the prefix (e.g. EXP) might change or just the number.
    // Let's assume a global sequence for simplicity unless prefixes differ significantly.
    // However, the user mentioned "Type: RECLAMACION" -> "last number for that Type".
    // So we should filter by the prefix associated with the type or just the type itself if the number includes it.
    // Current implementation uses "EXP-XXXX". 
    // If the user wants different prefixes per type, we need to know them.
    // For now, I will implement a logic that looks for the highest number in the current format "EXP-XXXX" 
    // OR if the user wants specific prefixes per type, I'll need to map them.
    // Looking at the codebase, `getPrefixes` exists in `prefixService`.
    // But the user prompt says: "Input (Tipo)... Consulta... último número correlativo asignado para el 'Tipo: RECLAMACION'".
    // This implies the numbering might be scoped by type.
    // Let's look at existing file numbers. They seem to be 'EXP-0001'.
    // I will implement a generic finder that looks for the pattern and increments.

    // Actually, looking at the prompt again: "N_nuevo = N_último + 1".
    // And "Generación: ... con el N_nuevo y el 'Tipo: GE-MAT'".
    // This suggests the number is just a number, maybe with a prefix.
    // I'll stick to the existing 'EXP-' prefix for now but make it robust.

    // Wait, if I filter by type, and different types share the "EXP-" prefix, we might have collisions if we don't check GLOBAL max.
    // If the requirement is "correlative number for THAT TYPE", it implies independent sequences?
    // "asignar automáticamente el siguiente número correlativo disponible para ese tipo de expediente"
    // If Type A has EXP-001 and Type B has EXP-001, that's a collision if ID is fileNumber.
    // ID IS fileNumber. So they must be unique globally OR have different prefixes.
    // I will assume they share the sequence OR have different prefixes.
    // Let's assume global sequence for "EXP-" for now to be safe, OR ask.
    // But the prompt says "para ese tipo". 
    // Let's look at `getPrefixes` usage in Dashboard.
    // It seems prefixes are loaded.

    // I'll implement a safe global increment for now to avoid ID collisions, 
    // but filtered by the "prefix" if the type determines the prefix.
    // If the type is just a category (GE-MAT), and the fileNumber is EXP-001, it's global.

    const sortedCases = allCases.sort((a, b) => b.fileNumber.localeCompare(a.fileNumber, undefined, { numeric: true, sensitivity: 'base' }));

    let nextNum = 1;
    if (sortedCases.length > 0) {
        const lastFileNumber = sortedCases[0].fileNumber;
        const match = lastFileNumber.match(/(\d+)$/);
        if (match) {
            nextNum = parseInt(match[1], 10) + 1;
        }
    }

    return `EXP-${String(nextNum).padStart(4, '0')}`;
};

export const createNewCase = async (category: FileCategory, subType?: string): Promise<CaseRecord> => {
    const fileNumber = await getNextFileNumber(category);

    const newCase: CaseRecord = {
        fileNumber,
        client: {
            id: '',
            surnames: '',
            firstName: '',
            nif: '',
            address: '',
            city: '',
            province: '',
            postalCode: '',
            phone: '',
            email: '',
        },
        vehicle: {
            vin: '',
            brand: '',
            model: '',
            year: '',
            engineSize: '',
            fuelType: '',
        },
        fileConfig: {
            fileType: subType || '',
            category: category,
            responsibleUserId: '',
            customValues: {}
        },
        economicData: {
            lines: [],
            subtotalAmount: 0,
            vatAmount: 0,
            totalAmount: 0
        },
        communications: [],
        status: 'Pendiente Documentación',
        attachments: [],
        tasks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        situation: 'Iniciado' // Default situation
    };

    await saveOrUpdateCase(newCase);
    return newCase;
};

export const getSavedClients = async (): Promise<Client[]> => {
    const snapshot = await getDocs(clientCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Client));
};

export const saveOrUpdateClient = async (client: Client): Promise<Client[]> => {
    const { id, ...clientData } = client;
    if (!id) {
        throw new Error("Client must have an ID to be saved or updated.");
    }
    const clientDocRef = doc(db, 'clients', id);
    await setDoc(clientDocRef, clientData);
    return getSavedClients();
};

export const deleteClient = async (clientId: string): Promise<Client[]> => {
    const clientDocRef = doc(db, 'clients', clientId);
    await deleteDoc(clientDocRef);
    return getSavedClients();
};

export const getSavedVehicles = async (): Promise<Vehicle[]> => {
    const snapshot = await getDocs(vehicleCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Vehicle));
};

export const saveOrUpdateVehicle = async (vehicle: Vehicle): Promise<Vehicle[]> => {
    const { id, ...vehicleData } = vehicle;
    if (!id) throw new Error("Vehicle must have an ID to be saved or updated.");

    const vehicleDocRef = doc(db, 'vehicles', id);
    await setDoc(vehicleDocRef, vehicleData, { merge: true });
    return getSavedVehicles();
};

export const getSettings = async (): Promise<AppSettings> => {
    const docSnap = await getDoc(settingsDoc);

    // Configuración por defecto robusta
    const defaultFieldConfigs = {
        'GE-MAT': [
            { id: 'jefatura', label: 'Jefatura Provincial', options: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Almería'] },
            { id: 'etiqueta', label: 'Distintivo Ambiental', options: ['0 Emisiones', 'ECO', 'C', 'B', 'Sin Distintivo'] }
        ],
        'FI-TRI': [
            { id: 'modelo', label: 'Modelo', options: ['303', '111', '115', '390', '190'] },
            { id: 'trimestre', label: 'Periodo', options: ['1T', '2T', '3T', '4T', 'Anual'] }
        ],
        'FI-CONTA': [
            { id: 'tipo_libro', label: 'Tipo de Libro', options: ['Diario', 'Inventario y Cuentas', 'Actas', 'Socios'] }
        ]
    };

    const defaultFileTypes = {
        'GE-MAT': ['Matriculación', 'Transferencia', 'Baja', 'Duplicado', 'Informe', 'Importación'],
        'FI-TRI': ['Presentación Trimestral', 'Declaración Renta', 'Impuesto Sociedades', 'Recurso'],
        'FI-CONTA': ['Contabilidad Mensual', 'Cierre Anual', 'Legalización Libros']
    };

    const defaultAgency = {
        name: 'Gestoría Administrativa Modelo',
        cif: '',
        address: '',
        managerName: '',
        managerColegiado: '',
        managerDni: ''
    };

    const defaultSettings: AppSettings = {
        fileCounter: 1,
        generalSavePath: 'C:\\GESTORIA\\EXPEDIENTES\\',
        mandatoBody: DEFAULT_MANDATO_BODY,
        agency: defaultAgency,
        fieldConfigs: defaultFieldConfigs,
        caseStatuses: DEFAULT_CASE_STATUSES,
        fileTypes: defaultFileTypes
    };

    if (docSnap.exists()) {
        const data = docSnap.data() as any;
        // Fusionar con defaults para asegurar que existan las nuevas propiedades
        const settings: AppSettings = {
            ...defaultSettings,
            ...data,
            agency: data.agency || defaultAgency,
            fieldConfigs: data.fieldConfigs || defaultFieldConfigs,
            caseStatuses: data.caseStatuses || DEFAULT_CASE_STATUSES,
            fileTypes: data.fileTypes || defaultFileTypes
        };

        // Si faltan campos clave en la DB, guardarlos
        if (!data.agency || !data.caseStatuses || !data.fileTypes) {
            await setDoc(settingsDoc, settings, { merge: true });
        }

        return settings;
    }

    // Crear configuración inicial si no existe
    await setDoc(settingsDoc, defaultSettings);
    return defaultSettings;
};

export const saveSettings = async (settings: Partial<AppSettings>): Promise<void> => {
    await setDoc(settingsDoc, settings, { merge: true });
};

export const getEconomicTemplates = async (): Promise<EconomicTemplates> => {
    const docSnap = await getDoc(templatesDoc);
    if (docSnap.exists()) {
        const data = docSnap.data() as any;
        if (data && data.templates) {
            return data.templates as EconomicTemplates;
        }
    }
    await setDoc(templatesDoc, { templates: INITIAL_ECONOMIC_TEMPLATES });
    return INITIAL_ECONOMIC_TEMPLATES;
};

export const saveEconomicTemplates = async (templates: EconomicTemplates): Promise<void> => {
    await setDoc(templatesDoc, { templates });
};
