import React, { createContext, useState, useCallback, useEffect, ReactNode, useContext } from 'react';
import { CaseRecord, Client, User, EconomicTemplates, AppSettings, Vehicle } from '../types';
import * as db from '../services/firestoreService';
import { getUsers } from '../services/userService';
import { initializeAuth } from '../services/firebase';
import { useToast } from '../hooks/useToast';
import { firebaseConfig } from '../config/firebase.config';

interface AppContextType {
  caseHistory: CaseRecord[];
  savedClients: Client[];
  savedVehicles: Vehicle[];
  users: User[];
  currentUser: User | null;
  appSettings: AppSettings | null;
  economicTemplates: EconomicTemplates;
  isLoading: boolean;
  initializationError: string | null;
  
  setCurrentUser: (user: User) => void;
  saveCase: (caseRecord: CaseRecord) => Promise<{ success: boolean; isNew?: boolean; }>;
  deleteCase: (fileNumber: string) => Promise<void>;
  saveClient: (client: Client) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
  saveVehicle: (vehicle: Vehicle) => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  updateEconomicTemplates: (templates: EconomicTemplates) => Promise<void>;
  updateCaseHistory: (updatedHistory: CaseRecord[]) => void;
  saveMultipleCases: (newCases: CaseRecord[]) => Promise<CaseRecord[] | null>;
}

export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  
  const [caseHistory, setCaseHistory] = useState<CaseRecord[]>([]);
  const [savedClients, setSavedClients] = useState<Client[]>([]);
  const [savedVehicles, setSavedVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [economicTemplates, setEconomicTemplates] = useState<EconomicTemplates>({});
  const [isLoading, setIsLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        setInitializationError("Error de configuración de Firebase. Revisa tus credenciales en `src/config/firebase.config.ts`.");
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        await initializeAuth();
        const userList = await getUsers();
        setUsers(userList);
        setCurrentUser(userList[0] || null);
        
        const [history, clients, vehicles, settings, templates] = await Promise.all([
          db.getCaseHistory(),
          db.getSavedClients(),
          db.getSavedVehicles(),
          db.getSettings(),
          db.getEconomicTemplates(),
        ]);
        
        setCaseHistory(history);
        setSavedClients(clients);
        setSavedVehicles(vehicles);
        setAppSettings(settings);
        setEconomicTemplates(templates);
      } catch (error: any) {
        console.error("Error loading initial data:", error);
        if (error.code === 'permission-denied') setInitializationError("Error de permisos de Firestore.");
        else if (error.code?.includes('auth')) setInitializationError("Error de autenticación de Firebase.");
        else setInitializationError("No se pudo conectar con Firebase.");
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const saveCase = useCallback(async (caseRecord: CaseRecord) => {
    try {
      const { updatedHistory, isNew } = await db.saveOrUpdateCase(caseRecord);
      setCaseHistory(updatedHistory);
      addToast(`Expediente ${caseRecord.fileNumber} ${isNew ? 'guardado' : 'actualizado'}.`, 'success');
      return { success: true, isNew };
    } catch (error) {
      addToast('Error al guardar el expediente.', 'error');
      return { success: false };
    }
  }, [addToast]);

  const deleteCase = useCallback(async (fileNumber: string) => {
    try {
        const updatedHistory = await db.deleteCase(fileNumber);
        setCaseHistory(updatedHistory);
        addToast(`Expediente ${fileNumber} eliminado.`, 'success');
    } catch (error) {
        addToast('Error al eliminar el expediente.', 'error');
    }
  }, [addToast]);

  const saveClient = useCallback(async (client: Client) => {
    try {
      const updatedClients = await db.saveOrUpdateClient(client);
      setSavedClients(updatedClients);
      addToast(`Cliente "${client.surnames}" guardado/actualizado.`, 'success');
    } catch (error) {
      addToast('Error al guardar el cliente.', 'error');
    }
  }, [addToast]);
  
  const deleteClient = useCallback(async (clientId: string) => {
      try {
        const updatedClients = await db.deleteClient(clientId);
        setSavedClients(updatedClients);
        addToast('Cliente eliminado.', 'success');
      } catch (error) {
          addToast('Error al eliminar el cliente.', 'error');
      }
  }, [addToast]);

  const saveVehicle = useCallback(async (vehicle: Vehicle) => {
    try {
      const updatedVehicles = await db.saveOrUpdateVehicle(vehicle);
      setSavedVehicles(updatedVehicles);
      addToast(`Vehículo ${vehicle.brand} ${vehicle.model} guardado.`, 'success');
    } catch (error) {
      addToast('Error al guardar el vehículo.', 'error');
    }
  }, [addToast]);

  const updateSettings = useCallback(async (settings: Partial<AppSettings>) => {
      try {
          await db.saveSettings(settings);
          setAppSettings(prev => ({...prev!, ...settings}));
          addToast('Configuración guardada.', 'success');
      } catch (error) {
          addToast('Error al guardar la configuración.', 'error');
      }
  }, [addToast]);

  const updateEconomicTemplates = useCallback(async (templates: EconomicTemplates) => {
    try {
      await db.saveEconomicTemplates(templates);
      setEconomicTemplates(templates);
    } catch (error) {
      addToast('Error al guardar las plantillas económicas.', 'error');
    }
  }, [addToast]);

  const saveMultipleCases = useCallback(async (newCases: CaseRecord[]) => {
    try {
        const updatedHistory = await db.saveMultipleCases(newCases);
        setCaseHistory(updatedHistory);
        return updatedHistory;
    } catch (error) {
        addToast('Error al guardar el lote de expedientes.', 'error');
        return null;
    }
  }, [addToast]);


  const value: AppContextType = {
    caseHistory, savedClients, savedVehicles, users, currentUser, appSettings,
    economicTemplates, isLoading, initializationError, setCurrentUser,
    saveCase, deleteCase, saveClient, deleteClient, saveVehicle,
    updateSettings, updateEconomicTemplates, updateCaseHistory: setCaseHistory,
    saveMultipleCases,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext debe ser usado dentro de un AppProvider');
  }
  return context;
};