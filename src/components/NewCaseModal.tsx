import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './icons';
import { FileCategory } from '../types';
import { getSettings, getNextFileNumber } from '../services/firestoreService';

interface NewCaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (category: FileCategory, subType?: string) => void;
}

const NewCaseModal: React.FC<NewCaseModalProps> = ({ isOpen, onClose, onCreate }) => {
    const [selectedCategory, setSelectedCategory] = useState<FileCategory>('GE-MAT');
    const [selectedSubType, setSelectedSubType] = useState<string>('');
    const [fileTypes, setFileTypes] = useState<Record<FileCategory, string[]>>({
        'GE-MAT': [],
        'FI-TRI': [],
        'FI-CONTA': []
    });

    const [nextFileNumber, setNextFileNumber] = useState<string>('');

    useEffect(() => {
        const loadSettings = async () => {
            const settings = await getSettings();
            if (settings && settings.fileTypes) {
                setFileTypes(settings.fileTypes);
                // Set default subtype for the initial category
                if (settings.fileTypes['GE-MAT'] && settings.fileTypes['GE-MAT'].length > 0) {
                    setSelectedSubType(settings.fileTypes['GE-MAT'][0]);
                }
            }
        };
        if (isOpen) {
            loadSettings();
        }
    }, [isOpen]);

    useEffect(() => {
        // Update subtype when category changes
        if (fileTypes[selectedCategory] && fileTypes[selectedCategory].length > 0) {
            setSelectedSubType(fileTypes[selectedCategory][0]);
        } else {
            setSelectedSubType('');
        }

        // Fetch next file number
        const fetchNextNumber = async () => {
            const num = await getNextFileNumber(selectedCategory);
            setNextFileNumber(num);
        };
        fetchNextNumber();
    }, [selectedCategory, fileTypes]);

    if (!isOpen) return null;

    const handleCreate = () => {
        onCreate(selectedCategory, selectedSubType);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">Nuevo Expediente</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Categoría del Expediente
                        </label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value as FileCategory)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none transition-shadow"
                        >
                            <option value="GE-MAT">Gestión Matriculación (GE-MAT)</option>
                            <option value="FI-TRI">Fiscal Tributario (FI-TRI)</option>
                            <option value="FI-CONTA">Fiscal Contable (FI-CONTA)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Tipo Específico
                        </label>
                        <select
                            value={selectedSubType}
                            onChange={(e) => setSelectedSubType(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 outline-none transition-shadow"
                            disabled={!fileTypes[selectedCategory] || fileTypes[selectedCategory].length === 0}
                        >
                            {fileTypes[selectedCategory]?.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex justify-between items-center">
                        <span>Se asignará el número:</span>
                        <span className="font-mono font-bold text-lg">{nextFileNumber || 'Cargando...'}</span>
                    </div>
                </div>

                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleCreate}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold shadow-sm transition-colors"
                    >
                        Crear Expediente
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewCaseModal;
