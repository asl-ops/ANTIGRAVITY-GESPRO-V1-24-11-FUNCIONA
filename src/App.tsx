import React, { useEffect, lazy, Suspense } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/useToast';
import RemoteAccessInfo from '@/components/RemoteAccessInfo';
import { useCaseManager } from '@/hooks/useCaseManager';
import { useHashRouter } from '@/hooks/useHashRouter';
import { FileCategory, CaseRecord, Client } from '@/types';
import {
  getInitialFileConfig, getFileNumber, getInitialVehicle, getInitialCommunicationsData
} from '@/utils/initializers';

const Dashboard = lazy(() => import('@/components/Dashboard'));
const CaseDetailView = lazy(() => import('@/components/CaseDetailView'));
const ResponsibleDashboard = lazy(() => import('@/components/ResponsibleDashboard'));
const TasksDashboard = lazy(() => import('@/components/TasksDashboard'));
const CreateCaseWizard = lazy(() => import('@/components/CreateCaseWizard'));

const App: React.FC = () => {
  const {
    caseHistory, appSettings, currentUser, isLoading, initializationError,
    deleteClient, saveCase, economicTemplates
  } = useAppContext();

  const { addToast } = useToast();
  const { currentView, fileNumberParam, navigateTo } = useHashRouter();

  const {
    client, setClient, vehicle, setVehicle, economicData, setEconomicData,
    communications, setCommunications, attachments, setAttachments,
    fileConfig, handleFileConfigChange, caseStatus, setCaseStatus,
    tasks, createdAt, isClassifying, isBatchProcessing, isSaving,
    clearForm, loadCaseData, handleSaveAndReturn, handleAddDocuments,
    handleUpdateTaskStatus
  } = useCaseManager();

  const [isRemoteAccessModalOpen, setIsRemoteAccessModalOpen] = React.useState(false);
  const [isApiKeyWarningVisible, setApiKeyWarningVisible] = React.useState(false);

  useEffect(() => {
    const apiKey = (typeof process !== 'undefined' && process?.env) ? process.env.API_KEY : undefined;
    if (!apiKey) setApiKeyWarningVisible(true);
  }, []);

  useEffect(() => {
    if (currentView === 'detail') {
      if (fileNumberParam && fileNumberParam !== 'new') {
        const caseToLoad = caseHistory.find(c => c.fileNumber === fileNumberParam);
        if (caseToLoad) {
          loadCaseData(caseToLoad);
        }
      } else if (fileNumberParam === 'new' && !client.id) { // Only clear if it's a fresh 'new' case
        clearForm();
      }
    }
  }, [currentView, fileNumberParam, loadCaseData, clearForm, client.id]);

  const handleSelectCase = (fileNumber: string) => {
    navigateTo(`/detail/${fileNumber}`);
  };

  const handleCreateNewCase = () => {
    navigateTo('/detail/new');
  };

  const onSaveAndReturnWrapper = async () => {
    const success = await handleSaveAndReturn(tasks);
    if (success) {
      navigateTo('/');
    }
  };

  const loadingFallback = (
    <div className="flex items-center justify-center h-full p-4">
      <svg className="animate-spin h-8 w-8 text-sky-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      <p className="ml-3 text-lg text-slate-600">Cargando...</p>
    </div>
  );

  const handleWizardComplete = (category: FileCategory, selectedClient: Client) => {
    if (!appSettings || !currentUser) {
      addToast('Error: App settings or current user not available.', 'error');
      return;
    }
    // Calculate new counter
    const newCounter = (caseHistory.length > 0 ? Math.max(...caseHistory.map(c => parseInt(c.fileNumber.split('-')[1] || '0', 10))) : appSettings.fileCounter - 1) + 1;

    const fileNumber = getFileNumber(newCounter);
    const initialConfig = getInitialFileConfig(currentUser.id, category);

    const economicLines = (economicTemplates[category] || [])
      .filter(line => line.included)
      .map(line => ({
        id: `line_${Date.now()}_${Math.random()}`,
        conceptId: `concept_${Date.now()}_${Math.random()}`, // Will be updated during migration
        concept: line.concept,
        type: 'honorario' as const, // Default type, will be refined later
        amount: line.amount
      }));

    const newCase: CaseRecord = {
      fileNumber: fileNumber,
      client: selectedClient,
      vehicle: getInitialVehicle(),
      fileConfig: initialConfig,
      economicData: { lines: economicLines, subtotalAmount: 0, vatAmount: 0, totalAmount: 0 }, // Recalc totals?
      communications: getInitialCommunicationsData(currentUser.id),
      attachments: [],
      status: 'Pendiente Documentación',
      tasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save
    saveCase(newCase).then(({ success }) => {
      if (success) {
        navigateTo(`/detail/${fileNumber}`);
      } else {
        addToast('Error creating new case.', 'error');
      }
    });
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Suspense fallback={loadingFallback}><Dashboard onSelectCase={handleSelectCase} onCreateNewCase={handleCreateNewCase} onShowRemoteAccess={() => setIsRemoteAccessModalOpen(true)} onShowTasksDashboard={() => navigateTo('/tasks')} onShowResponsibleDashboard={() => navigateTo('/responsible')} /></Suspense>;
      case 'tasks':
        return <Suspense fallback={loadingFallback}><TasksDashboard onUpdateTaskStatus={handleUpdateTaskStatus} onGoToCase={(c) => handleSelectCase(c.fileNumber)} onReturnToDashboard={() => navigateTo('/')} /></Suspense>;
      case 'responsible':
        return <Suspense fallback={loadingFallback}><ResponsibleDashboard /></Suspense>;
      case 'detail':
        if (fileNumberParam === 'new') {
          return <Suspense fallback={loadingFallback}><CreateCaseWizard onComplete={handleWizardComplete} onCancel={() => navigateTo('/')} /></Suspense>;
        }
        if (!fileNumberParam) return loadingFallback;
        return (
          <Suspense fallback={loadingFallback}>
            <CaseDetailView
              client={client} setClient={setClient} vehicle={vehicle} setVehicle={setVehicle}
              economicData={economicData} setEconomicData={setEconomicData} communications={communications}
              setCommunications={setCommunications} attachments={attachments} setAttachments={setAttachments}
              tasks={tasks} fileConfig={fileConfig} onFileConfigChange={handleFileConfigChange}
              fileNumber={fileNumberParam} caseStatus={caseStatus} setCaseStatus={setCaseStatus}
              onSaveAndReturn={onSaveAndReturnWrapper} onReturnToDashboard={() => navigateTo('/')}
              onCreateNewCase={handleCreateNewCase}
              onBatchVehicleProcessing={() => { }} isBatchProcessing={isBatchProcessing}
              onAddDocuments={handleAddDocuments} isClassifying={isClassifying} isSaving={isSaving}
              createdAt={createdAt} onDeleteClient={deleteClient}
            />
          </Suspense>
        );
      default:
        return <p>Vista no reconocida</p>;
    }
  }

  if (isLoading || !currentUser || !appSettings) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center h-full">
          <svg className="animate-spin h-10 w-10 text-sky-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <p className="mt-4 text-lg text-slate-600">Cargando aplicación...</p>
        </div>
      </div>
    )
  }

  if (initializationError) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-3xl bg-white p-8 rounded-xl shadow-lg border border-yellow-300">
          <p>{initializationError}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {isApiKeyWarningVisible && (
        <div className="bg-red-100 border-b-2 border-red-500 text-red-900 px-4 py-3 relative shadow-md" role="alert">
          <p>La API Key de Gemini no está disponible.</p>
        </div>
      )}
      <RemoteAccessInfo isOpen={isRemoteAccessModalOpen} onClose={() => setIsRemoteAccessModalOpen(false)} />
      {renderContent()}
    </>
  );
};

export default App;