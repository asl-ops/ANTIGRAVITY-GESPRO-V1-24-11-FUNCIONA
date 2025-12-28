import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { MandatarioConfig } from '@/types/mandate';
import { Save, FileText, User, Building2, MapPin } from 'lucide-react';

const MandateConfiguration: React.FC = () => {
    const { appSettings, updateSettings } = useAppContext();

    const [mandatarioConfig, setMandatarioConfig] = useState<MandatarioConfig>({
        nombre_1: '',
        dni_1: '',
        col_1: '',
        nombre_2: '',
        dni_2: '',
        col_2: '',
        colegio: '',
        despacho: '',
        domicilio: {
            poblacion: '',
            calle: '',
            numero: '',
            cp: '',
        },
    });

    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (appSettings?.mandatarioConfig) {
            setMandatarioConfig(appSettings.mandatarioConfig);
        }
    }, [appSettings]);

    const handleChange = (field: string, value: string) => {
        if (field.startsWith('domicilio.')) {
            const domicilioField = field.split('.')[1];
            setMandatarioConfig(prev => ({
                ...prev,
                domicilio: {
                    ...prev.domicilio,
                    [domicilioField]: value,
                },
            }));
        } else {
            setMandatarioConfig(prev => ({
                ...prev,
                [field]: value,
            }));
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveMessage(null);

        try {
            await updateSettings({ mandatarioConfig });
            setSaveMessage({ type: 'success', text: 'Configuración guardada correctamente' });
            setTimeout(() => setSaveMessage(null), 3000);
        } catch (error) {
            console.error('Error saving mandate configuration:', error);
            setSaveMessage({ type: 'error', text: 'Error al guardar la configuración' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
                <FileText className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl font-semibold text-slate-700">Configuración de Mandatos</h2>
            </div>

            <p className="text-slate-600 mb-6">
                Configure los datos del mandatario (gestor administrativo) que aparecerán en todos los mandatos generados.
            </p>

            {/* Gestor Principal */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-sky-600" />
                    <h3 className="text-lg font-semibold text-slate-700">Gestor Principal</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Nombre Completo *
                        </label>
                        <input
                            type="text"
                            value={mandatarioConfig.nombre_1}
                            onChange={(e) => handleChange('nombre_1', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            placeholder="Ej: Juan Pérez García"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            DNI *
                        </label>
                        <input
                            type="text"
                            value={mandatarioConfig.dni_1}
                            onChange={(e) => handleChange('dni_1', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            placeholder="12345678A"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Nº Colegiado *
                        </label>
                        <input
                            type="text"
                            value={mandatarioConfig.col_1}
                            onChange={(e) => handleChange('col_1', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            placeholder="1234"
                        />
                    </div>
                </div>
            </div>

            {/* Gestor Secundario (Opcional) */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-slate-400" />
                    <h3 className="text-lg font-semibold text-slate-700">Gestor Secundario (Opcional)</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Nombre Completo
                        </label>
                        <input
                            type="text"
                            value={mandatarioConfig.nombre_2 || ''}
                            onChange={(e) => handleChange('nombre_2', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            placeholder="Ej: María López Martínez"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            DNI
                        </label>
                        <input
                            type="text"
                            value={mandatarioConfig.dni_2 || ''}
                            onChange={(e) => handleChange('dni_2', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            placeholder="87654321B"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Nº Colegiado
                        </label>
                        <input
                            type="text"
                            value={mandatarioConfig.col_2 || ''}
                            onChange={(e) => handleChange('col_2', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            placeholder="5678"
                        />
                    </div>
                </div>
            </div>

            {/* Datos del Colegio y Despacho */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-slate-700">Colegio y Despacho</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Colegio Oficial *
                        </label>
                        <input
                            type="text"
                            value={mandatarioConfig.colegio}
                            onChange={(e) => handleChange('colegio', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            placeholder="Ej: Madrid"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Nombre del Despacho *
                        </label>
                        <input
                            type="text"
                            value={mandatarioConfig.despacho}
                            onChange={(e) => handleChange('despacho', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            placeholder="Ej: Gestoría Pérez y Asociados"
                        />
                    </div>
                </div>
            </div>

            {/* Domicilio del Despacho */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-lg font-semibold text-slate-700">Domicilio del Despacho</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Población *
                        </label>
                        <input
                            type="text"
                            value={mandatarioConfig.domicilio.poblacion}
                            onChange={(e) => handleChange('domicilio.poblacion', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            placeholder="Ej: Madrid"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Calle *
                        </label>
                        <input
                            type="text"
                            value={mandatarioConfig.domicilio.calle}
                            onChange={(e) => handleChange('domicilio.calle', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            placeholder="Ej: Gran Vía"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Número *
                        </label>
                        <input
                            type="text"
                            value={mandatarioConfig.domicilio.numero}
                            onChange={(e) => handleChange('domicilio.numero', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            placeholder="Ej: 123"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Código Postal *
                        </label>
                        <input
                            type="text"
                            value={mandatarioConfig.domicilio.cp}
                            onChange={(e) => handleChange('domicilio.cp', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            placeholder="28001"
                        />
                    </div>
                </div>
            </div>

            {/* Save Button and Messages */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                <div className="flex-1">
                    {saveMessage && (
                        <div
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${saveMessage.type === 'success'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}
                        >
                            {saveMessage.text}
                        </div>
                    )}
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Guardando...' : 'Guardar Configuración'}
                </button>
            </div>
        </div>
    );
};

export default MandateConfiguration;
