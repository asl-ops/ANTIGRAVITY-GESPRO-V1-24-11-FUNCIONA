import React from 'react';
import { AutoSaveStatus } from '@/hooks/useAutoSave';
import { Save, Check, AlertCircle, Loader } from 'lucide-react';

interface AutoSaveIndicatorProps {
    status: AutoSaveStatus;
    lastSaved: Date | null;
    onSaveNow?: () => void;
    onClearDraft?: () => void;
    hasUnsavedChanges?: boolean;
}

const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
    status,
    lastSaved,
    onSaveNow,
    onClearDraft,
    hasUnsavedChanges = false
}) => {
    const getStatusIcon = () => {
        switch (status) {
            case 'saving':
                return <Loader className="w-4 h-4 animate-spin text-blue-600" />;
            case 'saved':
                return <Check className="w-4 h-4 text-emerald-600" />;
            case 'error':
                return <AlertCircle className="w-4 h-4 text-red-600" />;
            default:
                return <Save className="w-4 h-4 text-slate-400" />;
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'saving':
                return 'Guardando...';
            case 'saved':
                return 'Guardado';
            case 'error':
                return 'Error al guardar';
            default:
                return hasUnsavedChanges ? 'Cambios sin guardar' : 'Sin cambios';
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'saving':
                return 'text-blue-600';
            case 'saved':
                return 'text-emerald-600';
            case 'error':
                return 'text-red-600';
            default:
                return hasUnsavedChanges ? 'text-amber-600' : 'text-slate-500';
        }
    };

    const formatLastSaved = () => {
        if (!lastSaved) return null;

        const now = new Date();
        const diff = now.getTime() - lastSaved.getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);

        if (seconds < 60) {
            return 'hace unos segundos';
        } else if (minutes < 60) {
            return `hace ${minutes} min`;
        } else {
            return lastSaved.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };

    return (
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
                {getStatusIcon()}
                <div className="flex flex-col">
                    <span className={`text-sm font-medium ${getStatusColor()}`}>
                        {getStatusText()}
                    </span>
                    {lastSaved && (
                        <span className="text-xs text-slate-500">
                            {formatLastSaved()}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
                {onSaveNow && hasUnsavedChanges && (
                    <button
                        onClick={onSaveNow}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                    >
                        Guardar ahora
                    </button>
                )}

                {onClearDraft && lastSaved && (
                    <button
                        onClick={onClearDraft}
                        className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                    >
                        Descartar borrador
                    </button>
                )}
            </div>
        </div>
    );
};

export default AutoSaveIndicator;
