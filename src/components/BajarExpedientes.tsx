import React, { useState, useEffect } from 'react';
import { CaseRecord, Communication } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/useToast';
import { AlertTriangle, Search, CheckSquare, Square, Loader, Lock } from 'lucide-react';

const BajarExpedientes: React.FC = () => {
    const { caseHistory, saveCase, currentUser } = useAppContext();
    const { addToast } = useToast();

    const [searchIdentifier, setSearchIdentifier] = useState('');
    const [searchResults, setSearchResults] = useState<CaseRecord[]>([]);
    const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());
    const [isSearching, setIsSearching] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Modal de confirmación
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const DELETION_PASSWORD = '1812';

    useEffect(() => {
        if (searchIdentifier.trim()) {
            handleSearch();
        } else {
            setSearchResults([]);
        }
    }, [searchIdentifier]);

    const handleSearch = () => {
        setIsSearching(true);

        // Search by client NIF/DNI/CIF (partial match) - exclude already deleted cases
        const results = caseHistory.filter(c =>
            c.client.nif?.toLowerCase().includes(searchIdentifier.toLowerCase()) &&
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

    const handleDeleteSelected = async () => {
        if (selectedCases.size === 0) {
            addToast('Selecciona al menos un expediente', 'error');
            return;
        }

        // Open password confirmation modal
        setShowConfirmModal(true);
        setPasswordInput('');
        setPasswordError('');
    };

    const confirmDeletion = async () => {
        // Verify password
        if (passwordInput !== DELETION_PASSWORD) {
            setPasswordError('Contraseña incorrecta');
            return;
        }

        if (!currentUser) {
            addToast('Error: Usuario no identificado', 'error');
            return;
        }

        setIsDeleting(true);
        setShowConfirmModal(false);

        try {
            // Get selected cases
            const casesToDelete = searchResults.filter(c => selectedCases.has(c.fileNumber));

            // Update each case to "Eliminado" status
            for (const caseRecord of casesToDelete) {
                const auditLog: Communication = {
                    id: `audit-${Date.now()}-${Math.random()}`,
                    date: new Date().toISOString(),
                    concept: `Expediente dado de baja por ${currentUser.name}`,
                    authorUserId: currentUser.id
                };

                const updatedCase: CaseRecord = {
                    ...caseRecord,
                    status: 'Eliminado',
                    communications: [...caseRecord.communications, auditLog],
                    updatedAt: new Date().toISOString()
                };

                await saveCase(updatedCase);
            }

            addToast(`${selectedCases.size} expediente(s) dado(s) de baja correctamente`, 'success');
            setSelectedCases(new Set());

            // Refresh search results
            handleSearch();
        } catch (error) {
            console.error('Error deleting cases:', error);
            addToast('Error al dar de baja expedientes', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const cancelDeletion = () => {
        setShowConfirmModal(false);
        setPasswordInput('');
        setPasswordError('');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Baja de Expedientes</h2>
                <p className="text-slate-600 mt-1">Busca expedientes por DNI/CIF del cliente y dales de baja</p>
            </div>

            {/* Search */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="flex-1 flex items-center bg-slate-50 border border-slate-300 rounded-lg px-4 py-2">
                        <Search className="w-5 h-5 text-slate-400 mr-2" />
                        <input
                            type="text"
                            placeholder="Buscar por DNI/CIF/NIF del cliente..."
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
                            onClick={handleDeleteSelected}
                            disabled={selectedCases.size === 0 || isDeleting}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader className="w-4 h-4 animate-spin" />
                                    Dando de baja...
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="w-4 h-4" />
                                    Dar de Baja Seleccionados
                                </>
                            )}
                        </button>
                    </div>

                    {/* Table */}
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="w-12 px-6 py-3"></th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">Nº Expediente</th>
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
                                    className={`hover:bg-slate-50 cursor-pointer ${selectedCases.has(caseRecord.fileNumber) ? 'bg-red-50' : ''
                                        }`}
                                    onClick={() => toggleCase(caseRecord.fileNumber)}
                                >
                                    <td className="px-6 py-4">
                                        {selectedCases.has(caseRecord.fileNumber) ? (
                                            <CheckSquare className="w-5 h-5 text-red-600" />
                                        ) : (
                                            <Square className="w-5 h-5 text-slate-400" />
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-slate-900">{caseRecord.fileNumber}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-slate-700">{caseRecord.client.nif || 'Sin DNI/CIF'}</span>
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
                    <p className="text-slate-500">No se encontraron expedientes con el DNI/CIF "{searchIdentifier}"</p>
                </div>
            )}

            {/* Info */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2">⚠️ Importante</h4>
                <ul className="text-sm text-red-800 space-y-1">
                    <li>• Escribe el DNI/CIF/NIF del cliente para buscar sus expedientes</li>
                    <li>• Selecciona uno o varios expedientes con los checkboxes</li>
                    <li>• Al dar de baja, se requerirá una contraseña de confirmación (1812)</li>
                    <li>• Los expedientes se marcarán como "Eliminado" en el sistema</li>
                    <li>• Esta acción se registrará en el historial del expediente</li>
                </ul>
            </div>

            {/* Password Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <Lock className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Confirmar Baja de Expedientes</h3>
                                <p className="text-sm text-slate-600">
                                    Se darán de baja {selectedCases.size} expediente(s)
                                </p>
                            </div>
                        </div>

                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">
                                Esta acción marcará los expedientes como eliminados. Los expedientes no se borrarán permanentemente.
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Contraseña de Confirmación *
                            </label>
                            <input
                                type="password"
                                value={passwordInput}
                                onChange={(e) => {
                                    setPasswordInput(e.target.value);
                                    setPasswordError('');
                                }}
                                onKeyPress={(e) => e.key === 'Enter' && confirmDeletion()}
                                placeholder="Ingresa la contraseña"
                                className={`w-full border ${passwordError ? 'border-red-500' : 'border-slate-300'} rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                                autoFocus
                            />
                            {passwordError && (
                                <p className="text-sm text-red-600 mt-1">{passwordError}</p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={confirmDeletion}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                Confirmar Baja
                            </button>
                            <button
                                onClick={cancelDeletion}
                                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BajarExpedientes;
