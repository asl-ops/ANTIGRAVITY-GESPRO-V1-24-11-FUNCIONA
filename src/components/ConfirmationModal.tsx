import React from 'react';
import { ExclamationTriangleIcon } from './icons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-red-100 text-red-600">
            <ExclamationTriangleIcon />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-600 mt-2">{message}</p>
          </div>
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg">
            Cancelar
          </button>
          <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;