import React, { useEffect, useState } from 'react';
import type { Client as ClientV2, ClientCreateInput, ClientUpdateInput } from '@/types/client';
import { getClientById, createClient, updateClient } from '@/services/clientService';
import { getCasesByClientId } from '@/services/firestoreService';
import type { CaseRecord } from '@/types';
import { X, Save, Building2, User, FileText } from 'lucide-react';

type Props = {
    clientId: string | null;
    onClose: () => void;
    onSaved: () => void;
};

const ClientDetailModal: React.FC<Props> = ({ clientId, onClose, onSaved }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [client, setClient] = useState<ClientV2 | null>(null);
    const [cases, setCases] = useState<CaseRecord[]>([]);
    const [activeTab, setActiveTab] = useState<'datos' | 'expedientes'>('datos');

    const [form, setForm] = useState({
        tipo: 'PARTICULAR' as 'PARTICULAR' | 'EMPRESA',
        nombre: '',
        documento: '',
        telefono: '',
        email: '',
        direccion: '',
        notas: '',
        estado: 'ACTIVO' as 'ACTIVO' | 'INACTIVO',
    });

    useEffect(() => {
        let cancelled = false;

        async function load() {
            if (!clientId) return;
            setLoading(true);
            try {
                const [c, casesData] = await Promise.all([
                    getClientById(clientId),
                    getCasesByClientId(clientId),
                ]);

                if (cancelled) return;

                setClient(c);
                setCases(casesData);
                setForm({
                    tipo: c.tipo,
                    nombre: c.nombre ?? '',
                    documento: c.documento ?? '',
                    telefono: c.telefono ?? '',
                    email: c.email ?? '',
                    direccion: c.direccion ?? '',
                    notas: c.notas ?? '',
                    estado: c.estado,
                });
            } catch (error) {
                console.error('Error loading client:', error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [clientId]);

    const save = async () => {
        if (!form.nombre.trim()) {
            alert('El nombre es obligatorio');
            return;
        }

        console.log('💾 Intentando guardar cliente:', form);
        setSaving(true);
        try {
            if (clientId) {
                console.log('📝 Actualizando cliente existente:', clientId);
                const input: ClientUpdateInput = {
                    ...form,
                    documento: form.documento || undefined,
                    telefono: form.telefono || undefined,
                    email: form.email || undefined,
                    direccion: form.direccion || undefined,
                    notas: form.notas || undefined,
                };
                await updateClient(clientId, input);
                console.log('✅ Cliente actualizado');
            } else {
                console.log('🆕 Creando nuevo cliente');
                const input: ClientCreateInput = {
                    tipo: form.tipo,
                    nombre: form.nombre,
                    documento: form.documento || undefined,
                    telefono: form.telefono || undefined,
                    email: form.email || undefined,
                    direccion: form.direccion || undefined,
                    notas: form.notas || undefined,
                };
                const created = await createClient(input);
                console.log('✅ Cliente creado:', created);
            }
            console.log('📞 Llamando onSaved()');
            onSaved();
        } catch (error: any) {
            console.error('❌ Error al guardar cliente:', error);
            alert(error?.message ?? 'Error al guardar cliente');
        } finally {
            setSaving(false);
        }
    };

    const updateForm = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
        setForm((f) => ({ ...f, [key]: value }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-sky-50 to-purple-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-sky-100 rounded-lg">
                            {form.tipo === 'EMPRESA' ? (
                                <Building2 className="w-6 h-6 text-sky-600" />
                            ) : (
                                <User className="w-6 h-6 text-sky-600" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900">
                                {clientId ? 'Editar Cliente' : 'Nuevo Cliente'}
                            </h3>
                            {client && (
                                <p className="text-sm text-slate-600">ID: {client.id.slice(0, 8)}...</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-2 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                {clientId && (
                    <div className="flex border-b border-slate-200 bg-slate-50">
                        <button
                            onClick={() => setActiveTab('datos')}
                            className={`px-6 py-3 font-medium transition-colors ${activeTab === 'datos'
                                ? 'text-sky-600 border-b-2 border-sky-600 bg-white'
                                : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            Datos del Cliente
                        </button>
                        <button
                            onClick={() => setActiveTab('expedientes')}
                            className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${activeTab === 'expedientes'
                                ? 'text-sky-600 border-b-2 border-sky-600 bg-white'
                                : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            <FileText className="w-4 h-4" />
                            Expedientes ({cases.length})
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {loading && (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-3"></div>
                                <p className="text-slate-600">Cargando…</p>
                            </div>
                        </div>
                    )}

                    {!loading && activeTab === 'datos' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Tipo <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={form.tipo}
                                        onChange={(e) => updateForm('tipo', e.target.value as any)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                    >
                                        <option value="PARTICULAR">Particular</option>
                                        <option value="EMPRESA">Empresa</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                                    <select
                                        value={form.estado}
                                        onChange={(e) => updateForm('estado', e.target.value as any)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                    >
                                        <option value="ACTIVO">Activo</option>
                                        <option value="INACTIVO">Inactivo</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {form.tipo === 'EMPRESA' ? 'Razón Social' : 'Nombre Completo'}{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.nombre}
                                    onChange={(e) => updateForm('nombre', e.target.value)}
                                    placeholder={form.tipo === 'EMPRESA' ? 'Ej: TALLERES GARCÍA S.L.' : 'Ej: GARCÍA LÓPEZ, JUAN'}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    {form.tipo === 'EMPRESA'
                                        ? 'Introduce la razón social completa'
                                        : 'Formato recomendado: APELLIDOS, NOMBRE'}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        DNI / NIE / CIF
                                    </label>
                                    <input
                                        type="text"
                                        value={form.documento}
                                        onChange={(e) => updateForm('documento', e.target.value)}
                                        placeholder="12345678A"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                                    <input
                                        type="tel"
                                        value={form.telefono}
                                        onChange={(e) => updateForm('telefono', e.target.value)}
                                        placeholder="600 123 456"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => updateForm('email', e.target.value)}
                                        placeholder="ejemplo@correo.com"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                                    <input
                                        type="text"
                                        value={form.direccion}
                                        onChange={(e) => updateForm('direccion', e.target.value)}
                                        placeholder="Calle Mayor 1, 28001 Madrid"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
                                    <textarea
                                        rows={4}
                                        value={form.notas}
                                        onChange={(e) => updateForm('notas', e.target.value)}
                                        placeholder="Información adicional sobre el cliente..."
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {!loading && activeTab === 'expedientes' && (
                        <div>
                            {cases.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                    <p className="font-medium">Sin expedientes asociados</p>
                                    <p className="text-sm mt-1">
                                        Este cliente aún no tiene expedientes asignados
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {cases.map((c) => (
                                        <div
                                            key={c.fileNumber}
                                            className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="font-semibold text-slate-900">{c.fileNumber}</div>
                                                    <div className="text-sm text-slate-600 mt-1">
                                                        {c.fileConfig.category} - {c.fileConfig.fileType}
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-1">
                                                        Creado: {new Date(c.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${c.status === 'Cerrado'
                                                        ? 'bg-slate-200 text-slate-700'
                                                        : 'bg-sky-100 text-sky-700'
                                                        }`}
                                                >
                                                    {c.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={save}
                        disabled={saving || !form.nombre.trim()}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClientDetailModal;
