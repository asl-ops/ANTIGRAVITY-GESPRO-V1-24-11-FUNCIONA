import React, { useEffect, lazy, Suspense } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import RemoteAccessInfo from '@/components/RemoteAccessInfo';
import { useCaseManager } from '@/hooks/useCaseManager';
import { useHashRouter } from '@/hooks/useHashRouter';

const Dashboard = lazy(() => import('@/components/Dashboard'));
const CaseDetailView = lazy(() => import('@/components/CaseDetailView'));
const ResponsibleDashboard = lazy(() => import('@/components/ResponsibleDashboard'));
const TasksDashboard = lazy(() => import('@/components/TasksDashboard'));
const ClientExplorer = lazy(() => import('@/components/ClientExplorer'));

const App: React.FC = () => {
  const {
    caseHistory, appSettings, currentUser, isLoading, initializationError,
    deleteClient
  } = useAppContext();
  const { currentView, fileNumberParam, navigateTo } = useHashRouter();

  const {
    client, setClient,
    clienteId, setClienteId,
    clientSnapshot, setClientSnapshot,
    vehicle, setVehicle,
    economicData, setEconomicData,
    communications, setCommunications,
    attachments, setAttachments,
    fileConfig, handleFileConfigChange,
    description, setDescription,
    caseStatus, setCaseStatus,
    tasks, createdAt,
    isClassifying, isBatchProcessing, isSaving,
    clearForm, loadCaseData, handleSaveAndReturn, handleAddDocuments,
    handleUpdateTaskStatus
  } = useCaseManager();

  const [isRemoteAccessModalOpen, setIsRemoteAccessModalOpen] = React.useState(false);


  const loadedFileNumberRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (currentView === 'detail') {
      if (fileNumberParam && fileNumberParam !== 'new') {
        // Solo cargar si el número de expediente ha cambiado en la URL
        if (loadedFileNumberRef.current !== fileNumberParam) {
          const caseToLoad = caseHistory.find(c => c.fileNumber === fileNumberParam);
          if (caseToLoad) {
            console.log('📬 Cargando datos del expediente:', fileNumberParam);
            loadCaseData(caseToLoad);
            loadedFileNumberRef.current = fileNumberParam;
          }
        }
      } else if (fileNumberParam === 'new') {
        // Solo limpiar si venimos de otra vista o de otro expediente
        if (loadedFileNumberRef.current !== 'new') {
          console.log('✨ Inicializando nuevo expediente');
          clearForm();
          loadedFileNumberRef.current = 'new';
        }
      }
    } else {
      // Al salir de la vista de detalle, resetear el ref para permitir volver a cargar
      loadedFileNumberRef.current = null;
    }
  }, [currentView, fileNumberParam, loadCaseData, clearForm, caseHistory]);

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



  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Suspense fallback={loadingFallback}><Dashboard onSelectCase={handleSelectCase} onCreateNewCase={handleCreateNewCase} onShowResponsibleDashboard={() => navigateTo('/responsible')} /></Suspense>;
      case 'tasks':
        return <Suspense fallback={loadingFallback}><TasksDashboard onUpdateTaskStatus={handleUpdateTaskStatus} onGoToCase={(c) => handleSelectCase(c.fileNumber)} onReturnToDashboard={() => navigateTo('/')} /></Suspense>;
      case 'responsible':
        return <Suspense fallback={loadingFallback}><ResponsibleDashboard onReturnToDashboard={() => navigateTo('/')} /></Suspense>;
      case 'clients':
        return <Suspense fallback={loadingFallback}><ClientExplorer onClose={() => navigateTo('/')} /></Suspense>;
      case 'detail':
        // Eliminado el wizard, siempre muestra CaseDetailView
        if (!fileNumberParam) return loadingFallback;
        return (
          <Suspense fallback={loadingFallback}>
            <CaseDetailView
              client={client}
              setClient={setClient}
              clienteId={clienteId}
              setClienteId={setClienteId}
              clientSnapshot={clientSnapshot}
              setClientSnapshot={setClientSnapshot}
              vehicle={vehicle}
              setVehicle={setVehicle}
              economicData={economicData}
              setEconomicData={setEconomicData}
              communications={communications}
              setCommunications={setCommunications}
              attachments={attachments}
              setAttachments={setAttachments}
              tasks={tasks}
              fileConfig={fileConfig}
              onFileConfigChange={handleFileConfigChange}
              fileNumber={fileNumberParam}
              description={description}
              setDescription={setDescription}
              caseStatus={caseStatus}
              setCaseStatus={setCaseStatus}
              onSaveAndReturn={onSaveAndReturnWrapper}
              onReturnToDashboard={() => navigateTo('/')}
              onBatchVehicleProcessing={() => { }}
              isBatchProcessing={isBatchProcessing}
              onAddDocuments={handleAddDocuments}
              isClassifying={isClassifying}
              isSaving={isSaving}
              createdAt={createdAt}
              onDeleteClient={deleteClient}
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

      <RemoteAccessInfo isOpen={isRemoteAccessModalOpen} onClose={() => setIsRemoteAccessModalOpen(false)} />
      {renderContent()}
    </>
  );
};

export default App;