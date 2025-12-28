import React from 'react';
import { FileConfig, FileCategory, Client } from '../types';
import { CogIcon, UserIcon } from './icons';

interface FileConfigSectionProps {
    fileConfig: FileConfig;
    onFileConfigChange: (newConfig: FileConfig) => void;
    onOpenSettings: () => void;
    client: Client;
    onOpenAdministratorsModal: () => void;
}

const FileConfigSection: React.FC<FileConfigSectionProps> = ({
    fileConfig,
    onOpenSettings,
    client,
    onOpenAdministratorsModal
}) => {

    const currentCategory = fileConfig.category || 'GE-MAT';

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
                    <h2 className="text-xl font-bold text-slate-900 group-hover:text-sky-600 transition-colors">Información Adicional</h2>
                    <p className="text-xs text-slate-500 font-medium">{categoryLabels[currentCategory]}</p>
                </div>
            </div>

            <div className="space-y-4">

                <button
                    onClick={onOpenAdministratorsModal}
                    className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-50 p-2 rounded-lg group-hover:bg-indigo-100 transition-colors">
                            <UserIcon className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-slate-900 text-sm">Administradores</p>
                            <p className="text-xs text-slate-500">
                                {client.administrators?.length || 0} registrados
                            </p>
                        </div>
                    </div>
                    <div className="text-indigo-600 text-xs font-bold">GESTIONAR</div>
                </button>

                {/* Espacio reservado para futura información específica */}
                <div className="bg-slate-50 p-4 rounded-lg h-24 border border-slate-200 flex items-center justify-center text-slate-400 text-xs italic text-center">
                    Espacio reservado para información específica del expediente
                </div>
            </div>
        </div>
    );
};

export default FileConfigSection;
