import { useState, useCallback } from 'react';
import {
    Client, Vehicle, EconomicData, Communication, FileConfig,
    CaseRecord, AttachedDocument, Task, CaseStatus, FileCategory
} from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/useToast';
import { classifyAndRenameDocument } from '@/services/geminiService';

import {
    getInitialClient, getInitialVehicle, getInitialEconomicData,
    getInitialCommunicationsData, getInitialFileConfig, getFileNumber
} from '@/utils/initializers';

// ... existing code ...

export const useCaseManager = () => {
    const {
        currentUser, economicTemplates, saveCase, saveClient,
        savedClients, caseHistory
    } = useAppContext();
    const { addToast } = useToast();

    const [client, setClient] = useState<Client>(getInitialClient());
    const [clienteId, setClienteId] = useState<string | null>(null);
    const [clientSnapshot, setClientSnapshot] = useState<{
        nombre: string;
        documento?: string;
        telefono?: string;
        email?: string;
    } | null>(null);
    const [vehicle, setVehicle] = useState<Vehicle>(getInitialVehicle());
    const [economicData, setEconomicData] = useState<EconomicData>(getInitialEconomicData());
    const [communications, setCommunications] = useState<Communication[]>([]);
    const [attachments, setAttachments] = useState<AttachedDocument[]>([]);
    const [fileConfig, setFileConfig] = useState<FileConfig>({ fileType: '', category: 'GE-MAT', responsibleUserId: '', customValues: {} });
    const [fileNumber, setFileNumber] = useState('');
    const [description, setDescription] = useState<string>('');  // Nueva descripción del expediente
    const [caseStatus, setCaseStatus] = useState<CaseStatus>('Pendiente Documentación');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [createdAt, setCreatedAt] = useState<string>('');

    const [isClassifying, setIsClassifying] = useState(false);
    const [isBatchProcessing, setIsBatchProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);



    const applyEconomicTemplate = useCallback((templateKey: string, showToast: boolean = true) => {
        const template = economicTemplates[templateKey];
        const newLines = template ? template.filter((line: any) => line.included).map((line: any, index: number) => ({
            id: `line_${Date.now()}_${index}`,
            conceptId: `concept_${Date.now()}_${index}`,
            concept: line.concept,
            type: 'honorario' as const,
            amount: line.amount
        })) : [];
        setEconomicData((prev: EconomicData) => ({ ...prev, lines: newLines }));
        if (template && showToast) {
            addToast(`Plantilla para "${templateKey}" aplicada.`, 'info');
        }
    }, [economicTemplates, addToast]);

    const clearForm = useCallback((newCounter?: number, category?: FileCategory | null) => {
        if (!currentUser) return;
        setClient(getInitialClient());
        setClienteId(null);
        setClientSnapshot(null);
        setVehicle(getInitialVehicle());
        setCommunications(getInitialCommunicationsData(currentUser.id));
        setAttachments([]);
        setTasks([]);

        if (category) {
            const initialConfig = getInitialFileConfig(currentUser.id, category);
            setFileConfig(initialConfig);
            applyEconomicTemplate(initialConfig.fileType, false);
        }

        setCaseStatus('Pendiente Documentación');
        setDescription('');  // Limpiar descripción
        if (newCounter !== undefined) {
            setFileNumber(getFileNumber(newCounter));
        }
        setCreatedAt('');
    }, [currentUser, applyEconomicTemplate]);

    const loadCaseData = useCallback((caseToLoad: CaseRecord) => {
        setFileNumber(caseToLoad.fileNumber);
        setClient(caseToLoad.client);
        setClienteId(caseToLoad.clienteId || null);
        setClientSnapshot(caseToLoad.clientSnapshot || null);
        setVehicle(caseToLoad.vehicle);
        // Asegurar compatibilidad con expedientes antiguos que no tengan categoría
        setFileConfig({
            ...caseToLoad.fileConfig,
            category: caseToLoad.fileConfig.category || 'GE-MAT',
            customValues: caseToLoad.fileConfig.customValues || {}
        });
        setEconomicData(caseToLoad.economicData);
        setCommunications(caseToLoad.communications);
        setAttachments(caseToLoad.attachments || []);
        setCaseStatus(caseToLoad.status);
        setDescription(caseToLoad.description || '');  // Cargar descripción
        setTasks(caseToLoad.tasks || []);
        setCreatedAt(caseToLoad.createdAt);
    }, []);

    const handleSaveAndReturn = async (currentTasks: Task[]) => {
        if (!currentUser) return false;

        // Determinar si tenemos datos suficientes (nombre e identificador)
        const name = clientSnapshot?.nombre || client.surnames || client.firstName;
        const hasIdentifier = !!clienteId || !!client.nif;

        if (!name || !hasIdentifier) {
            addToast('Se requieren datos de cliente (Nombre e Identificador/DNI) para guardar.', 'error');
            return false;
        }

        setIsSaving(true);

        try {
            let finalFileNumber = fileNumber;
            if (!finalFileNumber || finalFileNumber === 'new') {
                // Buscar el número máximo entre TODOS los expedientes
                const allNumbers = caseHistory
                    .map(c => {
                        const match = c.fileNumber.match(/-(\d+)$/);
                        return match ? parseInt(match[1], 10) : 0;
                    })
                    .filter(num => num > 0);

                const maxNumber = allNumbers.length > 0 ? Math.max(...allNumbers) : 0;
                const newCounter = maxNumber + 1;
                finalFileNumber = getFileNumber(newCounter);
                setFileNumber(finalFileNumber);
            }

            const currentCaseData: CaseRecord = {
                fileNumber: finalFileNumber,
                client,
                clienteId,  // 🆕 Guardar referencia a cliente
                clientSnapshot,  // 🆕 Guardar snapshot del cliente
                vehicle,
                fileConfig,
                description,
                economicData,
                communications,
                attachments,
                status: caseStatus,
                tasks: currentTasks,
                createdAt: createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            // Función auxiliar para limpiar undefined de objetos (Firestore no los acepta)
            const cleanUndefined = (obj: any): any => {
                const newObj: any = Array.isArray(obj) ? [] : {};
                Object.keys(obj).forEach(key => {
                    const value = obj[key];
                    if (value === undefined) return;
                    if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
                        newObj[key] = cleanUndefined(value);
                    } else {
                        newObj[key] = value;
                    }
                });
                return newObj;
            };

            const cleanCaseData = cleanUndefined(currentCaseData);

            const { success } = await saveCase(cleanCaseData);
            if (success) {
                if (name && client.nif && !savedClients.some((c: Client) => c.nif === client.nif)) {
                    const newClient = { ...client, id: `cli_${Date.now()} ` };
                    await saveClient(newClient);
                }
            }
            return success;
        } catch (error) {
            console.error('Error al guardar expediente:', error);
            addToast('Error inesperado al guardar el expediente', 'error');
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddDocuments = useCallback(async (files: File[]) => {
        if (files.length === 0) return;
        setIsClassifying(true);
        try {
            const newDocs = await Promise.all(files.map(async (file) => {
                const newName = await classifyAndRenameDocument(file, fileNumber, client, vehicle);
                return { id: `doc - ${Date.now()} -${Math.random()} `, file, name: newName, type: file.type, size: file.size, status: 'local' as const };
            }));
            setAttachments((prev: AttachedDocument[]) => [...prev, ...newDocs]);
            addToast(`${newDocs.length} documento(s) clasificado(s) y añadido(s).`, 'info');
        } catch (error: any) {
            addToast(error.message.includes('API Key') ? error.message : 'Error al clasificar documentos.', 'error');
            setAttachments((prev: AttachedDocument[]) => [...prev, ...files.map(file => ({ id: `doc - ${Date.now()} `, file, name: file.name, type: file.type, size: file.size, status: 'local' as const }))]);
        } finally {
            setIsClassifying(false);
        }
    }, [addToast, client, fileNumber, vehicle]);

    const handleFileConfigChange = (newConfig: FileConfig) => {
        const fileTypeChanged = newConfig.fileType !== fileConfig.fileType;
        setFileConfig(newConfig);
        if (fileTypeChanged) {
            const hasUserData = economicData.lines.some((l: any) => l.concept || l.amount > 0);
            if (!hasUserData) {
                applyEconomicTemplate(newConfig.fileType, false);
            }
        }
    };

    const handleUpdateTaskStatus = async (fileNumberToUpdate: string, taskId: string, isCompleted: boolean) => {
        const caseToUpdate = caseHistory.find((c: CaseRecord) => c.fileNumber === fileNumberToUpdate);
        if (!caseToUpdate) return;

        const updatedTasks = caseToUpdate.tasks.map((task: Task) =>
            task.id === taskId ? { ...task, isCompleted } : task
        );

        const { success } = await saveCase({ ...caseToUpdate, tasks: updatedTasks });
        if (success) addToast(`Tarea actualizada en ${fileNumberToUpdate}.`, 'success');
    };

    const deleteCase = async (fileNumberToDelete: string) => {
        if (!currentUser) return;
        const caseToDelete = caseHistory.find((c: CaseRecord) => c.fileNumber === fileNumberToDelete);
        if (!caseToDelete) return;

        const auditLog: Communication = {
            id: `audit-${Date.now()}`,
            date: new Date().toISOString(),
            concept: `Expediente eliminado por ${currentUser.name}`,
            authorUserId: currentUser.id
        };

        const updatedCase: CaseRecord = {
            ...caseToDelete,
            status: 'Eliminado',
            communications: [...caseToDelete.communications, auditLog],
            updatedAt: new Date().toISOString()
        };

        const { success } = await saveCase(updatedCase);
        if (success) addToast(`Expediente ${fileNumberToDelete} eliminado.`, 'success');
    };

    return {
        client, setClient,
        clienteId, setClienteId,
        clientSnapshot, setClientSnapshot,
        vehicle, setVehicle,
        economicData, setEconomicData,
        communications, setCommunications,
        attachments, setAttachments,
        fileConfig, setFileConfig, handleFileConfigChange,
        fileNumber,
        description, setDescription,  // Exportar descripción
        caseStatus, setCaseStatus,
        tasks, setTasks,
        createdAt,
        isClassifying,
        isBatchProcessing, setIsBatchProcessing,
        isSaving,
        clearForm,
        loadCaseData,
        handleSaveAndReturn,
        handleAddDocuments,
        handleUpdateTaskStatus,
        deleteCase
    };
};
