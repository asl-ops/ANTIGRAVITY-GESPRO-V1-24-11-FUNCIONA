import React from 'react';
import { FileConfig, User, CaseStatus, DEFAULT_CASE_STATUSES, getCaseStatusBadgeColor } from '../types';
import { CogIcon } from './icons';

interface FileConfigSectionProps {
  fileConfig: FileConfig;
  onFileConfigChange: (newConfig: FileConfig) => void;
  onOpenSettings: () => void;
  users: User[];
  caseStatus: CaseStatus;
  setCaseStatus: (status: CaseStatus) => void;
  onOpenMandatoModal: () => void;
}

const FILE_TYPES = [
    'Matriculación Nacional',
    'Matriculación Múltiple (mismo titular)',
    'Transferencia',
    'Importación UE',
    'Duplicado Permiso',
    'Baja Definitiva',
    'Informe DGT',
];

const FileConfigSection: React.FC<FileConfigSectionProps> = ({ fileConfig, onFileConfigChange, onOpenSettings, users, caseStatus, setCaseStatus, onOpenMandatoModal }) => {

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        onFileConfigChange({ ...fileConfig, [name]: value });
    };
    
    const responsibleUser = users.find(u => u.id === fileConfig.responsibleUserId);

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div 
                className="flex items-center mb-6 cursor-pointer group"
                onClick={onOpenSettings}
                title="Abrir panel de configuración"
            >
                <CogIcon />
                <h2 className="text-xl font-bold text-slate-900 ml-3 group-hover:text-sky-600 transition-colors">Configuración del Expediente</h2>
            </div>
            
            <div className="space-y-4">
                <div>
                    <label htmlFor="fileType" className="block text-sm font-medium text-slate-700 mb-1">
                        Tipo de Expediente
                    </label>
                    <select
                        id="fileType"
                        name="fileType"
                        value={fileConfig.fileType}
                        onChange={handleChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md"
                    >
                        {FILE_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
                
                <div>
                    <label htmlFor="caseStatusConfig" className="block text-sm font-medium text-slate-700 mb-1">
                        Estado
                    </label>
                    <div className="flex items-center space-x-2">
                        <select
                            id="caseStatusConfig"
                            value={caseStatus}
                            onChange={(e) => setCaseStatus(e.target.value as CaseStatus)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md"
                        >
                            {DEFAULT_CASE_STATUSES.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                         <span className={`px-3 py-2 text-xs font-semibold rounded-full whitespace-nowrap ${getCaseStatusBadgeColor(caseStatus)}`}>
                            {caseStatus}
                        </span>
                    </div>
                </div>

                <div>
                    <label htmlFor="responsibleUserId" className="block text-sm font-medium text-slate-700 mb-1">
                        Responsable
                    </label>
                    <div className="flex items-center space-x-2">
                        {responsibleUser && (
                           <span className={`flex items-center justify-center h-7 w-7 rounded-full text-white text-xs font-bold ${responsibleUser.avatarColor}`}>
                                {responsibleUser.initials}
                            </span>
                        )}
                        <select
                            id="responsibleUserId"
                            name="responsibleUserId"
                            value={fileConfig.responsibleUserId}
                            onChange={handleChange}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md"
                        >
                            {users.map(user => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-4 border-t pt-4 space-y-3">
                    <button
                        onClick={onOpenMandatoModal}
                        className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
                    >
                        Generar Mandato...
                    </button>
                    <div className="text-center">
                        <button
                            onClick={onOpenSettings}
                            className="text-xs text-slate-600 hover:text-sky-700 hover:underline"
                        >
                            Editar plantilla general del mandato
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FileConfigSection;