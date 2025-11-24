import React, { useState } from 'react';
import { QuestionMarkCircleIcon, SpinnerIcon } from './icons';
import { getGroundedAnswer } from '../services/geminiService';
import { useToast } from '../hooks/useToast';

const HelpSupportSection: React.FC = () => {
  const { addToast } = useToast();
  const [query, setQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [response, setResponse] = useState<{ answer: string; sources: any[] } | null>(null);

  const handleQuery = async () => {
    if (!query.trim()) {
      addToast('Por favor, introduce una pregunta.', 'warning');
      return;
    }
    setIsQuerying(true);
    setResponse(null);
    try {
      const result = await getGroundedAnswer(query);
      setResponse(result);
      addToast('Respuesta obtenida.', 'success');
    } catch (error: any) {
        addToast(error.message.includes('API Key') ? error.message : 'Error al obtener la respuesta.', 'error');
        console.error(error);
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex items-center mb-4"><QuestionMarkCircleIcon /><h2 className="text-xl font-bold text-slate-900 ml-3">Ayuda y Soporte</h2></div>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">¿Dudas sobre normativas o procedimientos? Pregúntale al asistente.</p>
        <textarea rows={3} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ej: ¿Qué documentos se necesitan para un duplicado del permiso de circulación por robo?" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-sm" disabled={isQuerying} />
        <button onClick={handleQuery} disabled={isQuerying} className="w-full flex items-center justify-center bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 disabled:bg-sky-400 disabled:cursor-wait">{isQuerying ? <><SpinnerIcon /> <span className="ml-2">Consultando...</span></> : 'Consultar Asistente'}</button>

        {response && (
          <div className="mt-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-800 whitespace-pre-wrap">{response.answer}</p>
            {response.sources?.length > 0 && (
                <div className="mt-4 border-t border-slate-200 pt-3"><h4 className="text-xs font-bold text-slate-600 uppercase mb-2">Fuentes:</h4><ul className="space-y-1 list-disc list-inside">{response.sources.map((source, index) => (source?.uri && <li key={index} className="text-xs"><a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline truncate" title={source.title}>{source.title || source.uri}</a></li>))}</ul></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpSupportSection;