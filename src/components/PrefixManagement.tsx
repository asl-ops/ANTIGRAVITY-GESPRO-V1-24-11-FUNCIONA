import React, { useState, useEffect } from 'react';
import { PrefixConfig, PrefixLine, ConceptCatalog, LineType } from '@/types';
import { getPrefixes, savePrefix, createPrefix, deletePrefix } from '@/services/prefixService';
import { getActiveConcepts } from '@/services/conceptService';
import { useToast } from '@/hooks/useToast';
import { Plus, Edit2, Trash2, Save, X, GripVertical } from 'lucide-react';

const PrefixManagement: React.FC = () => {
    const { addToast } = useToast();
    const [prefixes, setPrefixes] = useState<PrefixConfig[]>([]);
    const [concepts, setConcepts] = useState<ConceptCatalog[]>([]);
    const [selectedPrefix, setSelectedPrefix] = useState<PrefixConfig | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form state for new/edit prefix
    const [formCode, setFormCode] = useState('');
    const [formDescription, setFormDescription] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [prefixesData, conceptsData] = await Promise.all([
                getPrefixes(),
                getActiveConcepts()
            ]);
            setPrefixes(prefixesData);
            setConcepts(conceptsData);
        } catch (error) {
            addToast('Error al cargar datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePrefix = async () => {
        if (!formCode.trim() || !formDescription.trim()) {
            addToast('Código y descripción son obligatorios', 'error');
            return;
        }

        try {
            await createPrefix(formCode.trim(), formDescription.trim());
            addToast('Prefijo creado correctamente', 'success');
            setFormCode('');
            setFormDescription('');
            setIsCreating(false);
            await loadData();
        } catch (error) {
            addToast('Error al crear prefijo', 'error');
        }
    };

    const handleSelectPrefix = (prefix: PrefixConfig) => {
        setSelectedPrefix(prefix);
        setFormCode(prefix.code);
        setFormDescription(prefix.description);
        setIsEditing(false);
    };

    const handleSavePrefix = async () => {
        if (!selectedPrefix) return;

        try {
            await savePrefix({
                ...selectedPrefix,
                code: formCode.trim(),
                description: formDescription.trim()
            });
            addToast('Prefijo actualizado correctamente', 'success');
            setIsEditing(false);
            await loadData();
        } catch (error) {
            addToast('Error al guardar prefijo', 'error');
        }
    };

    const handleDeletePrefix = async (prefixId: string) => {
        if (!confirm('¿Está seguro de desactivar este prefijo?')) return;

        try {
            await deletePrefix(prefixId);
            addToast('Prefijo desactivado', 'success');
            if (selectedPrefix?.id === prefixId) {
                setSelectedPrefix(null);
            }
            await loadData();
        } catch (error) {
            addToast('Error al desactivar prefijo', 'error');
        }
    };

    const handleAddLine = () => {
        if (!selectedPrefix) return;

        const newLine: PrefixLine = {
            id: `line_${Date.now()}`,
            order: selectedPrefix.lines.length + 1,
            type: 'honorario',
            conceptId: concepts[0]?.id || '',
            conceptName: concepts[0]?.name || '',
            defaultAmount: 0,
            isIncluded: true
        };

        setSelectedPrefix({
            ...selectedPrefix,
            lines: [...selectedPrefix.lines, newLine]
        });
    };

    const handleUpdateLine = (lineId: string, updates: Partial<PrefixLine>) => {
        if (!selectedPrefix) return;

        setSelectedPrefix({
            ...selectedPrefix,
            lines: selectedPrefix.lines.map(line =>
                line.id === lineId ? { ...line, ...updates } : line
            )
        });
    };

    const handleRemoveLine = (lineId: string) => {
        if (!selectedPrefix) return;

        setSelectedPrefix({
            ...selectedPrefix,
            lines: selectedPrefix.lines.filter(line => line.id !== lineId)
        });
    };

    const handleSaveLines = async () => {
        if (!selectedPrefix) return;

        try {
            await savePrefix(selectedPrefix);
            addToast('Líneas guardadas correctamente', 'success');
            await loadData();
        } catch (error) {
            addToast('Error al guardar líneas', 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-slate-600">Cargando...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">Gestión de Prefijos</h2>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Prefijo
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Prefix List */}
                <div className="lg:col-span-1 bg-white rounded-lg border border-slate-200 p-4">
                    <h3 className="font-semibold text-slate-700 mb-4">Prefijos Existentes</h3>
                    <div className="space-y-2">
                        {prefixes.map(prefix => (
                            <button
                                key={prefix.id}
                                onClick={() => handleSelectPrefix(prefix)}
                                className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedPrefix?.id === prefix.id
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-bold text-slate-800">{prefix.code}</div>
                                        <div className="text-sm text-slate-600">{prefix.description}</div>
                                        <div className="text-xs text-slate-500 mt-1">{prefix.lines.length} líneas</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {prefix.isActive ? (
                                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">Activo</span>
                                        ) : (
                                            <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">Inactivo</span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Prefix Editor */}
                <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-6">
                    {isCreating ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-slate-700">Nuevo Prefijo</h3>
                                <button
                                    onClick={() => setIsCreating(false)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Código *
                                    </label>
                                    <input
                                        type="text"
                                        value={formCode}
                                        onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                                        placeholder="ej. GMAT"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        maxLength={10}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Descripción *
                                    </label>
                                    <input
                                        type="text"
                                        value={formDescription}
                                        onChange={(e) => setFormDescription(e.target.value)}
                                        placeholder="ej. Gestión de Matriculaciones"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setIsCreating(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreatePrefix}
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    <Save className="w-4 h-4" />
                                    Crear Prefijo
                                </button>
                            </div>
                        </div>
                    ) : selectedPrefix ? (
                        <div className="space-y-6">
                            {/* Prefix Info */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-slate-700">Información del Prefijo</h3>
                                    <div className="flex gap-2">
                                        {isEditing ? (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setFormCode(selectedPrefix.code);
                                                        setFormDescription(selectedPrefix.description);
                                                        setIsEditing(false);
                                                    }}
                                                    className="px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={handleSavePrefix}
                                                    className="flex items-center gap-1 px-3 py-1 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
                                                >
                                                    <Save className="w-4 h-4" />
                                                    Guardar
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => setIsEditing(true)}
                                                    className="flex items-center gap-1 px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePrefix(selectedPrefix.id)}
                                                    className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Desactivar
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Código</label>
                                        <input
                                            type="text"
                                            value={formCode}
                                            onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                                            disabled={!isEditing}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                                        <input
                                            type="text"
                                            value={formDescription}
                                            onChange={(e) => setFormDescription(e.target.value)}
                                            disabled={!isEditing}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Lines Configuration */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-slate-700">Líneas Económicas</h3>
                                    <button
                                        onClick={handleAddLine}
                                        className="flex items-center gap-1 text-sm text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Añadir Línea
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {selectedPrefix.lines.map((line) => (
                                        <div
                                            key={line.id}
                                            className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                                        >
                                            <GripVertical className="w-4 h-4 text-slate-400" />

                                            <div className="flex-1 grid grid-cols-4 gap-3">
                                                <select
                                                    value={line.type}
                                                    onChange={(e) => handleUpdateLine(line.id, { type: e.target.value as LineType })}
                                                    className="px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                                >
                                                    <option value="suplido">Suplido</option>
                                                    <option value="honorario">Honorario</option>
                                                </select>

                                                <select
                                                    value={line.conceptId}
                                                    onChange={(e) => {
                                                        const concept = concepts.find(c => c.id === e.target.value);
                                                        handleUpdateLine(line.id, {
                                                            conceptId: e.target.value,
                                                            conceptName: concept?.name || ''
                                                        });
                                                    }}
                                                    className="col-span-2 px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                                >
                                                    {concepts.map(concept => (
                                                        <option key={concept.id} value={concept.id}>
                                                            {concept.name}
                                                        </option>
                                                    ))}
                                                </select>

                                                <input
                                                    type="number"
                                                    value={line.defaultAmount}
                                                    onChange={(e) => handleUpdateLine(line.id, { defaultAmount: parseFloat(e.target.value) || 0 })}
                                                    placeholder="Importe"
                                                    className="px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    step="0.01"
                                                />
                                            </div>

                                            <button
                                                onClick={() => handleRemoveLine(line.id)}
                                                className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}

                                    {selectedPrefix.lines.length === 0 && (
                                        <div className="text-center py-8 text-slate-500">
                                            No hay líneas configuradas. Haz clic en "Añadir Línea" para empezar.
                                        </div>
                                    )}
                                </div>

                                {selectedPrefix.lines.length > 0 && (
                                    <div className="flex justify-end mt-4">
                                        <button
                                            onClick={handleSaveLines}
                                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                                        >
                                            <Save className="w-4 h-4" />
                                            Guardar Líneas
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            Selecciona un prefijo de la lista o crea uno nuevo
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PrefixManagement;
