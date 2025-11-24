
import React, { useEffect } from 'react';
import { EconomicData, EconomicLineItem } from '../types';
import { EuroIcon, PlusCircleIcon, TrashIcon } from './icons';

interface EconomicDataSectionProps {
  economicData: EconomicData;
  setEconomicData: React.Dispatch<React.SetStateAction<EconomicData>>;
}

const PREDEFINED_CONCEPTS = [
    'Honorarios Profesionales',
    'Tasas DGT',
    'Impuesto de Matriculación',
    'Impuesto de Transmisiones',
    'Placas de Matrícula',
    'Suplidos Colegio Gestores',
    'Otros Gastos',
];

const EconomicDataSection: React.FC<EconomicDataSectionProps> = ({ economicData, setEconomicData }) => {

    const handleLineChange = (id: string, field: 'concept' | 'amount', value: string | number) => {
        setEconomicData(prev => ({
            ...prev,
            lines: prev.lines.map(line =>
                line.id === id ? { ...line, [field]: value } : line
            ),
        }));
    };
    
    const handleAddLine = () => {
        const newLine: EconomicLineItem = {
            id: `line-${Date.now()}`,
            concept: '',
            amount: 0,
        };
        setEconomicData(prev => ({ ...prev, lines: [...prev.lines, newLine] }));
    };

    const handleRemoveLine = (id: string) => {
        setEconomicData(prev => ({
            ...prev,
            lines: prev.lines.filter(line => line.id !== id),
        }));
    };
  
    useEffect(() => {
        const subtotal = economicData.lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
        
        const honorariosTotal = economicData.lines
            .filter(line => line.concept.toLowerCase().includes('honorarios'))
            .reduce((sum, line) => sum + (Number(line.amount) || 0), 0);

        const vat = honorariosTotal * 0.21;
        const total = subtotal + vat;
        
        setEconomicData(prev => ({ 
            ...prev, 
            subtotalAmount: subtotal,
            vatAmount: vat,
            totalAmount: total 
        }));
    }, [economicData.lines, setEconomicData]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center">
                    <EuroIcon />
                    <h2 className="text-xl font-bold text-slate-900 ml-3">Datos Económicos</h2>
                </div>
                <button 
                    onClick={handleAddLine} 
                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold p-2 rounded-lg transition-colors duration-200 flex items-center justify-center"
                    aria-label="Añadir nuevo concepto"
                >
                   <PlusCircleIcon />
                </button>
            </div>

            <div className="space-y-3">
                {economicData.lines.map((line, index) => (
                    <div key={line.id} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-6">
                            {index === 0 && <label className="block text-xs font-medium text-slate-500 mb-1">Concepto</label>}
                            <select
                                value={line.concept}
                                onChange={(e) => handleLineChange(line.id, 'concept', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                            >
                                <option value="" disabled>Selecciona un concepto...</option>
                                {PREDEFINED_CONCEPTS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="col-span-4">
                            {index === 0 && <label className="block text-xs font-medium text-slate-500 mb-1">Importe (€)</label>}
                            <input 
                                type="number"
                                value={line.amount || ''}
                                placeholder="0.00"
                                onChange={(e) => handleLineChange(line.id, 'amount', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                            />
                        </div>
                        <div className="col-span-2 flex items-end h-full">
                            <button 
                                onClick={() => handleRemoveLine(line.id)}
                                className="w-full h-10 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors duration-200 disabled:bg-red-300 disabled:cursor-not-allowed"
                                aria-label="Eliminar concepto"
                            >
                                <TrashIcon />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
      
            <div className="mt-6 border-t border-slate-200 pt-4 space-y-2">
                <div className="flex justify-between items-center text-md">
                    <span className="text-slate-600">Subtotal:</span>
                    <span className="font-medium text-slate-800">
                        {economicData.subtotalAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </span>
                </div>
                <div className="flex justify-between items-center text-md">
                    <span className="text-slate-600">IVA (21% sobre honorarios):</span>
                    <span className="font-medium text-slate-800">
                        {economicData.vatAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </span>
                </div>
                <div className="flex justify-between items-center bg-slate-100 p-3 rounded-lg mt-2">
                    <span className="text-lg font-semibold text-slate-800">Importe Total:</span>
                    <span className="text-2xl font-bold text-sky-600">
                        {economicData.totalAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default EconomicDataSection;