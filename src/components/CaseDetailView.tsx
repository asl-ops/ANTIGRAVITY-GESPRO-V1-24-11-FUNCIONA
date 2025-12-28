
import React, { useState, useMemo, useCallback } from 'react';
import { Client, Vehicle, Task, CaseStatus, FileConfig, Communication, EconomicData, AttachedDocument, CaseRecord, getCaseStatusBadgeColor, getCaseStatusBorderColor, Administrator } from '../types';
import ClientDataSection from './ClientDataSection';
import VehicleDataSection from './VehicleDataSection';
import EconomicDataSection from './EconomicDataSection';
import HermesIntegrationSection from './HermesIntegrationSection';
import DocumentGeneratorSection from './DocumentGeneratorSection';
import CommunicationsSection from './CommunicationsSection';
import FileConfigSection from './FileConfigSection';
import SettingsModal from './SettingsModal';
import { HeaderIcon, ArrowLeftIcon, SpinnerIcon } from './icons';
import HermesConfigModal from './HermesConfigModal';
import AttachedDocumentsSection from './AttachedDocumentsSection';
import AttachedDocumentsModal from './AttachedDocumentsModal';
import TasksSection from './TasksSection';

import GenerateMandateModal from './GenerateMandateModal';
import AdministratorsModal from './AdministratorsModal';
import { useAppContext } from '../contexts/AppContext';
import { useToast } from '../hooks/useToast';
import HelpSupportSection from './HelpSupportSection';
import { prepareMandateData, generateMandatePDF, generateMandateFileName } from '../services/mandateService';
import { MandateData } from '@/types/mandate';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';

interface CaseDetailViewProps {
    client: Client; setClient: React.Dispatch<React.SetStateAction<Client>>;
    clienteId?: string | null; setClienteId?: (id: string | null) => void;
    clientSnapshot?: {
        nombre: string;
        documento?: string;
        telefono?: string;
        email?: string;
    } | null;
    setClientSnapshot?: (snapshot: {
        nombre: string;
        documento?: string;
        telefono?: string;
        email?: string;
    } | null) => void;
    vehicle: Vehicle; setVehicle: React.Dispatch<React.SetStateAction<Vehicle>>;
    economicData: EconomicData; setEconomicData: React.Dispatch<React.SetStateAction<EconomicData>>;
    communications: Communication[]; setCommunications: React.Dispatch<React.SetStateAction<Communication[]>>;
    attachments: AttachedDocument[]; setAttachments: React.Dispatch<React.SetStateAction<AttachedDocument[]>>;
    tasks: Task[];
    fileConfig: FileConfig; onFileConfigChange: (newConfig: FileConfig) => void;
    fileNumber: string;
    description: string; setDescription: React.Dispatch<React.SetStateAction<string>>;
    caseStatus: CaseStatus; setCaseStatus: React.Dispatch<React.SetStateAction<CaseStatus>>;
    onSaveAndReturn: (tasks: Task[]) => Promise<void>;
    onReturnToDashboard: () => void;
    onBatchVehicleProcessing: (files: File[]) => void;
    isBatchProcessing: boolean;
    onAddDocuments: (files: File[]) => void;
    isClassifying: boolean;
    isSaving: boolean;
    createdAt: string;
    onDeleteClient: (clientId: string) => Promise<void>;
}



const CaseDetailView: React.FC<CaseDetailViewProps> = ({
    client, setClient,
    clienteId, setClienteId,
    clientSnapshot, setClientSnapshot,
    vehicle, setVehicle,
    economicData, setEconomicData,
    communications, setCommunications,
    attachments, setAttachments,
    tasks: propTasks, // Renamed to avoid conflict with state variable
    fileConfig, onFileConfigChange,
    fileNumber,
    description, setDescription,
    caseStatus, setCaseStatus,
    onSaveAndReturn,
    onReturnToDashboard,
    onBatchVehicleProcessing,
    isBatchProcessing,
    onAddDocuments,
    isSaving,
    createdAt
}) => {
    const { currentUser, users, caseHistory, savedClients, saveClient } = useAppContext();
    const { addToast } = useToast();

    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isHermesModalOpen, setIsHermesModalOpen] = useState(false);
    const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
    const [isMandatoModalOpen, setIsMandatoModalOpen] = useState(false);
    const [isAdministratorsModalOpen, setIsAdministratorsModalOpen] = useState(false);
    const [mandatoAsunto, setMandatoAsunto] = useState('');
    const [mandateData, setMandateData] = useState<MandateData | null>(null);
    const [isGeneratingMandate, setIsGeneratingMandate] = useState(false);
    const [tasks, setTasks] = useState<Task[]>(propTasks || []);

    // Detectar si el identificador es de persona jurídica (CIF)
    const isLegalEntity = (nif: string): boolean => {
        if (!nif || nif.length < 1) return false;
        const firstChar = nif.charAt(0).toUpperCase();
        return /^[ABCDEFGHJNPQRSUVW]/.test(firstChar);
    };

    // Handler para actualizar cliente con sincronización de administradores
    const handleUpdateClientWithSync = useCallback(async (updatedClient: Client) => {
        setClient(updatedClient);

        // Si es persona jurídica y tiene NIF, sincronizar administradores globalmente
        if (isLegalEntity(updatedClient.nif) && updatedClient.nif.length >= 9) {
            const existingClient = savedClients.find(c => c.nif.toUpperCase() === updatedClient.nif.toUpperCase());
            if (existingClient) {
                // Actualizar el cliente guardado con los nuevos administradores
                const syncedClient = { ...existingClient, administrators: updatedClient.administrators };
                await saveClient(syncedClient);
                addToast('Administradores sincronizados.', 'success');
            } else if (updatedClient.surnames || updatedClient.firstName) {
                // Si el cliente no existe pero tiene datos suficientes, guardarlo
                const newClient = { ...updatedClient, id: `cli_${Date.now()}` };
                await saveClient(newClient);
                addToast('Cliente guardado con administradores.', 'success');
            }
        }
    }, [savedClients, saveClient, setClient, addToast]);

    const predictedFileNumber = useMemo(() => {
        if (fileNumber !== 'new') return fileNumber;
        if (!caseHistory || caseHistory.length === 0) return 'EXP-0001';

        // Buscar el número máximo entre TODOS los expedientes, independientemente del prefijo
        const allNumbers = caseHistory
            .map(c => {
                const match = c.fileNumber.match(/-(\d+)$/);
                return match ? parseInt(match[1], 10) : 0;
            })
            .filter(num => num > 0);

        if (allNumbers.length === 0) return 'EXP-0001';

        const maxNumber = Math.max(...allNumbers);
        const nextNum = maxNumber + 1;
        return `EXP-${String(nextNum).padStart(4, '0')}`;
    }, [fileNumber, caseHistory]);

    const handleOpenMandatoModal = () => {
        const asuntoMap: { [key: string]: string[] } = {
            'Transferencia': ['CAMBIO DE TITULARIDAD VEHICULO', 'PAGO IMPUESTO DE TRANSMISIONES'],
            'Matriculación Nacional': ['MATRICULACIÓN VEHÍCULO NACIONAL'],
            'Importación UE': ['MATRICULACIÓN VEHÍCULO IMPORTACIÓN UE'],
            'Duplicado Permiso': ['DUPLICADO PERMISO DE CIRCULACIÓN'],
            'Baja Definitiva': ['BAJA DEFINITIVA DEL VEHÍCULO'],
            'Informe DGT': ['SOLICITUD INFORME DE TRÁFICO']
        };
        const defaultAsunto = (asuntoMap[fileConfig.fileType] || [fileConfig.fileType.toUpperCase()]).join('\n');
        setMandatoAsunto(defaultAsunto);

        // Preparar datos del mandato
        if (appSettings) {
            const data = prepareMandateData(client, defaultAsunto, '', appSettings);
            setMandateData(data);
        }

        setIsMandatoModalOpen(true);
    };

    const { appSettings } = useAppContext();

    const handleGenerateMandato = async (asuntoLinea1: string, asuntoLinea2: string, selectedAdminId?: string) => {
        if (!currentUser || !appSettings) return;

        setIsGeneratingMandate(true);

        try {
            // Buscar administrador si se seleccionó uno
            let selectedAdmin: Administrator | undefined;
            if (selectedAdminId && client.administrators) {
                selectedAdmin = client.administrators.find(a => a.id === selectedAdminId);
            }

            // Preparar datos del mandato
            const data = prepareMandateData(client, asuntoLinea1, asuntoLinea2, appSettings, selectedAdmin);

            if (!data) {
                addToast('No se ha configurado el mandatario. Ve al Panel del Responsable.', 'error');
                setIsGeneratingMandate(false);
                return;
            }

            // Generar PDF
            const fileName = generateMandateFileName(
                `${client.firstName} ${client.surnames}`,
                fileNumber === 'new' ? predictedFileNumber : fileNumber
            );

            const pdfBlob = await generateMandatePDF('mandate-content', fileName);

            // Subir a Firebase Storage
            const storageRef = ref(storage, `mandates/${fileNumber}/${fileName}`);
            await uploadBytes(storageRef, pdfBlob);
            const downloadURL = await getDownloadURL(storageRef);

            // Añadir como documento adjunto
            const newAttachment = {
                id: `mandate-${Date.now()}`,
                name: fileName,
                type: 'application/pdf',
                size: pdfBlob.size,
                status: 'synced' as const,
                url: downloadURL,
            };

            setAttachments(prev => [...prev, newAttachment]);

            addToast('Mandato generado y guardado correctamente', 'success');
            setIsMandatoModalOpen(false);
        } catch (error) {
            console.error('Error generando mandato:', error);
            addToast('Error al generar el mandato', 'error');
        } finally {
            setIsGeneratingMandate(false);
        }
    };



    if (!currentUser) return <div className="min-h-screen flex items-center justify-center"><SpinnerIcon /></div>;

    const currentCaseDataForModal: CaseRecord = {
        fileNumber, client, vehicle, fileConfig, economicData, communications,
        attachments, status: caseStatus, tasks,
        createdAt,
        updatedAt: new Date().toISOString(),
    };

    // Lógica para selectores de cabecera
    const FALLBACK_STATUSES = ['Pendiente Documentación', 'En Tramitación', 'Finalizado', 'Archivado'];
    const availableStatuses = (appSettings?.caseStatuses && appSettings.caseStatuses.length > 0) ? appSettings.caseStatuses : FALLBACK_STATUSES;
    const responsibleUser = users.find(u => u.id === fileConfig.responsibleUserId);

    const handleResponsibleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFileConfigChange({ ...fileConfig, responsibleUserId: e.target.value });
    };

    return (
        <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={onReturnToDashboard}
                            className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors"
                            title="Volver al Dashboard"
                        >
                            <ArrowLeftIcon />
                            <span className="text-sm font-medium">Volver</span>
                        </button>
                        <HeaderIcon />
                        <div className="flex items-baseline space-x-2">
                            <span className="text-3xl font-bold text-slate-900">Expediente:</span>
                            <span className="font-bold text-3xl text-sky-600">
                                {fileNumber === 'new' ? predictedFileNumber : fileNumber}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                            <span className="text-sm font-medium text-slate-600">-</span>
                            <select
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all bg-white"
                            >
                                <option value="">Seleccionar descripción...</option>
                                {fileConfig.category === 'FI-TRI' && (
                                    <>
                                        <option value="1T">Primer Trimestre</option>
                                        <option value="2T">Segundo Trimestre</option>
                                        <option value="3T">Tercer Trimestre</option>
                                        <option value="4T">Cuarto Trimestre</option>
                                    </>
                                )}
                                {fileConfig.category === 'FI-CONTA' && (
                                    <>
                                        <option value="Anual">Contabilidad Anual</option>
                                        <option value="Mensual">Contabilidad Mensual</option>
                                        <option value="Trimestral">Contabilidad Trimestral</option>
                                    </>
                                )}
                                {fileConfig.category === 'GE-MAT' && (
                                    <>
                                        <option value="Matriculación">Matriculación</option>
                                        <option value="Transferencia">Transferencia</option>
                                        <option value="Baja">Baja de Vehículo</option>
                                        <option value="Duplicado">Duplicado de Documentación</option>
                                        <option value="Cambio Titular">Cambio de Titular</option>
                                    </>
                                )}
                            </select>

                            {/* Situación Actual */}
                            <div className="ml-4">
                                {availableStatuses.length > 0 ? (
                                    <select
                                        value={caseStatus}
                                        onChange={(e) => setCaseStatus(e.target.value as CaseStatus)}
                                        className={`px-3 py-1.5 text-sm border rounded-lg shadow-sm font-semibold focus:outline-none focus:ring-2 ${getCaseStatusBadgeColor(caseStatus)} ${getCaseStatusBorderColor(caseStatus)}`}
                                    >
                                        {availableStatuses.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={caseStatus}
                                        onChange={(e) => setCaseStatus(e.target.value as CaseStatus)}
                                        className="px-3 py-1.5 border border-slate-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm"
                                    />
                                )}
                            </div>

                            {/* Gestor Responsable */}
                            <div className="flex items-center space-x-2 ml-4">
                                {responsibleUser && (
                                    <span className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg text-white text-xs font-bold shadow-sm ${responsibleUser.avatarColor}`}>
                                        {responsibleUser.initials}
                                    </span>
                                )}
                                <select
                                    value={fileConfig.responsibleUserId}
                                    onChange={handleResponsibleChange}
                                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all bg-white"
                                >
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </header>
                <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <ClientDataSection
                            client={client}
                            setClient={setClient}
                            clienteId={clienteId}
                            setClienteId={setClienteId}
                            clientSnapshot={clientSnapshot}
                            setClientSnapshot={setClientSnapshot}
                            onDocumentProcessed={(f) => onAddDocuments([f])}
                        />
                        <VehicleDataSection vehicle={vehicle} setVehicle={setVehicle} fileType={fileConfig.fileType} onBatchProcess={onBatchVehicleProcessing} isBatchProcessing={isBatchProcessing} onDocumentProcessed={(f) => onAddDocuments([f])} />
                        <EconomicDataSection economicData={economicData} setEconomicData={setEconomicData} />
                        <TasksSection tasks={tasks} setTasks={setTasks} users={users} currentUser={currentUser} caseResponsibleUserId={fileConfig.responsibleUserId} attachments={attachments} fileConfig={fileConfig} client={client} />
                        <CommunicationsSection communications={communications} setCommunications={setCommunications} currentUser={currentUser} users={users} client={client} />
                    </div>
                    <div className="lg:col-span-1 space-y-8">
                        <FileConfigSection
                            fileConfig={fileConfig}
                            onFileConfigChange={onFileConfigChange}
                            onOpenSettings={() => setIsSettingsModalOpen(true)}
                            client={client}
                            onOpenAdministratorsModal={() => setIsAdministratorsModalOpen(true)}
                        />
                        <HermesIntegrationSection onOpen={() => setIsHermesModalOpen(true)} />
                        <AttachedDocumentsSection onOpen={() => setIsDocumentsModalOpen(true)} />
                        <DocumentGeneratorSection client={client} vehicle={vehicle} economicData={economicData} communications={communications} attachments={attachments} fileNumber={fileNumber} fileConfig={fileConfig} tasks={tasks} users={users} onOpenMandatoModal={handleOpenMandatoModal} caseStatus={caseStatus} createdAt={createdAt} onAddDocuments={onAddDocuments} />
                        <HelpSupportSection />
                        <div className="bg-white p-6 rounded-xl shadow-md">
                            <h3 className="text-lg font-semibold mb-4">Acciones</h3>
                            <button onClick={() => onSaveAndReturn(tasks)} disabled={isSaving} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center disabled:bg-sky-400">
                                {isSaving ? <><SpinnerIcon /> <span className="ml-2">Guardando...</span></> : 'Guardar y Volver'}
                            </button>
                        </div>
                    </div>
                </main>
                {isSettingsModalOpen && <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />}
                {isHermesModalOpen && <HermesConfigModal isOpen={isHermesModalOpen} onClose={() => setIsHermesModalOpen(false)} caseRecord={currentCaseDataForModal} />}
                {isDocumentsModalOpen && <AttachedDocumentsModal isOpen={isDocumentsModalOpen} onClose={() => setIsDocumentsModalOpen(false)} attachments={attachments} setAttachments={setAttachments} onAddDocuments={onAddDocuments} fileNumber={fileNumber} />}
                {isMandatoModalOpen && mandateData && (
                    <GenerateMandateModal
                        isOpen={isMandatoModalOpen}
                        onClose={() => setIsMandatoModalOpen(false)}
                        client={client}
                        fileNumber={fileNumber === 'new' ? predictedFileNumber : fileNumber}
                        defaultAsunto={mandatoAsunto}
                        mandateData={mandateData}
                        onGenerate={handleGenerateMandato}
                        isGenerating={isGeneratingMandate}
                    />
                )}
                {isAdministratorsModalOpen && (
                    <AdministratorsModal
                        isOpen={isAdministratorsModalOpen}
                        onClose={() => setIsAdministratorsModalOpen(false)}
                        client={client}
                        onUpdateClient={handleUpdateClientWithSync}
                    />
                )}
                <footer className="text-center mt-12 text-slate-500 text-sm"><p>&copy; {new Date().getFullYear()} Gestor de Expedientes Pro.</p></footer>
            </div>
        </div>
    );
};

export default CaseDetailView;
