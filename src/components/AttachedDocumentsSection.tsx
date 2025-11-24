
import React from 'react';
import { PaperClipIcon } from './icons';

interface AttachedDocumentsSectionProps {
  onOpen: () => void;
}

const AttachedDocumentsSection: React.FC<AttachedDocumentsSectionProps> = ({ onOpen }) => {
  return (
    <div 
      className="bg-white p-6 rounded-xl shadow-md cursor-pointer group hover:bg-sky-50 transition-colors"
      onClick={onOpen}
      title="Abrir gestión de documentos adjuntos"
    >
      <div className="flex items-center">
        <PaperClipIcon />
        <h2 className="text-xl font-bold text-slate-900 ml-3 group-hover:text-sky-600 transition-colors">Documentos Adjuntos</h2>
      </div>
      <p className="text-sm text-slate-600 mt-2 ml-10">
        Añade, elimina y gestiona los ficheros asociados a este expediente.
      </p>
    </div>
  );
};

export default AttachedDocumentsSection;