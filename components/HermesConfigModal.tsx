import React, { useState } from 'react';
import { CaseRecord } from '../types';
import { XMarkIcon, SpinnerIcon, CheckCircleIcon, XCircleIcon, ArrowDownTrayIcon } from './icons';
import { iniciarMatriculacion, solicitarInformeDGT } from '../services/hermesService';
import { generateHermesFileContent } from '../services/xmlService';
import { useToast } from '../hooks/useToast';

interface HermesConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseRecord: CaseRecord;
}

type ActionStatus = 'idle' | 'loading' | 'success' | 'error';

const HermesConfigModal: React.FC<HermesConfigModalProps> = ({ isOpen, onClose, caseRecord }) => {
  const { addToast } = useToast();
  const { fileNumber, client, vehicle } = caseRecord;
  
  const [status, setStatus] = useState<Record<string, ActionStatus>>({ matriculacion: 'idle', informe: 'idle' });
  const [message, setMessage] = useState('');
  
  if (!isOpen) return null;

  const handleGenerateAndDownload = () => {
    if (!client.nif) { 
      addToast('El cliente debe tener un NIF para generar el fichero.', 'error');
      return;
    }
    try {
      const fileContent = generateHermesFileContent([caseRecord]);
      const blob = new Blob([fileContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HERMES_IMPORT_${fileNumber}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('Fichero Hermes generado con éxito.', 'success');
    } catch (error) {
      console.error("Error generating Hermes file:", error);
      addToast('Error al generar el fichero Hermes.', 'error');
    }
  };

  const handleAction = async (action: string) => {
    setStatus(prev => ({ ...prev, [action]: 'loading' }));
    setMessage('');
    try {
      let response;
      if (action === 'matriculacion') response = await iniciarMatriculacion({ client, vehicle, fileNumber });
      else if (action === 'informe') response = await solicitarInformeDGT({ vin: vehicle.vin, fileNumber });
      else throw new Error('Acción desconocida');

      setStatus(prev => ({ ...prev, [action]: response.success ? 'success' : 'error' }));
      setMessage(response.message);
    } catch (error) {
      setStatus(prev => ({ ...prev, [action]: 'error' }));
      setMessage(error instanceof Error ? error.message : 'Un error inesperado ha ocurrido.');
    } finally {
        setTimeout(() => { setStatus(prev => ({...prev, [action]: 'idle'})); setMessage(''); }, 5000);
    }
  };
  
  const ButtonContent: React.FC<{ action: string; text: string }> = ({ action, text }) => {
    switch (status[action]) {
      case 'loading': return <><SpinnerIcon /> <span className="ml-2">Enviando...</span></>;
      case 'success': return <><CheckCircleIcon /> <span className="ml-2">Éxito</span></>;
      case 'error': return <><XCircleIcon /> <span className="ml-2">Error</span></>;
      default: return <>{text}</>;
    }
  };

  const getButtonClass = (action: string) => `w-full text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center disabled:opacity-70 transition-colors ${status[action] === 'loading' ? 'bg-sky-500 cursor-wait' : status[action] === 'success' ? 'bg-emerald-500' : status[action] === 'error' ? 'bg-red-500' : 'bg-slate-700 hover:bg-slate-800'}`;
  
  const isAnyActionLoading = Object.values(status).some(s => s === 'loading');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-slate-200"><h2 className="text-xl font-bold text-slate-800">Exportar para Hermes</h2><button onClick={onClose} className="text-slate-500 hover:text-slate-800"><XMarkIcon /></button></div>
        <div className="p-6 space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2 text-slate-800">Paso 1: Generar Fichero de Importación</h3>
                <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm text-slate-600">
                      Esto generará un fichero <code className="bg-slate-200 text-xs px-1 rounded">.xls</code> con los datos de este expediente, listo para importar en la Plataforma Hermes. 
                      La estructura y formato del fichero siguen las especificaciones para la matriculación de vehículos.
                    </p>
                    <button onClick={handleGenerateAndDownload} disabled={!client.nif} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center disabled:bg-sky-300 disabled:cursor-not-allowed">
                      <ArrowDownTrayIcon />
                      <span className="ml-2">Generar y Descargar Fichero</span>
                    </button>
                    {!client.nif && <p className="text-xs text-red-600 text-center mt-1">Se requiere un NIF de cliente para generar el fichero.</p>}
                </div>
            </div>
            <div>
                <h3 className="text-lg font-semibold mb-2 text-slate-800">Paso 2: Simulación de API (Legacy)</h3>
                <p className="text-sm text-slate-600 mb-4">Esta sección es una simulación de una conexión API y no realiza un envío real. Úsala solo para propósitos de demostración.</p>
                <div className="space-y-3"><button onClick={() => handleAction('matriculacion')} disabled={isAnyActionLoading} className={getButtonClass('matriculacion')}><ButtonContent action='matriculacion' text='Simular Matriculación' /></button><button onClick={() => handleAction('informe')} disabled={isAnyActionLoading} className={getButtonClass('informe')}><ButtonContent action='informe' text='Simular Informe DGT' /></button></div>
                {message && <div className={`mt-4 p-3 rounded-md text-sm text-center ${message.toLowerCase().includes('error') ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>{message}</div>}
            </div>
        </div>
      </div>
    </div>
  );
};

export default HermesConfigModal;