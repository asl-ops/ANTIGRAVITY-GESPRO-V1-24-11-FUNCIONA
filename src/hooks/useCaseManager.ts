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
    const [vehicle, setVehicle] = useState<Vehicle>(getInitialVehicle());
    const [economicData, setEconomicData] = useState<EconomicData>(getInitialEconomicData());
    const [communications, setCommunications] = useState<Communication[]>([]);
    const [attachments, setAttachments] = useState<AttachedDocument[]>([]);
    const [fileConfig, setFileConfig] = useState<FileConfig>({ fileType: '', category: 'GE-MAT', responsibleUserId: '', customValues: {} });
    const [fileNumber, setFileNumber] = useState('');
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
        if (newCounter !== undefined) {
            setFileNumber(getFileNumber(newCounter));
        }
        setCreatedAt('');
    }, [currentUser, applyEconomicTemplate]);

    const loadCaseData = useCallback((caseToLoad: CaseRecord) => {
        setFileNumber(caseToLoad.fileNumber);
        setClient(caseToLoad.client);
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
        setTasks(caseToLoad.tasks || []);
        setCreatedAt(caseToLoad.createdAt);
    }, []);

    const handleSaveAndReturn = async (currentTasks: Task[]) => {
        if (!currentUser) return false;
        const clientName = client.surnames || client.firstName;
        if (!client.nif || !clientName) {
            addToast('Se requieren datos de cliente (Nombre/Apellidos e Identificador) para guardar.', 'error');
            return false;
        }

        setIsSaving(true);

        const currentCaseData: CaseRecord = {
            fileNumber, client, vehicle, fileConfig, economicData, communications,
            attachments, status: caseStatus, tasks: currentTasks,
            createdAt: createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const { success } = await saveCase(currentCaseData);
        if (success) {
            if (clientName && client.nif && !savedClients.some((c: Client) => c.nif === client.nif)) {
                const newClient = { ...client, id: `cli_${Date.now()} ` };
                await saveClient(newClient);
            }
        }
        setIsSaving(false);
        return success;
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
        vehicle, setVehicle,
        economicData, setEconomicData,
        communications, setCommunications,
        attachments, setAttachments,
        fileConfig, setFileConfig, handleFileConfigChange,
        fileNumber,
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
