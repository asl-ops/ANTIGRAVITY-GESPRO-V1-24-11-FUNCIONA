import React, { useState, useCallback } from 'react';
import { Vehicle } from '../types';
import { extractVehicleDataFromImage } from '../services/geminiService';
import { CarIcon, OcrIcon, SpinnerIcon, SaveIcon, LoadIcon } from './icons';
import { useToast } from '../hooks/useToast';
import { useAppContext } from '../contexts/AppContext';
import SavedVehiclesModal from './SavedVehiclesModal';

interface VehicleDataSectionProps {
  vehicle: Vehicle;
  setVehicle: React.Dispatch<React.SetStateAction<Vehicle>>;
  fileType: string;
  onBatchProcess: (files: File[]) => void;
  isBatchProcessing: boolean;
  onDocumentProcessed: (file: File) => void;
}

const VehicleDataSection: React.FC<VehicleDataSectionProps> = ({ vehicle, setVehicle, fileType, onBatchProcess, isBatchProcessing, onDocumentProcessed }) => {
  const { addToast } = useToast();
  const { savedVehicles, saveVehicle } = useAppContext();
  const [isLoadingOcr, setIsLoadingOcr] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isMultipleMode = fileType === 'Matriculación Múltiple (mismo titular)';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVehicle(prev => ({ ...prev, [name]: value }));
  };

  const processFile = useCallback(async (file: File) => {
    if (!file) return;
    setIsLoadingOcr(true);
    try {
      const extractedData = await extractVehicleDataFromImage(file);
      setVehicle(prev => ({
        ...prev,
        vin: extractedData.vin || prev.vin,
        brand: extractedData.brand || prev.brand,
        model: extractedData.model || prev.model,
        year: extractedData.year || prev.year,
        engineSize: extractedData.engineSize || prev.engineSize,
        fuelType: extractedData.fuelType || prev.fuelType,
      }));
      onDocumentProcessed(file);
      addToast('Datos de la ficha técnica extraídos.', 'success');
    } catch (err: any) {
      addToast(err.message.includes('API Key') ? err.message : 'Error al procesar la ficha técnica.', 'error');
      console.error(err);
    } finally {
      setIsLoadingOcr(false);
    }
  }, [setVehicle, onDocumentProcessed, addToast]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    if (isMultipleMode) onBatchProcess(Array.from(files));
    else processFile(files[0]);
    event.target.value = '';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles || droppedFiles.length === 0) return;
    const validFiles = Array.from(droppedFiles).filter((file: File) => file.type.startsWith('image/') || file.type === 'application/pdf');
    if (validFiles.length === 0) { addToast('Por favor, suelta archivos de imagen o PDF.', 'warning'); return; }
    if (isMultipleMode) onBatchProcess(validFiles);
    else processFile(validFiles[0]);
  };

  const handleSaveVehicle = useCallback(async () => {
    if (vehicle.vin && vehicle.brand) {
      if (!savedVehicles.find(v => v.vin === vehicle.vin)) {
          const newVehicle = { ...vehicle, id: `veh_${Date.now()}` };
          await saveVehicle(newVehicle);
      } else {
          addToast('Un vehículo con este VIN ya existe.', 'warning');
      }
    } else {
        addToast('Se requiere Nº de Bastidor y Marca para guardar.', 'error');
    }
  }, [vehicle, savedVehicles, addToast, saveVehicle]);

  const handleSelectAndClose = (selectedVehicle: Vehicle) => {
    setVehicle(selectedVehicle);
    setIsModalOpen(false);
  };

  const isProcessing = isMultipleMode ? isBatchProcessing : isLoadingOcr;

  return (
    <div 
        className={`bg-white p-6 rounded-xl shadow-md transition-all duration-300 relative border-2 ${isDragging ? 'border-sky-500 border-dashed' : 'border-transparent'}`}
        onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
    >
      <div className="flex items-center mb-6"><CarIcon /><h2 className="text-xl font-bold text-slate-900 ml-3">Datos del Vehículo</h2></div>
      {isDragging && <div className="absolute inset-0 bg-sky-100 bg-opacity-50 flex items-center justify-center rounded-xl pointer-events-none z-10"><p className="text-lg font-semibold text-sky-700">{isMultipleMode ? 'Suelta las fichas técnicas aquí' : 'Suelta la ficha técnica aquí'}</p></div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700">Nº de Bastidor (VIN)</label><input type="text" name="vin" value={vehicle.vin} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" /></div>
        <div><label className="block text-sm font-medium text-slate-700">Marca</label><input type="text" name="brand" value={vehicle.brand} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" /></div>
        <div><label className="block text-sm font-medium text-slate-700">Modelo</label><input type="text" name="model" value={vehicle.model} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" /></div>
        <div><label className="block text-sm font-medium text-slate-700">Fecha Matriculación</label><input type="text" name="year" placeholder="DD/MM/AAAA" value={vehicle.year} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" /></div>
         <div><label className="block text-sm font-medium text-slate-700">Cilindrada (cc)</label><input type="text" name="engineSize" value={vehicle.engineSize} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" /></div>
        <div><label className="block text-sm font-medium text-slate-700">Combustible</label><input type="text" name="fuelType" value={vehicle.fuelType} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" /></div>
      </div>
      <div className="mt-6 border-t border-slate-200 pt-6 flex flex-col sm:flex-row gap-3">
        <label title="Leer datos desde Ficha Técnica" className="relative flex-1 cursor-pointer bg-sky-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center hover:bg-sky-700">{isProcessing ? <SpinnerIcon /> : <OcrIcon />}<span className="ml-2">{isProcessing ? (isMultipleMode ? 'Procesando Lote...' : 'Procesando Ficha...') : (isMultipleMode ? 'Leer Fichas Técnicas (OCR)' : 'Leer Ficha Técnica (OCR)')}</span><input type="file" className="sr-only" onChange={handleFileChange} accept="image/*,application/pdf" disabled={isProcessing} multiple={isMultipleMode}/></label>
        <button onClick={() => setIsModalOpen(true)} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg flex items-center justify-center"><LoadIcon /><span className="ml-2">Cargar Vehículo</span></button>
        <button onClick={handleSaveVehicle} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center"><SaveIcon /><span className="ml-2">Guardar Vehículo</span></button>
      </div>
      <SavedVehiclesModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelect={handleSelectAndClose} />
    </div>
  );
};

export default VehicleDataSection;