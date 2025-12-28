import React, { useState, useEffect } from 'react';
import { MandateTemplate, PrefixConfig } from '@/types';
import {
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    replaceTemplateFile
} from '@/services/templateService';
import { getPrefixes } from '@/services/prefixService';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/useToast';
import { Upload, FileText, Trash2, Edit2, Check, X, Globe, Download, RefreshCw } from 'lucide-react';

const TemplateManager: React.FC = () => {
    const { currentUser } = useAppContext();
    const { addToast } = useToast();

    const [templates, setTemplates] = useState<MandateTemplate[]>([]);
    const [prefixes, setPrefixes] = useState<PrefixConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Form state
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [templateDescription, setTemplateDescription] = useState('');
    const [selectedPrefix, setSelectedPrefix] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');

    // Replace file state
    const [replacingFileId, setReplacingFileId] = useState<string | null>(null);
    const [replacementFile, setReplacementFile] = useState<File | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [templatesData, prefixesData] = await Promise.all([
                getTemplates(),
                getPrefixes()
            ]);
            setTemplates(templatesData);
            setPrefixes(prefixesData.filter(p => p.isActive));
        } catch (error) {
            console.error('Error loading data:', error);
            addToast('Error al cargar plantillas', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                addToast('Solo se permiten archivos DOCX', 'error');
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !templateName || !currentUser) {
            addToast('Complete todos los campos requeridos', 'error');
            return;
        }

        console.log('[TemplateManager] Starting upload process...', {
            fileName: selectedFile.name,
            templateName,
            currentUser: currentUser.id
        });

        setUploading(true);

        try {
            // Importar auth para verificar el estado de autenticación
            const { auth } = await import('@/services/firebase');

            console.log('[TemplateManager] Checking authentication status...');
            if (!auth.currentUser) {
                console.error('[TemplateManager] User not authenticated');
                throw new Error('No estás autenticado. Por favor, recarga la página.');
            }

            console.log('[TemplateManager] User authenticated:', auth.currentUser.uid);
            console.log('[TemplateManager] Creating template...');

            // Timeout de 60 segundos (aumentado de 30)
            const uploadPromise = createTemplate(
                templateName,
                selectedFile,
                currentUser.id,
                selectedPrefix || undefined,
                templateDescription || undefined
            );

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Tiempo de espera agotado (60s)')), 60000)
            );

            await Promise.race([uploadPromise, timeoutPromise]);

            console.log('[TemplateManager] Upload completed successfully');
            addToast('Plantilla creada exitosamente', 'success');

            // Reset form
            setTemplateName('');
            setTemplateDescription('');
            setSelectedPrefix('');
            setSelectedFile(null);
            setShowUploadForm(false);

            // Reload templates
            await loadData();
        } catch (error: any) {
            console.error('[TemplateManager] Error uploading template:', error);
            console.error('[TemplateManager] Error details:', {
                code: error.code,
                message: error.message,
                stack: error.stack
            });

            // Mensajes de error más específicos
            if (error.message?.includes('Tiempo de espera agotado')) {
                addToast('⏱️ La subida está tardando demasiado. Verifica tu conexión a Internet.', 'error');
            } else if (error.message?.includes('No estás autenticado')) {
                addToast('🔒 ' + error.message, 'error');
            } else if (error.code === 'storage/unauthorized') {
                addToast('🚫 No tienes permisos para subir archivos. Verifica las reglas de Firebase Storage.', 'error');
            } else if (error.code === 'storage/canceled') {
                addToast('Subida cancelada', 'info');
            } else if (error.code === 'storage/unknown') {
                addToast('❌ Error de Firebase Storage. Verifica la configuración del proyecto.', 'error');
            } else if (error.message?.includes('network') || error.message?.includes('Network')) {
                addToast('📡 Error de red. Verifica tu conexión a Internet.', 'error');
            } else if (error.message?.includes('Firebase Storage no está inicializado')) {
                addToast('⚙️ Firebase Storage no está configurado correctamente.', 'error');
            } else {
                addToast(`Error al subir plantilla: ${error.message || 'Error desconocido'}`, 'error');
            }
        } finally {
            setUploading(false);
        }
    };

    const handleEdit = (template: MandateTemplate) => {
        setEditingId(template.id);
        setEditName(template.name);
        setEditDescription(template.description || '');
    };

    const handleSaveEdit = async (templateId: string) => {
        try {
            await updateTemplate(templateId, {
                name: editName,
                description: editDescription
            });

            addToast('Plantilla actualizada', 'success');
            setEditingId(null);
            await loadData();
        } catch (error) {
            console.error('Error updating template:', error);
            addToast('Error al actualizar plantilla', 'error');
        }
    };

    const handleDelete = async (templateId: string) => {
        if (!confirm('¿Estás seguro de que deseas desactivar esta plantilla?')) {
            return;
        }

        try {
            await deleteTemplate(templateId);
            addToast('Plantilla desactivada', 'success');
            await loadData();
        } catch (error) {
            console.error('Error deleting template:', error);
            addToast('Error al desactivar plantilla', 'error');
        }
    };

    const handleDownload = async (template: MandateTemplate) => {
        try {
            console.log('[TemplateManager] Downloading template:', template.fileName);

            // Crear un link temporal para descargar el archivo
            const link = document.createElement('a');
            link.href = template.fileUrl;
            link.download = template.fileName;
            link.target = '_blank';

            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            addToast(`Descargando ${template.fileName}...`, 'info');
        } catch (error) {
            console.error('Error downloading template:', error);
            addToast('Error al descargar la plantilla', 'error');
        }
    };

    const handleReplaceFile = (templateId: string) => {
        setReplacingFileId(templateId);
        setReplacementFile(null);
    };

    const handleReplacementFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                addToast('Solo se permiten archivos DOCX', 'error');
                return;
            }
            setReplacementFile(file);
        }
    };

    const handleConfirmReplacement = async () => {
        if (!replacingFileId || !replacementFile) {
            addToast('Selecciona un archivo para reemplazar', 'error');
            return;
        }

        setUploading(true);
        try {
            console.log(`[TemplateManager] Replacing file for template: ${replacingFileId}`);
            await replaceTemplateFile(replacingFileId, replacementFile);

            addToast('Archivo de plantilla actualizado exitosamente', 'success');
            setReplacingFileId(null);
            setReplacementFile(null);
            await loadData();
        } catch (error: any) {
            console.error('[TemplateManager] Error replacing file:', error);
            addToast(`Error al actualizar archivo: ${error.message || 'Error desconocido'}`, 'error');
        } finally {
            setUploading(false);
        }
    };

    const getPrefixName = (prefixId?: string) => {
        if (!prefixId) return 'Global';
        const prefix = prefixes.find(p => p.id === prefixId);
        return prefix ? prefix.code : prefixId;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Plantillas de Mandatos</h2>
                    <p className="text-slate-600 mt-1">Gestiona plantillas DOCX para generación de mandatos</p>
                </div>
                <button
                    onClick={() => setShowUploadForm(!showUploadForm)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                    <Upload className="w-4 h-4" />
                    Nueva Plantilla
                </button>
            </div>

            {/* Upload Form */}
            {showUploadForm && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Subir Nueva Plantilla</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Nombre de la Plantilla *
                            </label>
                            <input
                                type="text"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Ej: Mandato Estándar GMAT"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Descripción
                            </label>
                            <textarea
                                value={templateDescription}
                                onChange={(e) => setTemplateDescription(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                rows={2}
                                placeholder="Descripción opcional"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Prefijo (opcional)
                            </label>
                            <select
                                value={selectedPrefix}
                                onChange={(e) => setSelectedPrefix(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="">Global (todos los prefijos)</option>
                                {prefixes.map(prefix => (
                                    <option key={prefix.id} value={prefix.id}>
                                        {prefix.code} - {prefix.description}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Archivo DOCX *
                            </label>
                            <input
                                type="file"
                                accept=".docx"
                                onChange={handleFileSelect}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                            {selectedFile && (
                                <p className="text-sm text-slate-600 mt-2">
                                    Archivo seleccionado: {selectedFile.name}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleUpload}
                                disabled={uploading || !selectedFile || !templateName}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {uploading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Subiendo...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        Subir Plantilla
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setShowUploadForm(false)}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Templates List */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">Nombre</th>
                            <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">Prefijo</th>
                            <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">Archivo</th>
                            <th className="text-left px-6 py-3 text-sm font-semibold text-slate-700">Estado</th>
                            <th className="text-right px-6 py-3 text-sm font-semibold text-slate-700">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {templates.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                    No hay plantillas creadas. Crea una nueva plantilla para comenzar.
                                </td>
                            </tr>
                        ) : (
                            templates.map(template => (
                                <React.Fragment key={template.id}>
                                    <tr className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            {editingId === template.id ? (
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="border border-slate-300 rounded px-2 py-1 text-sm w-full"
                                                />
                                            ) : (
                                                <div>
                                                    <p className="font-medium text-slate-900">{template.name}</p>
                                                    {template.description && (
                                                        <p className="text-sm text-slate-600">{template.description}</p>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${template.prefixId ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                {!template.prefixId && <Globe className="w-3 h-3" />}
                                                {getPrefixName(template.prefixId)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <FileText className="w-4 h-4" />
                                                {template.fileName}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${template.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {template.isActive ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {editingId === template.id ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleSaveEdit(template.id)}
                                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                            title="Guardar"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingId(null)}
                                                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                            title="Cancelar"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleDownload(template)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Descargar DOCX"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReplaceFile(template.id)}
                                                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                            title="Reemplazar archivo DOCX"
                                                        >
                                                            <RefreshCw className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(template)}
                                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                            title="Editar información"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(template.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Desactivar"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {/* Replace File Form - Inline */}
                                    {replacingFileId === template.id && (
                                        <tr className="bg-orange-50">
                                            <td colSpan={5} className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                                            Seleccionar nuevo archivo DOCX
                                                        </label>
                                                        <input
                                                            type="file"
                                                            accept=".docx"
                                                            onChange={handleReplacementFileSelect}
                                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                                                        />
                                                        {replacementFile && (
                                                            <p className="text-sm text-slate-600 mt-1">
                                                                ✓ Archivo seleccionado: {replacementFile.name}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={handleConfirmReplacement}
                                                            disabled={!replacementFile || uploading}
                                                            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
                                                        >
                                                            {uploading ? (
                                                                <>
                                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                                    Subiendo...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <RefreshCw className="w-4 h-4" />
                                                                    Reemplazar
                                                                </>
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setReplacingFileId(null);
                                                                setReplacementFile(null);
                                                            }}
                                                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Variables Disponibles</h4>
                <p className="text-sm text-blue-800 mb-2">
                    Usa estas variables en tus plantillas DOCX (formato: {`{{VARIABLE}}`}):
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-blue-700">
                    <code className="bg-white px-2 py-1 rounded">CLIENT_FULL_NAME</code>
                    <code className="bg-white px-2 py-1 rounded">CLIENT_NIF</code>
                    <code className="bg-white px-2 py-1 rounded">CLIENT_ADDRESS</code>
                    <code className="bg-white px-2 py-1 rounded">GESTOR_NAME</code>
                    <code className="bg-white px-2 py-1 rounded">GESTOR_DNI</code>
                    <code className="bg-white px-2 py-1 rounded">VEHICLE_VIN</code>
                    <code className="bg-white px-2 py-1 rounded">ASUNTO</code>
                    <code className="bg-white px-2 py-1 rounded">CURRENT_DATE</code>
                </div>
            </div>
        </div>
    );
};

export default TemplateManager;
