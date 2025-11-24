
import React from 'react';
import { FileConfig, User, CaseStatus, getCaseStatusBadgeColor, getCaseStatusBorderColor, FileCategory } from '../types';
import { CogIcon } from './icons';
import { useAppContext } from '../contexts/AppContext';

interface FileConfigSectionProps {
  fileConfig: FileConfig;
  onFileConfigChange: (newConfig: FileConfig) => void;
  onOpenSettings: () => void;
  users: User[];
  caseStatus: CaseStatus;
  setCaseStatus: (status: CaseStatus) => void;
  onOpenMandatoModal: () => void;
}

const FileConfigSection: React.FC<FileConfigSectionProps> = ({ fileConfig, onFileConfigChange, onOpenSettings, users, caseStatus, setCaseStatus, onOpenMandatoModal }) => {
    const { appSettings } = useAppContext();
    
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        onFileConfigChange({ ...fileConfig, [name]: value });
    };

    const handleCustomFieldChange = (fieldId: string, value: string) => {
        const newCustomValues = { ...fileConfig.customValues, [fieldId]: value };
        onFileConfigChange({ ...fileConfig, customValues: newCustomValues });
    };
    
    const responsibleUser = users.find(u => u.id === fileConfig.responsibleUserId);
    const currentCategory = fileConfig.category || 'GE-MAT';
    
    // Fallback lists
    const FALLBACK_FILE_TYPES = ['General', 'Matriculación', 'Transferencia', 'Baja', 'Importación'];
    const FALLBACK_STATUSES = ['Pendiente Documentación', 'En Tramitación', 'Finalizado', 'Archivado'];

    // Obtener configuración segura (fallback a arrays vacíos si no ha cargado)
    const categoryFields = appSettings?.fieldConfigs?.[currentCategory] || [];
    const availableStatuses = (appSettings?.caseStatuses && appSettings.caseStatuses.length > 0) ? appSettings.caseStatuses : FALLBACK_STATUSES;
    const availableFileTypes = (appSettings?.fileTypes?.[currentCategory] && appSettings.fileTypes[currentCategory].length > 0) ? appSettings.fileTypes[currentCategory] : FALLBACK_FILE_TYPES;
    
    const categoryLabels: Record<FileCategory, string> = {
        'GE-MAT': 'Gestión Tráfico (GE-MAT)',
        'FI-TRI': 'Fiscal Tributario (FI-TRI)',
        'FI-CONTA': 'Fiscal Contable (FI-CONTA)'
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
            <div 
                className="flex items-center mb-6 cursor-pointer group"
                onClick={onOpenSettings}
                title="Abrir panel de configuración"
            >
                <div className="bg-sky-50 p-2 rounded-lg group-hover:bg-sky-100 transition-colors">
                    <CogIcon />
                </div>
                <div className="ml-3">
                    <h2 className="text-xl font-bold text-slate-900 group-hover:text-sky-600 transition-colors">Datos del Expediente</h2>
                    <p className="text-xs text-slate-500 font-medium">{categoryLabels[currentCategory]}</p>
                </div>
            </div>
            
            <div className="space-y-5">
                
                {/* 1. Tipo / Modalidad */}
                <div>
                    <label htmlFor="fileType" className="block text-sm font-medium text-slate-700 mb-1">
                        Modalidad / Subtipo
                    </label>
                    {availableFileTypes.length > 0 ? (
                        <select
                            id="fileType"
                            name="fileType"
                            value={fileConfig.fileType}
                            onChange={handleChange}
                            className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md shadow-sm bg-slate-50"
                        >
                            {availableFileTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="text"
                            id="fileType"
                            name="fileType"
                            value={fileConfig.fileType}
                            onChange={handleChange}
                            placeholder="Ej: Matriculación, Trimestre 1, etc."
                            className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                        />
                    )}
                </div>

                {/* 2. Campos Dinámicos Configurables */}
                {categoryFields.length > 0 && (
                     <div className="bg-slate-50 p-4 rounded-lg space-y-4 border border-slate-200">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Información Específica</h3>
                            <button onClick={onOpenSettings} className="text-[10px] text-sky-600 hover:underline">Editar Campos</button>
                        </div>
                        {categoryFields.map(field => (
                            <div key={field.id}>
                                <label htmlFor={`field-${field.id}`} className="block text-xs font-medium text-slate-600 mb-1">
                                    {field.label}
                                </label>
                                <select
                                    id={`field-${field.id}`}
                                    value={fileConfig.customValues?.[field.id] || ''}
                                    onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                                    className="block w-full pl-3 pr-10 py-2 text-sm border-slate-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 rounded-md shadow-sm bg-white"
                                >
                                    <option value="" disabled>Selecciona...</option>
                                    {field.options.map((opt, idx) => (
                                        <option key={idx} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                     </div>
                )}
                
                {/* 3. Estado y Responsable */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="caseStatusConfig" className="block text-sm font-medium text-slate-700 mb-1">
                            Situación Actual
                        </label>
                        {availableStatuses.length > 0 ? (
                            <select
                                id="caseStatusConfig"
                                value={caseStatus}
                                onChange={(e) => setCaseStatus(e.target.value as CaseStatus)}
                                className={`block w-full pl-3 pr-8 py-2 text-sm border rounded-md shadow-sm font-semibold focus:outline-none focus:ring-2 ${getCaseStatusBadgeColor(caseStatus)} ${getCaseStatusBorderColor(caseStatus)}`}
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
                                className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                            />
                        )}
                    </div>

                    <div>
                        <label htmlFor="responsibleUserId" className="block text-sm font-medium text-slate-700 mb-1">
                            Gestor Responsable
                        </label>
                        <div className="flex items-center space-x-2">
                            {responsibleUser && (
                               <span className={`flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-lg text-white text-sm font-bold shadow-sm ${responsibleUser.avatarColor}`}>
                                    {responsibleUser.initials}
                                </span>
                            )}
                            <select
                                id="responsibleUserId"
                                name="responsibleUserId"
                                value={fileConfig.responsibleUserId}
                                onChange={handleChange}
                                className="block w-full pl-3 pr-10 py-2 text-sm border-slate-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 rounded-md shadow-sm"
                            >
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>{user.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="mt-4 border-t pt-4 space-y-3">
                    <button
                        onClick={onOpenMandatoModal}
                        className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-lg transition-colors duration-200 text-sm flex items-center justify-center shadow-sm"
                    >
                        Generar Mandato...
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FileConfigSection;
