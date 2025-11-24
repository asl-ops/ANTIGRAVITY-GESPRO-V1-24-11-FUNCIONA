
import { db } from './firebase';
import { collection, doc, getDocs, getDoc, setDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import { CaseRecord, Client, EconomicTemplates, AppSettings, Vehicle, DEFAULT_CASE_STATUSES } from '@/types';
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

export const saveMultipleCases = async (newCases: CaseRecord[]): Promise<CaseRecord[]> => {
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    const serializableNewCases = newCases.map(caseRecord => ({
        ...caseRecord,
        createdAt: now,
        updatedAt: now,
        attachments: caseRecord.attachments.map(({ file, ...rest }) => rest),
    }));

    serializableNewCases.forEach(c => {
        const docRef = doc(db, 'cases', c.fileNumber);
        batch.set(docRef, c);
    });

    await batch.commit();
    return getCaseHistory();
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
