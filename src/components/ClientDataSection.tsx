
import React, { useState, useCallback } from 'react';
import { Client } from '../types';
import { extractDataFromImage } from '../services/geminiService';
import { UserIcon, OcrIcon, SaveIcon, LoadIcon, SpinnerIcon } from './icons';
import SavedClientsModal from './SavedClientsModal';
import { useAppContext } from '../contexts/AppContext';
import { useToast } from '../hooks/useToast';

interface ClientDataSectionProps {
  client: Client;
  setClient: React.Dispatch<React.SetStateAction<Client>>;
  onDocumentProcessed: (file: File) => void;
}

const ClientDataSection: React.FC<ClientDataSectionProps> = ({ client, setClient, onDocumentProcessed }) => {
  const { savedClients, saveClient } = useAppContext();
  const { addToast } = useToast();
  
  const [isLoadingOcr, setIsLoadingOcr] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [suggestions, setSuggestions] = useState<Client[]>([]);

  const calculateDniLetter = (dniNumbers: string): string => {
    if (dniNumbers.length !== 8) return '';
    return 'TRWAGMYFPDXBNJZSQVHLCKE'[parseInt(dniNumbers, 10) % 23];
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let finalValue = value;
    
    if (name === 'nif') {
        let processedValue = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
        if (/^\d{8}-$/.test(processedValue)) {
            const dniBase = processedValue.substring(0, 8);
            processedValue = `${dniBase}-${calculateDniLetter(dniBase)}`;
        }
        finalValue = processedValue;
    }
    
    setClient(prev => ({ ...prev, [name]: finalValue }));

    if ((name === 'surnames' || name === 'nif') && value.length > 2) {
        const lowerCaseValue = value.toLowerCase();
        const filtered = savedClients.filter(c => 
            (name === 'surnames' && (c.surnames.toLowerCase().includes(lowerCaseValue) || `${c.firstName} ${c.surnames}`.toLowerCase().includes(lowerCaseValue))) ||
            (name === 'nif' && c.nif.toLowerCase().startsWith(lowerCaseValue))
        );
        setSuggestions(filtered.slice(0, 5));
    } else {
        setSuggestions([]);
    }
  };
  
  const handleSuggestionClick = (selectedClient: Client) => {
    setClient(selectedClient);
    setSuggestions([]);
  };

  const processFile = useCallback(async (file: File) => {
    if (!file) return;
    setIsLoadingOcr(true);
    try {
      const extractedData = await extractDataFromImage(file);
      setClient(prev => ({
        ...prev,
        surnames: extractedData.surnames || prev.surnames,
        firstName: extractedData.firstName || prev.firstName,
        nif: extractedData.nif || prev.nif,
        address: extractedData.address || prev.address,
        city: extractedData.city || prev.city,
        province: extractedData.province || prev.province,
        postalCode: extractedData.postalCode || prev.postalCode,
      }));
      onDocumentProcessed(file);
      addToast('Datos extraídos del documento.', 'success');
    } catch (err: any) {
      addToast(err.message.includes('API Key') ? err.message : 'Error al procesar el documento.', 'error');
      console.error(err);
    } finally {
      setIsLoadingOcr(false);
    }
  }, [setClient, onDocumentProcessed, addToast]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      processFile(file);
    } else {
      addToast('Por favor, suelta un archivo de imagen o PDF.', 'warning');
    }
  };

  const handleSelectAndClose = (selectedClient: Client) => {
    setClient(selectedClient);
    setIsModalOpen(false);
  };
  
  const handleSaveClient = useCallback(async () => {
    if ((client.surnames || client.firstName) && client.nif) {
        if (!savedClients.find(c => c.nif === client.nif)) {
            const newClient = { ...client, id: `cli_${Date.now()}` };
            await saveClient(newClient);
        } else {
            addToast('Un cliente con este Identificador ya existe.', 'warning');
        }
    } else {
        addToast('Se requiere Apellidos/Razón Social e Identificador.', 'error');
    }
  }, [client, savedClients, addToast, saveClient]);


  return (
    <div 
      className={`relative bg-white p-6 rounded-xl shadow-md transition-all duration-300 border-2 ${isDragging ? 'border-sky-500 border-dashed' : 'border-transparent'}`}
      onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
    >
      <div className="flex items-center mb-6"><UserIcon /><h2 className="text-xl font-bold text-slate-900 ml-3">Datos del Cliente</h2></div>
      
      {isDragging && (
        <div className="absolute inset-0 bg-sky-100 bg-opacity-50 flex items-center justify-center rounded-xl pointer-events-none z-10"><p className="text-lg font-semibold text-sky-700">Suelta el documento aquí</p></div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative"><label className="block text-sm font-medium text-slate-700">Apellidos / Razón Social</label><input type="text" name="surnames" value={client.surnames} onChange={handleChange} onBlur={() => setTimeout(() => setSuggestions([]), 150)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" />{suggestions.length > 0 && (<ul className="absolute z-20 w-full bg-white border border-slate-300 rounded-md mt-1 shadow-lg max-h-48 overflow-y-auto">{suggestions.map(s => <li key={s.id} onMouseDown={() => handleSuggestionClick(s)} className="p-2 hover:bg-sky-100 cursor-pointer text-sm"><strong>{s.surnames}</strong>, {s.firstName} ({s.nif})</li>)}</ul>)}</div>
        <div><label className="block text-sm font-medium text-slate-700">Nombre</label><input type="text" name="firstName" value={client.firstName} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" /></div>
        <div className="relative"><label className="block text-sm font-medium text-slate-700">Identificador (NIF/CIF/NIE)</label><input type="text" name="nif" value={client.nif} onChange={handleChange} onBlur={() => setTimeout(() => setSuggestions([]), 150)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" />{suggestions.length > 0 && (<ul className="absolute z-20 w-full bg-white border border-slate-300 rounded-md mt-1 shadow-lg max-h-48 overflow-y-auto">{suggestions.map(s => <li key={s.id} onMouseDown={() => handleSuggestionClick(s)} className="p-2 hover:bg-sky-100 cursor-pointer text-sm"><strong>{s.nif}</strong> - {s.surnames}, {s.firstName}</li>)}</ul>)}</div>
         <div><label className="block text-sm font-medium text-slate-700">Teléfono</label><input type="tel" name="phone" value={client.phone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" /></div>
        <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700">Dirección (Vía y número)</label><input type="text" name="address" value={client.address} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" /></div>
        <div><label className="block text-sm font-medium text-slate-700">Localidad</label><input type="text" name="city" value={client.city} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" /></div>
        <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-700">Provincia</label><input type="text" name="province" value={client.province} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" /></div><div><label className="block text-sm font-medium text-slate-700">Cód. Postal</label><input type="text" name="postalCode" value={client.postalCode} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" /></div></div>
         <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700">Email</label><input type="email" name="email" value={client.email} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" /></div>
      </div>
      
      <div className="mt-6 border-t border-slate-200 pt-6 flex flex-col sm:flex-row gap-3">
        <label title="Leer datos desde DNI/CIF" className="relative flex-1 cursor-pointer bg-sky-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center hover:bg-sky-700">{isLoadingOcr ? <SpinnerIcon /> : <OcrIcon />}<span className="ml-2">{isLoadingOcr ? 'Procesando...' : 'Leer Documento (OCR)'}</span><input type="file" className="sr-only" onChange={handleFileChange} accept="image/*,application/pdf" disabled={isLoadingOcr} /></label>
        <button onClick={() => setIsModalOpen(true)} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg flex items-center justify-center"><LoadIcon /><span className="ml-2">Cargar Cliente</span></button>
        <button onClick={handleSaveClient} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center"><SaveIcon /><span className="ml-2">Guardar Cliente</span></button>
      </div>

      <SavedClientsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} clients={savedClients} onSelect={handleSelectAndClose} />
    </div>
  );
};

export default ClientDataSection;