import React, { useEffect, useState } from 'react';
import type { Client as ClientV2, ClientSearchParams } from '@/types/client';
import { searchClients, deactivateClient, reactivateClient } from '@/services/clientService';
import { getCasesByClientId } from '@/services/firestoreService';
import { Users, Plus, UserX, UserCheck, X, FolderOpen } from 'lucide-react';
import ClientDetailModal from './ClientDetailModal';

interface ClientExplorerProps {
    onClose: () => void;
}

const ClientExplorer: React.FC<ClientExplorerProps> = ({ onClose }) => {
    const [params, setParams] = useState<ClientSearchParams>({
        limit: 25,
        offset: 0,
        estado: 'ACTIVO',
    });

    const [items, setItems] = useState<ClientV2[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [caseCounts, setCaseCounts] = useState<Record<string, number>>({});

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const res = await searchClients(params);
            setItems(res.items);
            setTotal(res.total);

            // Cargar número de expedientes por cliente
            const counts: Record<string, number> = {};
            for (const client of res.items) {
                try {
                    const cases = await getCasesByClientId(client.id);
                    counts[client.id] = cases.length;
                } catch (error) {
                    counts[client.id] = 0;
                }
            }
            setCaseCounts(counts);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(params)]);

    const handleDeactivate = async (clientId: string) => {
        if (!confirm('¿Desactivar este cliente? No se eliminará, solo quedará oculto.')) return;
        try {
            await deactivateClient(clientId);
            load();
        } catch (error) {
            alert('Error al desactivar cliente');
        }
    };

    const handleReactivate = async (clientId: string) => {
        try {
            await reactivateClient(clientId);
            load();
        } catch (error) {
            alert('Error al reactivar cliente');
        }
    };

    const updateParam = <K extends keyof ClientSearchParams>(key: K, value: ClientSearchParams[K]) => {
        setParams((p) => ({ ...p, [key]: value, offset: 0 }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-purple-50 to-sky-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Explorador de Clientes</h2>
                            <p className="text-sm text-slate-600">Gestiona y busca clientes del sistema</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-2 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Filtros */}
                <div className="p-6 bg-slate-50 border-b border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Buscar (nombre/doc/tel/email)
                            </label>
                            <input
                                type="text"
                                value={params.q ?? ''}
                                onChange={(e) => updateParam('q', e.target.value || undefined)}
                                placeholder="Escribe para buscar..."
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                            <select
                                value={params.tipo ?? ''}
                                onChange={(e) => updateParam('tipo', (e.target.value || undefined) as any)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                            >
                                <option value="">Todos</option>
                                <option value="PARTICULAR">Particular</option>
                                <option value="EMPRESA">Empresa</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                            <select
                                value={params.estado ?? ''}
                                onChange={(e) => updateParam('estado', (e.target.value || undefined) as any)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                            >
                                <option value="">Todos</option>
                                <option value="ACTIVO">Activo</option>
                                <option value="INACTIVO">Inactivo</option>
                            </select>
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={() => {
                                setEditingId(null);
                                setModalOpen(true);
                            }}
                            className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Nuevo Cliente
                        </button>
                        <button
                            onClick={() => setParams({ limit: 25, offset: 0, estado: 'ACTIVO' })}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            Limpiar Filtros
                        </button>
                    </div>
                </div>

                {/* Info y tabla */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="mb-4 text-sm text-slate-600">
                        {loading ? (
                            <span className="animate-pulse">Cargando…</span>
                        ) : (
                            <span>
                                Mostrando <span className="font-semibold">{items.length}</span> de{' '}
                                <span className="font-semibold">{total}</span> clientes
                            </span>
                        )}
                    </div>

                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-100 border-b border-slate-200">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                        Cliente
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                        Documento
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                        Teléfono
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                        Nº Exps
                                    </th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {items.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-sky-400 flex items-center justify-center text-white font-bold text-xs">
                                                    {c.nombre.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-900">{c.nombre}</div>
                                                    <div className="text-xs text-slate-500">{c.tipo}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {c.documento ?? <span className="text-slate-400">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {c.telefono ?? <span className="text-slate-400">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {c.email ?? <span className="text-slate-400">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-sky-100 text-sky-700 text-xs font-bold">
                                                {caseCounts[c.id] ?? 0}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${c.estado === 'ACTIVO'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-slate-200 text-slate-600'
                                                    }`}
                                            >
                                                {c.estado}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Ver expedientes con filtro aplicado */}
                                                <button
                                                    onClick={() => {
                                                        window.location.hash = `/?clientId=${c.id}`;
                                                    }}
                                                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 p-1.5 rounded-md transition-colors"
                                                    title="Ver expedientes de este cliente"
                                                >
                                                    <FolderOpen className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setEditingId(c.id);
                                                        setModalOpen(true);
                                                    }}
                                                    className="text-sky-600 hover:text-sky-700 hover:bg-sky-50 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                                                >
                                                    Ver / Editar
                                                </button>
                                                {c.estado === 'ACTIVO' ? (
                                                    <button
                                                        onClick={() => handleDeactivate(c.id)}
                                                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 p-1.5 rounded-md transition-colors"
                                                        title="Desactivar"
                                                    >
                                                        <UserX className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleReactivate(c.id)}
                                                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 p-1.5 rounded-md transition-colors"
                                                        title="Reactivar"
                                                    >
                                                        <UserCheck className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {items.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                                            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                            <p className="font-medium">No se encontraron clientes</p>
                                            <p className="text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {modalOpen && (
                <ClientDetailModal
                    clientId={editingId}
                    onClose={() => setModalOpen(false)}
                    onSaved={() => {
                        setModalOpen(false);
                        load();
                    }}
                />
            )}
        </div>
    );
};

export default ClientExplorer;
