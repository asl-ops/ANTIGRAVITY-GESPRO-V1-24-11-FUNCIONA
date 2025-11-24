import React, { useState, useEffect } from 'react';
import { CaseRecord } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/useToast';
import { Download, Search, CheckSquare, Square, Loader } from 'lucide-react';

const BajarExpedientes: React.FC = () => {
    const { caseHistory } = useAppContext();
    const { addToast } = useToast();

    const [searchIdentifier, setSearchIdentifier] = useState('');
    const [searchResults, setSearchResults] = useState<CaseRecord[]>([]);
    const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());
    const [isSearching, setIsSearching] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (searchIdentifier.trim()) {
            handleSearch();
        } else {
            setSearchResults([]);
        }
    }, [searchIdentifier]);

    const handleSearch = () => {
        setIsSearching(true);

        // Search by identifier (partial match)
        const results = caseHistory.filter(c =>
            c.fileNumber.toLowerCase().includes(searchIdentifier.toLowerCase()) &&
            c.status !== 'Eliminado'
        );

        setSearchResults(results);
        setIsSearching(false);
    };

    const toggleCase = (fileNumber: string) => {
        const newSelected = new Set(selectedCases);
        if (newSelected.has(fileNumber)) {
            newSelected.delete(fileNumber);
        } else {
            newSelected.add(fileNumber);
        }
        setSelectedCases(newSelected);
    };

    const toggleAll = () => {
        if (selectedCases.size === searchResults.length) {
            setSelectedCases(new Set());
        } else {
            setSelectedCases(new Set(searchResults.map(c => c.fileNumber)));
        }
    };

    const handleDownloadSelected = async () => {
        if (selectedCases.size === 0) {
            addToast('Selecciona al menos un expediente', 'error');
            return;
        }

        setIsDownloading(true);

        try {
            // Get selected cases
            const casesToDownload = searchResults.filter(c => selectedCases.has(c.fileNumber));

            // Create JSON export
            const exportData = {
                exportDate: new Date().toISOString(),
                totalCases: casesToDownload.length,
                cases: casesToDownload
            };

            // Create blob and download
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `expedientes_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            addToast(`${selectedCases.size} expediente(s) descargado(s)`, 'success');
            setSelectedCases(new Set());
        } catch (error) {
            console.error('Error downloading cases:', error);
            addToast('Error al descargar expedientes', 'error');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Bajar Expedientes</h2>
                <p className="text-slate-600 mt-1">Busca y descarga expedientes por identificador</p>
            </div>

            {/* Search */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="flex-1 flex items-center bg-slate-50 border border-slate-300 rounded-lg px-4 py-2">
                        <Search className="w-5 h-5 text-slate-400 mr-2" />
                        <input
                            type="text"
                            placeholder="Buscar por identificador (ej: EXP-0001, GMAT-2024-001)..."
                            value={searchIdentifier}
                            onChange={(e) => setSearchIdentifier(e.target.value)}
                            className="flex-1 bg-transparent outline-none text-slate-900"
                        />
                    </div>
                    {isSearching && <Loader className="w-5 h-5 animate-spin text-indigo-600" />}
                </div>
            </div>

            {/* Results */}
            {searchResults.length > 0 && (
                <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                    {/* Actions Bar */}
                    <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={toggleAll}
                                className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-indigo-600"
                            >
                                {selectedCases.size === searchResults.length ? (
                                    <CheckSquare className="w-5 h-5" />
                                ) : (
                                    <Square className="w-5 h-5" />
                                )}
                                Seleccionar todos ({searchResults.length})
                            </button>
                            <span className="text-sm text-slate-600">
                                {selectedCases.size} seleccionado(s)
                            </span>
                        </div>
                        <button
                            onClick={handleDownloadSelected}
                            disabled={selectedCases.size === 0 || isDownloading}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                        >
                            {isDownloading ? (
                                <>
                                    <Loader className="w-4 h-4 animate-spin" />
                                    Descargando...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    Bajar Seleccionados
                                </>
                            )}
                        </button>
                    </div>

                    {/* Table */}
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="w-12 px-6 py-3"></th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">Identificador</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">Cliente</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">Prefijo</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">Estado</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {searchResults.map(caseRecord => (
                                <tr
                                    key={caseRecord.fileNumber}
                                    className={`hover:bg-slate-50 cursor-pointer ${selectedCases.has(caseRecord.fileNumber) ? 'bg-indigo-50' : ''
                                        }`}
                                    onClick={() => toggleCase(caseRecord.fileNumber)}
                                >
                                    <td className="px-6 py-4">
                                        {selectedCases.has(caseRecord.fileNumber) ? (
                                            <CheckSquare className="w-5 h-5 text-indigo-600" />
                                        ) : (
                                            <Square className="w-5 h-5 text-slate-400" />
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-slate-900">{caseRecord.fileNumber}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-slate-700">
                                            {caseRecord.client.firstName} {caseRecord.client.surnames}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                            {caseRecord.prefixId || caseRecord.fileConfig.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-slate-700">{caseRecord.status}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-slate-600">
                                            {new Date(caseRecord.createdAt).toLocaleDateString('es-ES')}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Empty State */}
            {searchIdentifier && searchResults.length === 0 && !isSearching && (
                <div className="bg-white rounded-xl shadow-md border border-slate-200 p-12 text-center">
                    <p className="text-slate-500">No se encontraron expedientes con el identificador "{searchIdentifier}"</p>
                </div>
            )}

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Cómo usar</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Escribe el identificador completo o parcial del expediente</li>
                    <li>• Selecciona uno o varios expedientes con los checkboxes</li>
                    <li>• Haz clic en "Bajar Seleccionados" para descargar en formato JSON</li>
                    <li>• Los expedientes se descargarán con todos sus datos completos</li>
                </ul>
            </div>
        </div>
    );
};

export default BajarExpedientes;
