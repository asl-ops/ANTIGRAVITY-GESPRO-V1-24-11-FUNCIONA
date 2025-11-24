import React, { useState } from 'react';
import { XMarkIcon, SparklesIcon, SpinnerIcon } from './icons';
import { draftCommunication } from '../services/geminiService';
import { useToast } from '../hooks/useToast';

interface DraftCommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (draft: string) => void;
  clientName: string;
}

const DraftCommunicationModal: React.FC<DraftCommunicationModalProps> = ({ isOpen, onClose, onConfirm, clientName }) => {
  const { addToast } = useToast();
  const [intent, setIntent] = useState('');
  const [draft, setDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!intent.trim()) {
      addToast('Por favor, describe la intención del mensaje.', 'warning');
      return;
    }
    setIsGenerating(true);
    setDraft('');
    try {
      const result = await draftCommunication(intent, clientName);
      setDraft(result);
    } catch (error: any) {
      addToast(error.message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirm = () => {
    if (!draft) {
      addToast('No hay ningún borrador para usar.', 'warning');
      return;
    }
    onConfirm(draft);
    setIntent('');
    setDraft('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-slate-900">Redactar Comunicación con IA</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><XMarkIcon /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="intent" className="block text-sm font-medium text-slate-700 mb-1">¿Cuál es el objetivo del mensaje?</label>
            <input
              id="intent"
              type="text"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="Ej: Pedirle el DNI que falta"
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
          <button onClick={handleGenerate} disabled={isGenerating} className="w-full flex items-center justify-center bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-sky-400">
            {isGenerating ? <><SpinnerIcon /><span className="ml-2">Generando...</span></> : <><SparklesIcon /><span className="ml-2">Generar Borrador</span></>}
          </button>
          
          {draft && (
            <div className="border-t pt-4">
              <label htmlFor="draft" className="block text-sm font-medium text-slate-700 mb-1">Borrador Sugerido:</label>
              <textarea
                id="draft"
                rows={5}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                className="w-full p-2 bg-slate-100 border border-slate-200 rounded-md text-sm"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-4 bg-slate-50 border-t rounded-b-xl">
          <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg">Cancelar</button>
          <button onClick={handleConfirm} disabled={!draft} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-emerald-300">Usar este Borrador</button>
        </div>
      </div>
    </div>
  );
};

export default DraftCommunicationModal;