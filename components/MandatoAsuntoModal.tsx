
import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './icons';

interface MandatoAsuntoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAsunto: string;
  onConfirm: (asunto: string) => void;
}

const MandatoAsuntoModal: React.FC<MandatoAsuntoModalProps> = ({ isOpen, onClose, initialAsunto, onConfirm }) => {
  const [asunto, setAsunto] = useState(initialAsunto);

  useEffect(() => {
    if (isOpen) {
      setAsunto(initialAsunto);
    }
  }, [isOpen, initialAsunto]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(asunto);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg m-4 p-6 flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h3 className="text-lg font-semibold text-slate-900">Editar Asunto del Mandato</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <XMarkIcon />
          </button>
        </div>

        <div className="mb-4 flex-shrink-0">
            <label htmlFor="asunto-textarea" className="block text-sm font-medium text-slate-700 mb-2">
                Revisa y edita el asunto del documento. Cada línea se mostrará como un punto separado.
            </label>
            <textarea
                id="asunto-textarea"
                rows={5}
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                autoFocus
            />
        </div>

        <div className="flex justify-end space-x-3 mt-4">
            <button 
                onClick={onClose}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg transition-colors duration-200"
            >
                Cancelar
            </button>
            <button 
                onClick={handleConfirm}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
            >
                Confirmar y Generar PDF
            </button>
        </div>
      </div>
    </div>
  );
};

export default MandatoAsuntoModal;