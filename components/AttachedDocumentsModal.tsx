
import React, { useState, useCallback, useEffect } from 'react';
import { AttachedDocument } from '../types';
import { XMarkIcon, TrashIcon, ClipboardIcon, CloudIcon, CloudArrowUpIcon, CloudCheckIcon, XCircleIcon, SpinnerIcon } from './icons';
import { uploadFileToCloud } from '../services/cloudStorageService';
import { useToast } from '../hooks/useToast';
import { useAppContext } from '../contexts/AppContext';


interface AttachedDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: AttachedDocument[];
  setAttachments: React.Dispatch<React.SetStateAction<AttachedDocument[]>>;
  onAddDocuments: (files: File[]) => void;
  fileNumber: string;
}

const AttachedDocumentsModal: React.FC<AttachedDocumentsModalProps> = ({ 
    isOpen, onClose, attachments, setAttachments, onAddDocuments, fileNumber
}) => {
  const { appSettings } = useAppContext();
  const { addToast } = useToast();

  const [isDragging, setIsDragging] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [fullSavePath, setFullSavePath] = useState('');

  useEffect(() => {
    if (isOpen && appSettings) {
        const path = appSettings.generalSavePath.endsWith('\\') ? appSettings.generalSavePath : `${appSettings.generalSavePath}\\`;
        setFullSavePath(`${path}${fileNumber}\\`);
    }
  }, [isOpen, appSettings, fileNumber]);
  
  const handleSync = async () => {
    const localFiles = attachments.filter(doc => doc.status === 'local' && doc.file);
    if (localFiles.length === 0) { addToast('No hay documentos nuevos para sincronizar.', 'info'); return; }
    
    setIsSyncing(true);
    addToast(`Sincronizando ${localFiles.length} documento(s)...`, 'info');

    setAttachments(prev => prev.map(doc => doc.status === 'local' ? { ...doc, status: 'uploading' } : doc));
    
    const uploadPromises = localFiles.map(doc =>
        uploadFileToCloud(doc.file!, fileNumber)
            .then(downloadURL => ({ id: doc.id, status: 'synced' as const, url: downloadURL }))
            .catch(() => ({ id: doc.id, status: 'error' as const, url: undefined }))
    );

    const results = await Promise.allSettled(uploadPromises);

    setAttachments(prev => {
        const newAttachments = [...prev];
        results.forEach(result => {
            if (result.status === 'fulfilled') {
                const { id, status, url } = result.value;
                const index = newAttachments.findIndex(d => d.id === id);
                if (index !== -1) { newAttachments[index] = {...newAttachments[index], status, url }; }
            }
        });
        return newAttachments;
    });

    setIsSyncing(false);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.status === 'synced').length;
    if (successCount === localFiles.length) addToast('Sincronización completada.', 'success');
    else addToast(`${successCount}/${localFiles.length} docs sincronizados. Algunos fallaron.`, 'warning');
  };
  
  const handleRemoveDocument = (docId: string) => {
    setAttachments(prev => prev.filter(d => d.id !== docId));
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) onAddDocuments(Array.from(e.dataTransfer.files));
  }, [onAddDocuments]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length > 0) onAddDocuments(Array.from(e.target.files));
    e.target.value = '';
  };

  const handleCopyPath = () => {
    navigator.clipboard.writeText(fullSavePath)
      .then(() => addToast('Ruta copiada al portapapeles.', 'success'))
      .catch(() => addToast('No se pudo copiar la ruta.', 'error'));
  };

  const formatFileSize = (bytes: number) => (bytes / 1024).toFixed(2) + ' KB';
  const getStatusIcon = (status: AttachedDocument['status']) => {
    switch(status) {
        case 'local': return <span title="Local"><CloudIcon /></span>;
        case 'uploading': return <span title="Subiendo..." className="animate-pulse"><CloudArrowUpIcon /></span>;
        case 'synced': return <span title="Sincronizado"><CloudCheckIcon /></span>;
        case 'error': return <span title="Error" className="text-red-500"><XCircleIcon /></span>;
        default: return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b"><h2 className="text-xl font-bold">Documentos Adjuntos</h2><button onClick={onClose} className="text-slate-500 hover:text-slate-800"><XMarkIcon /></button></div>
        <div className="p-6 space-y-4">
            <div className={`border-2 ${isDragging ? 'border-sky-500' : 'border-slate-300'} border-dashed rounded-lg p-4 text-center`} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}><p className="text-sm text-slate-500">Arrastra y suelta archivos aquí o...</p><label className="mt-2 inline-block cursor-pointer bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg text-sm">Añadir Documentos<input type="file" multiple className="sr-only" onChange={handleFileChange} /></label></div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {attachments.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between bg-slate-100 p-2 rounded-md">
                        <div className="flex items-center space-x-3 flex-1 overflow-hidden"><div className="text-slate-500">{getStatusIcon(doc.status)}</div><div className="flex-1 overflow-hidden"><p className="text-sm font-medium truncate" title={doc.name}>{doc.url ? <a href={doc.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-sky-600">{doc.name}</a> : doc.name}</p><p className="text-xs text-slate-500">{formatFileSize(doc.size)}</p></div></div>
                        <button onClick={() => handleRemoveDocument(doc.id)} className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full" aria-label={`Eliminar ${doc.name}`}><TrashIcon /></button>
                    </div>
                ))}
                {attachments.length === 0 && <p className="text-center text-sm text-slate-500 py-4">No hay documentos adjuntos.</p>}
            </div>
            <div className="border-t pt-4 space-y-4">
                <button onClick={handleSync} disabled={isSyncing || attachments.filter(d => d.status === 'local').length === 0} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center disabled:bg-emerald-300 disabled:cursor-not-allowed">{isSyncing ? <><SpinnerIcon/><span className="ml-2">Sincronizando...</span></> : <><CloudArrowUpIcon/><span className="ml-2">Sincronizar</span></>}</button>
                <div><label htmlFor="savePathDocs" className="block text-sm font-medium mb-1">Ruta Sugerida</label><div className="relative"><input id="savePathDocs" type="text" value={fullSavePath} readOnly className="w-full px-3 py-2 bg-slate-200 border rounded-md text-sm pr-10" /><button onClick={handleCopyPath} className="absolute inset-y-0 right-0 px-3 flex items-center" title="Copiar"><ClipboardIcon /></button></div></div>
            </div>
             <div className="flex justify-end pt-2"><button onClick={onClose} className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg">Cerrar</button></div>
        </div>
      </div>
    </div>
  );
};

export default AttachedDocumentsModal;
