import React, { useState } from 'react';
import { Communication, User, Client } from '../types';
import { ChatBubbleIcon, PlusCircleIcon, TrashIcon, SparklesIcon, SpinnerIcon } from './icons';
import { summarizeCommunications } from '../services/geminiService';
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
          {/* WhatsApp Button */}
          {client.phone && (
            <button
              onClick={() => {
                const phone = client.phone.replace(/\D/g, ''); // Remove non-digits
                const formattedPhone = phone.startsWith('34') ? phone : `34${phone}`;
                const message = encodeURIComponent(`Hola ${client.firstName || client.surnames}, le contactamos desde nuestro despacho.`);
                window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
              }}
              className="bg-green-500 hover:bg-green-600 text-white font-bold px-3 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
              title="Enviar WhatsApp"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
          )}
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