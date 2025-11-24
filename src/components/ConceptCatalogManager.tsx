import React, { useState, useEffect } from 'react';
import { ConceptCatalog, LineType } from '@/types';
import { getConcepts, saveConcept, createConcept, deleteConcept } from '@/services/conceptService';
import { useToast } from '@/hooks/useToast';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

const ConceptCatalogManager: React.FC = () => {
    const { addToast } = useToast();
    const [concepts, setConcepts] = useState<ConceptCatalog[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form state
    const [formName, setFormName] = useState('');
    const [formCategory, setFormCategory] = useState<LineType>('honorario');

    useEffect(() => {
        loadConcepts();
    }, []);

    const loadConcepts = async () => {
        setLoading(true);
        try {
            const data = await getConcepts();
            setConcepts(data);
        } catch (error) {
            addToast('Error al cargar conceptos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!formName.trim()) {
            addToast('El nombre del concepto es obligatorio', 'error');
            return;
        }

        try {
            await createConcept(formName.trim(), formCategory);
            addToast('Concepto creado correctamente', 'success');
            setFormName('');
            setFormCategory('honorario');
            setIsCreating(false);
            await loadConcepts();
        } catch (error) {
            addToast('Error al crear concepto', 'error');
        }
    };

    const handleEdit = (concept: ConceptCatalog) => {
        setEditingId(concept.id);
        setFormName(concept.name);
        setFormCategory(concept.category);
    };

    const handleSave = async (conceptId: string) => {
        if (!formName.trim()) {
            addToast('El nombre del concepto es obligatorio', 'error');
            return;
        }

        try {
            const concept = concepts.find(c => c.id === conceptId);
            if (!concept) return;

            await saveConcept({
                ...concept,
                name: formName.trim(),
                category: formCategory
            });
            addToast('Concepto actualizado correctamente', 'success');
            setEditingId(null);
            await loadConcepts();
        } catch (error) {
            addToast('Error al guardar concepto', 'error');
        }
    };

    const handleDelete = async (conceptId: string) => {
        if (!confirm('¿Está seguro de desactivar este concepto?')) return;

        try {
            await deleteConcept(conceptId);
            addToast('Concepto desactivado', 'success');
            await loadConcepts();
        } catch (error) {
            addToast('Error al desactivar concepto', 'error');
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormName('');
        setFormCategory('honorario');
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
                <h2 className="text-2xl font-bold text-slate-800">Catálogo de Conceptos</h2>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Concepto
                </button>
            </div>

            {/* Create Form */}
            {isCreating && (
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-700">Nuevo Concepto</h3>
                        <button
                            onClick={() => {
                                setIsCreating(false);
                                setFormName('');
                                setFormCategory('honorario');
                            }}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Nombre del Concepto *
                            </label>
                            <input
                                type="text"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                placeholder="ej. Tasas DGT"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Tipo *
                            </label>
                            <select
                                value={formCategory}
                                onChange={(e) => setFormCategory(e.target.value as LineType)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="suplido">Suplido</option>
                                <option value="honorario">Honorario</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => {
                                setIsCreating(false);
                                setFormName('');
                                setFormCategory('honorario');
                            }}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleCreate}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            Crear Concepto
                        </button>
                    </div>
                </div>
            )}

            {/* Concepts Table */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Nombre
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Tipo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {concepts.map(concept => (
                            <tr key={concept.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    {editingId === concept.id ? (
                                        <input
                                            type="text"
                                            value={formName}
                                            onChange={(e) => setFormName(e.target.value)}
                                            className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    ) : (
                                        <span className="text-sm font-medium text-slate-900">{concept.name}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {editingId === concept.id ? (
                                        <select
                                            value={formCategory}
                                            onChange={(e) => setFormCategory(e.target.value as LineType)}
                                            className="px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value="suplido">Suplido</option>
                                            <option value="honorario">Honorario</option>
                                        </select>
                                    ) : (
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${concept.category === 'suplido'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-purple-100 text-purple-800'
                                            }`}>
                                            {concept.category === 'suplido' ? 'Suplido' : 'Honorario'}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${concept.isActive
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-slate-200 text-slate-600'
                                        }`}>
                                        {concept.isActive ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {editingId === concept.id ? (
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={handleCancelEdit}
                                                className="text-slate-600 hover:text-slate-800 p-1"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleSave(concept.id)}
                                                className="text-indigo-600 hover:text-indigo-800 p-1"
                                            >
                                                <Save className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(concept)}
                                                className="text-indigo-600 hover:text-indigo-800 p-1"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(concept.id)}
                                                className="text-red-600 hover:text-red-800 p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {concepts.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        No hay conceptos registrados. Haz clic en "Nuevo Concepto" para empezar.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConceptCatalogManager;
