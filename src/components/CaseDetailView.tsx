
import React, { useState, useEffect } from 'react';
import { Client, Vehicle, User, Task, CaseStatus, DEFAULT_CASE_STATUSES, getCaseStatusBadgeColor, getCaseStatusBorderColor, FileConfig, Communication, EconomicData, AttachedDocument, CaseRecord } from '../types';
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

import MandatoAsuntoModal from './MandatoAsuntoModal';
import { useAppContext } from '../contexts/AppContext';
import { useToast } from '../hooks/useToast';
import HelpSupportSection from './HelpSupportSection';
import { generateMandatoPDF, generateMandatoDOCX } from '../services/documentService';
import { getActiveTemplates } from '../services/templateService';
import { MandateTemplate } from '../types';
import AutoSaveIndicator from './AutoSaveIndicator';
import { useAutoSave } from '../hooks/useAutoSave';

interface CaseDetailViewProps {
    client: Client; setClient: React.Dispatch<React.SetStateAction<Client>>;
    vehicle: Vehicle; setVehicle: React.Dispatch<React.SetStateAction<Vehicle>>;
    economicData: EconomicData; setEconomicData: React.Dispatch<React.SetStateAction<EconomicData>>;
    communications: Communication[]; setCommunications: React.Dispatch<React.SetStateAction<Communication[]>>;
    attachments: AttachedDocument[]; setAttachments: React.Dispatch<React.SetStateAction<AttachedDocument[]>>;
    tasks: Task[];
    fileConfig: FileConfig; onFileConfigChange: (newConfig: FileConfig) => void;
    fileNumber: string;
    caseStatus: CaseStatus; setCaseStatus: React.Dispatch<React.SetStateAction<CaseStatus>>;
    onSaveAndReturn: (tasks: Task[]) => Promise<void>;
    onReturnToDashboard: () => void;
    onCreateNewCase?: (category: string) => void; // NEW: For "Nuevo Expediente" button
    onBatchVehicleProcessing: (files: File[]) => void;
    isBatchProcessing: boolean;
    onAddDocuments: (files: File[]) => void;
    isClassifying: boolean;
    isSaving: boolean;
    createdAt: string;
    onDeleteClient: (clientId: string) => Promise<void>;
}

const UserSwitcher: React.FC<{ users: User[], currentUser: User, onUserChange: (user: User) => void }> = ({ users, currentUser, onUserChange }) => (
    <div className="flex items-center space-x-2 bg-white p-1 rounded-lg border border-slate-300">
        <span className={`flex items-center justify-center h-7 w-7 rounded-md text-white text-sm font-bold ${currentUser.avatarColor}`}>{currentUser.initials}</span>
        <select value={currentUser.id} onChange={(e) => { const u = users.find(u => u.id === e.target.value); if (u) onUserChange(u); }} className="bg-transparent border-0 rounded-md py-1 pl-2 pr-8 text-sm focus:outline-none focus:ring-0">
            {users.map(user => (<option key={user.id} value={user.id}>{user.name}</option>))}
        </select>
    </div>
);

const CaseDetailView: React.FC<CaseDetailViewProps> = ({
    client, setClient,
    vehicle, setVehicle,
    economicData, setEconomicData,
    communications, setCommunications,
    attachments, setAttachments,
    tasks: propTasks, // Renamed to avoid conflict with state variable
    fileConfig, onFileConfigChange,
    fileNumber,
    caseStatus, setCaseStatus,
    onSaveAndReturn,
    onReturnToDashboard,
    onCreateNewCase,
    onBatchVehicleProcessing,
    isBatchProcessing,
    onAddDocuments,
    isSaving,
    createdAt
}) => {
    const { currentUser, users, setCurrentUser } = useAppContext();
    const { addToast } = useToast();

    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isHermesModalOpen, setIsHermesModalOpen] = useState(false);
    const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
    const [isMandatoModalOpen, setIsMandatoModalOpen] = useState(false);
    const [mandatoAsunto, setMandatoAsunto] = useState('');
    const [tasks, setTasks] = useState<Task[]>(propTasks || []);

    const handleOpenMandatoModal = () => {
        const asuntoMap: { [key: string]: string[] } = { 'Transferencia': ['CAMBIO DE TITULARIDAD VEHICULO', 'PAGO IMPUESTO DE TRANSMISIONES'], 'Matriculación Nacional': ['MATRICULACIÓN VEHÍCULO NACIONAL'], 'Importación UE': ['MATRICULACIÓN VEHÍCULO IMPORTACIÓN UE'], 'Duplicado Permiso': ['DUPLICADO PERMISO DE CIRCULACIÓN'], 'Baja Definitiva': ['BAJA DEFINITIVA DEL VEHÍCULO'], 'Informe DGT': ['SOLICITUD INFORME DE TRÁFICO'] };
        setMandatoAsunto((asuntoMap[fileConfig.fileType] || [fileConfig.fileType.toUpperCase()]).join('\n'));
        setIsMandatoModalOpen(true);
    };

    const { appSettings } = useAppContext();
    const [availableTemplates, setAvailableTemplates] = useState<MandateTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

    // Load templates when modal opens
    useEffect(() => {
        if (isMandatoModalOpen) {
            loadTemplates();
        }
    }, [isMandatoModalOpen]);

    const loadTemplates = async () => {
        try {
            const allTemplates = await getActiveTemplates();
            // Filter: Global templates OR templates matching current case prefix
            const relevantTemplates = allTemplates.filter(t =>
                !t.prefixId || t.prefixId === fileConfig.category
            );
            setAvailableTemplates(relevantTemplates);

            // Auto-select first relevant template
            if (relevantTemplates.length > 0) {
                setSelectedTemplateId(relevantTemplates[0].id);
            }
        } catch (error) {
            console.error('Error loading templates:', error);
            addToast('Error al cargar plantillas', 'error');
        }
    };

    const handleGenerateMandato = async (finalAsunto: string, format: 'docx' | 'pdf') => {
        if (!currentUser) return;

        const data = {
            CLIENT_FULL_NAME: `${client.firstName} ${client.surnames}`.trim(),
            CLIENT_NIF: client.nif,
            CLIENT_ADDRESS: `${client.address}, ${client.city}, ${client.postalCode}, ${client.province}`,
            ASUNTO: finalAsunto,
            GESTOR_NAME: currentUser.name,
            GESTOR_DNI: appSettings?.agency?.managerDni || '__________________',
            GESTOR_COLEGIADO_NUM: appSettings?.agency?.managerColegiado || '__________________',
            GESTOR_DESPACHO: appSettings?.agency?.name || 'Gestoría',
            GESTOR_DESPACHO_DIRECCION: appSettings?.agency?.address || '__________________',
            CURRENT_CITY: appSettings?.agency?.address?.split(',')[1]?.trim() || 'Almería',
            CURRENT_DAY: String(new Date().getDate()),
            CURRENT_MONTH: new Date().toLocaleString('es-ES', { month: 'long' }),
            CURRENT_YEAR: String(new Date().getFullYear()),
        };

        try {
            if (format === 'pdf') {
                await generateMandatoPDF({
                    data,
                    fileName: `${fileNumber}_mandato.pdf`
                });
                addToast('Mandato PDF generado correctamente.', 'success');
            } else {
                // Find selected template
                const selectedTemplate = availableTemplates.find(t => t.id === selectedTemplateId);

                await generateMandatoDOCX({
                    data,
                    fileName: `${fileNumber}_mandato.docx`,
                    templateUrl: selectedTemplate?.fileUrl // Pass template URL if selected
                });
                addToast('Mandato DOCX generado correctamente.', 'success');
            }

            setIsMandatoModalOpen(false);
        } catch (error) {
            addToast(`Error al generar el mandato (${format.toUpperCase()}).`, 'error');
            console.error(error);
        }
    };

    // Auto-save hook
    const currentCaseData: Partial<CaseRecord> = {
        fileNumber,
        client,
        vehicle,
        fileConfig,
        economicData,
        communications,
        attachments,
        status: caseStatus,
        tasks
    };

    const autoSave = useAutoSave({
        fileNumber,
        userId: currentUser?.id || '',
        data: currentCaseData,
        enabled: !!currentUser && fileNumber !== 'new',
        interval: 30000, // 30 seconds
        onSave: () => {
            // Optional: could show a subtle notification
        },
        onError: (error) => {
            console.error('Auto-save failed:', error);
        }
    });

    if (!currentUser) return <div className="min-h-screen flex items-center justify-center"><SpinnerIcon /></div>;

    const currentCaseDataForModal: CaseRecord = {
        fileNumber, client, vehicle, fileConfig, economicData, communications,
        attachments, status: caseStatus, tasks,
        createdAt,
        updatedAt: new Date().toISOString(),
    };

    return (
        <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <button onClick={onReturnToDashboard} className="p-2 text-slate-600 hover:text-sky-600" title="Volver">
                                <ArrowLeftIcon />
                            </button>
                            <HeaderIcon />
                            <div className="flex items-center">
                                <span className="text-3xl font-bold text-slate-900">Expediente:</span>
                                <span className="ml-2 font-bold text-3xl text-sky-600">{fileNumber}</span>
                            </div>
                            {onCreateNewCase && (
                                <button
                                    onClick={() => {
                                        if (isSaving || confirm('¿Deseas crear un nuevo expediente? Los cambios no guardados se perderán.')) {
                                            onCreateNewCase?.('GE-MAT');
                                        }
                                    }}
                                    className="ml-4 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                                >
                                    + Nuevo Expediente
                                </button>
                            )}
                        </div>
                        <div className="flex items-center space-x-4">
                            <AutoSaveIndicator
                                status={autoSave.status}
                                lastSaved={autoSave.lastSaved}
                                onSaveNow={autoSave.saveNow}
                                onClearDraft={autoSave.clearDraft}
                                hasUnsavedChanges={autoSave.hasUnsavedChanges}
                            />
                            <UserSwitcher users={users} currentUser={currentUser} onUserChange={setCurrentUser} />
                            <div className="flex items-center space-x-2">
                                <label htmlFor="caseStatus" className="text-sm font-medium">Estado:</label>
                                <select
                                    id="caseStatus"
                                    value={caseStatus}
                                    onChange={(e) => setCaseStatus(e.target.value as CaseStatus)}
                                    className={`font-semibold py-1 px-2 rounded-md border text-sm focus:ring-0 outline-none ${getCaseStatusBadgeColor(caseStatus)} ${getCaseStatusBorderColor(caseStatus)}`}
                                >
                                    {DEFAULT_CASE_STATUSES.map(s => (<option key={s} value={s}>{s}</option>))}
                                </select>
                            </div>
                        </div>
                    </div>
                </header>
                <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <ClientDataSection client={client} setClient={setClient} onDocumentProcessed={(f) => onAddDocuments([f])} />
                        <VehicleDataSection vehicle={vehicle} setVehicle={setVehicle} fileType={fileConfig.fileType} onBatchProcess={onBatchVehicleProcessing} isBatchProcessing={isBatchProcessing} onDocumentProcessed={(f) => onAddDocuments([f])} />
                        <EconomicDataSection economicData={economicData} setEconomicData={setEconomicData} />
                        <TasksSection tasks={tasks} setTasks={setTasks} users={users} currentUser={currentUser} caseResponsibleUserId={fileConfig.responsibleUserId} attachments={attachments} fileConfig={fileConfig} client={client} />
                        <CommunicationsSection communications={communications} setCommunications={setCommunications} currentUser={currentUser} users={users} client={client} />
                    </div>
                    <div className="lg:col-span-1 space-y-8">
                        <FileConfigSection fileConfig={fileConfig} onFileConfigChange={onFileConfigChange} onOpenSettings={() => setIsSettingsModalOpen(true)} users={users} caseStatus={caseStatus} setCaseStatus={setCaseStatus} onOpenMandatoModal={handleOpenMandatoModal} />
                        <HermesIntegrationSection onOpen={() => setIsHermesModalOpen(true)} />
                        <AttachedDocumentsSection onOpen={() => setIsDocumentsModalOpen(true)} />
                        <DocumentGeneratorSection client={client} vehicle={vehicle} economicData={economicData} communications={communications} attachments={attachments} fileNumber={fileNumber} fileConfig={fileConfig} tasks={tasks} users={users} onOpenMandatoModal={handleOpenMandatoModal} caseStatus={caseStatus} createdAt={createdAt} />
                        <HelpSupportSection />
                        <div className="bg-white p-6 rounded-xl shadow-md">
                            <h3 className="text-lg font-semibold mb-4">Acciones</h3>
                            <button onClick={() => onSaveAndReturn(tasks)} disabled={isSaving} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center disabled:bg-sky-400 mb-3">
                                {isSaving ? <><SpinnerIcon /> <span className="ml-2">Guardando...</span></> : 'Guardar y Volver'}
                            </button>

                            {onCreateNewCase && (
                                <button
                                    onClick={() => onCreateNewCase(fileConfig.category)}
                                    className="w-full bg-white border-2 border-sky-600 text-sky-600 hover:bg-sky-50 font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-colors"
                                >
                                    <span className="mr-2">+</span> Nuevo Expediente
                                </button>
                            )}
                        </div>
                    </div>
                </main>
                {isSettingsModalOpen && <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />}
                {isHermesModalOpen && <HermesConfigModal isOpen={isHermesModalOpen} onClose={() => setIsHermesModalOpen(false)} caseRecord={currentCaseDataForModal} />}
                {isDocumentsModalOpen && <AttachedDocumentsModal isOpen={isDocumentsModalOpen} onClose={() => setIsDocumentsModalOpen(false)} attachments={attachments} setAttachments={setAttachments} onAddDocuments={onAddDocuments} fileNumber={fileNumber} />}
                {isMandatoModalOpen && (
                    <MandatoAsuntoModal
                        isOpen={isMandatoModalOpen}
                        onClose={() => setIsMandatoModalOpen(false)}
                        initialAsunto={mandatoAsunto}
                        onConfirm={handleGenerateMandato}
                        templates={availableTemplates}
                        selectedTemplateId={selectedTemplateId}
                        onSelectTemplate={setSelectedTemplateId}
                    />
                )}
                <footer className="text-center mt-12 text-slate-500 text-sm"><p>&copy; {new Date().getFullYear()} Gestor de Expedientes Pro.</p></footer>
            </div>
        </div>
    );
};

export default CaseDetailView;
