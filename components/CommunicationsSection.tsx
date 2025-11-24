import React, { useState } from 'react';
import { Communication, User, Client } from '../types';
import { ChatBubbleIcon, PlusCircleIcon, TrashIcon, SparklesIcon, SpinnerIcon } from './icons';
import { summarizeCommunications, draftCommunication } from '../services/geminiService';
import { useToast } from '../hooks/useToast';
import DraftCommunicationModal from './DraftCommunicationModal';

interface CommunicationsSectionProps {
  communications: Communication[];
  setCommunications: React.Dispatch<React.SetStateAction<Communication[]>>;
  currentUser: User;
  users: User[];
  client: Client;
}

const CommunicationsSection: React.FC<CommunicationsSectionProps> = ({ communications, setCommunications, currentUser, users, client }) => {
  const { addToast } = useToast();
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);

  const getUserInitials = (userId: string) => {
    return users.find(u => u.id === userId)?.initials || '??';
  };

  const handleLineChange = (id: string, field: 'date' | 'concept', value: string) => {
    setCommunications(prev =>
      prev.map(comm => (comm.id === id ? { ...comm, [field]: value } : comm))
    );
  };

  const handleAddLine = (concept: string = '') => {
    const today = new Date().toISOString().split('T')[0];
    const newLine: Communication = {
      id: `comm-${Date.now()}`,
      date: today,
      concept,
      authorUserId: currentUser.id,
    };
    setCommunications(prev => [...prev, newLine]);
  };

  const handleRemoveLine = (id: string) => {
    setCommunications(prev => prev.filter(comm => comm.id !== id));
  };

  const handleSummarize = async () => {
    if (communications.length < 2) {
      addToast('Se necesitan al menos 2 comunicaciones para generar un resumen.', 'info');
      return;
    }
    setIsSummarizing(true);
    try {
      const summary = await summarizeCommunications(communications, users, client);
      alert(`Resumen de IA:\n\n${summary}`);
    } catch (error: any) {
      addToast(error.message, 'error');
    } finally {
      setIsSummarizing(false);
    }
  };
  
  const handleUseDraft = (draft: string) => {
    handleAddLine(draft);
    setIsDrafting(false);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <ChatBubbleIcon />
          <h2 className="text-xl font-bold text-slate-900 ml-3">Comunicaciones</h2>
        </div>
        <div className="flex items-center gap-2">
            <button
              onClick={handleSummarize}
              disabled={isSummarizing}
              className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-bold p-2 rounded-lg transition-colors duration-200 flex items-center justify-center disabled:opacity-50"
              aria-label="Resumir con IA"
              title="Resumir con IA"
            >
              {isSummarizing ? <SpinnerIcon /> : <SparklesIcon className="h-6 w-6" />}
            </button>
            <button
              onClick={() => setIsDrafting(true)}
              className="bg-slate-700 hover:bg-slate-800 text-white font-bold p-2 rounded-lg transition-colors duration-200 flex items-center justify-center"
              aria-label="Redactar con IA"
              title="Redactar con IA"
            >
              <SparklesIcon className="h-6 w-6" />
            </button>
            <button
              onClick={() => handleAddLine()}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold p-2 rounded-lg transition-colors duration-200 flex items-center justify-center"
              aria-label="Añadir nueva comunicación"
            >
              <PlusCircleIcon />
            </button>
        </div>
      </div>

      <div className="space-y-3">
        {communications.map((comm, index) => (
          <div key={comm.id} className="grid grid-cols-12 gap-2 items-start">
            <div className="col-span-3">
              {index === 0 && <label className="block text-xs font-medium text-slate-500 mb-1">Fecha</label>}
              <input
                type="date"
                value={comm.date}
                onChange={e => handleLineChange(comm.id, 'date', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div className="col-span-8">
              {index === 0 && <label className="block text-xs font-medium text-slate-500 mb-1">Concepto</label>}
               <div className="flex items-start">
                 <span className="text-xs font-bold text-slate-500 mt-2.5 mr-2">[{getUserInitials(comm.authorUserId)}]</span>
                 <textarea
                    value={comm.concept}
                    placeholder="Ej: Llamada al cliente..."
                    onChange={e => handleLineChange(comm.id, 'concept', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 min-h-[40px] resize-y"
                    rows={comm.concept.split('\n').length || 1}
                  />
               </div>
            </div>
            <div className="col-span-1 flex items-end h-full pt-6">
              <button
                onClick={() => handleRemoveLine(comm.id)}
                className="w-full h-10 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors duration-200"
                aria-label="Eliminar comunicación"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        ))}
      </div>
      {communications.length === 0 && (
          <p className="text-center text-slate-500 mt-4">No hay comunicaciones registradas. Haz clic en '+' para añadir una.</p>
      )}
      <DraftCommunicationModal isOpen={isDrafting} onClose={() => setIsDrafting(false)} onConfirm={handleUseDraft} clientName={`${client.firstName} ${client.surnames}`.trim()} />
    </div>
  );
};

export default CommunicationsSection;