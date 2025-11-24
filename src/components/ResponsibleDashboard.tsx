import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { AgencyData, EconomicTemplates, TemplateEconomicLineItem } from '@/types';
import { Save, Plus, Trash2, Building, Euro, ArrowLeft } from 'lucide-react';
import PrefixManagement from './PrefixManagement';
import ConceptCatalogManager from './ConceptCatalogManager';
import TemplateManager from './TemplateManager';
import BajarExpedientes from './BajarExpedientes';
import AnalyticsDashboard from './AnalyticsDashboard';

const ResponsibleDashboard: React.FC = () => {
    const { appSettings, economicTemplates, updateSettings, updateEconomicTemplates, caseHistory } = useAppContext();

    const [agency, setAgency] = useState<AgencyData>({
        name: '', cif: '', address: '', managerName: '', managerColegiado: '', managerDni: ''
    });

    const [templates, setTemplates] = useState<EconomicTemplates>({});
    const [activeTab, setActiveTab] = useState<'agency' | 'prefixes' | 'concepts' | 'economics' | 'mandate' | 'templates' | 'bajar' | 'analytics'>('agency');
    const [selectedTemplateType, setSelectedTemplateType] = useState<string>('GE-MAT');

    useEffect(() => {
        if (appSettings?.agency) {
            setAgency(appSettings.agency);
        }
    }, [appSettings]);

    useEffect(() => {
        if (economicTemplates) {
            setTemplates(economicTemplates);
        }
    }, [economicTemplates]);

    const handleAgencyChange = (field: keyof AgencyData, value: string) => {
        setAgency(prev => ({ ...prev, [field]: value }));
    };

    const saveAgency = async () => {
        await updateSettings({ agency });
    };

    const handleTemplateChange = (type: string, index: number, field: keyof TemplateEconomicLineItem, value: any) => {
        setTemplates(prev => {
            const newTemplates = { ...prev };
            const lines = [...(newTemplates[type] || [])];
            lines[index] = { ...lines[index], [field]: value };
            newTemplates[type] = lines;
            return newTemplates;
        });
    };

    const addTemplateLine = (type: string) => {
        setTemplates(prev => {
            const newTemplates = { ...prev };
            const lines = [...(newTemplates[type] || [])];
            lines.push({ concept: 'Nuevo Concepto', amount: 0, included: true });
            newTemplates[type] = lines;
            return newTemplates;
        });
    };

    const removeTemplateLine = (type: string, index: number) => {
        setTemplates(prev => {
            const newTemplates = { ...prev };
            const lines = [...(newTemplates[type] || [])];
            lines.splice(index, 1);
            newTemplates[type] = lines;
            return newTemplates;
        });
    };

    const saveTemplates = async () => {
        await updateEconomicTemplates(templates);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <Building className="w-8 h-8 text-indigo-600" />
                    Panel del Responsable
                </h1>
                <button
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver
                </button>
            </div>

            <div className="flex gap-4 mb-6 border-b border-slate-200 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('agency')}
                    className={}
                >
                    Datos del Despacho
                </button>
                <button
                    onClick={() => setActiveTab('prefixes')}
                    className={}
                >
                    Gestión de Prefijos
                </button>
                <button
                    onClick={() => setActiveTab('concepts')}
                    className={}
                >
                    Catálogo de Conceptos
                </button>
                <button
                    onClick={() => setActiveTab('economics')}
                    className={}
                >
                    Gestión de Expedientes
                </button>
                <button
                    onClick={() => setActiveTab('mandate')}
                    className={}
                >
                    Configuración de Mandatos
                </button>
                <button
                    onClick={() => setActiveTab('templates')}
                    className={}
                >
                    Plantillas de Mandatos
                </button>
                <button
                    onClick={() => setActiveTab('bajar')}
                    className={}
                >
                    Baja de Expedientes
                </button>
                <button
                    onClick={() => setActiveTab('analytics')}
                    className={}
                >
                    Analítica
                </button>
            </div>

            {activeTab === 'agency' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-fade-in">
                    <h2 className="text-xl font-semibold mb-4 text-slate-700">Configuración del Despacho</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Despacho</label>
                            <input
                                type="text"
                                value={agency.name}
                                onChange={(e) => handleAgencyChange('name', e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">CIF/NIF</label>
                            <input
                                type="text"
                                value={agency.cif}
                                onChange={(e) => handleAgencyChange('cif', e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Dirección Completa</label>
                            <input
                                type="text"
                                value={agency.address}
                                onChange={(e) => handleAgencyChange('address', e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Gestor</label>
                            <input
                                type="text"
                                value={agency.managerName}
                                onChange={(e) => handleAgencyChange('managerName', e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nº Colegiado</label>
                            <input
                                type="text"
                                value={agency.managerColegiado}
                                onChange={(e) => handleAgencyChange('managerColegiado', e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">DNI del Gestor</label>
                            <input
                                type="text"
                                value={agency.managerDni}
                                onChange={(e) => handleAgencyChange('managerDni', e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={saveAgency}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            <Save className="w-4 h-4" />
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'prefixes' && <PrefixManagement />}
            {activeTab === 'concepts' && <ConceptCatalogManager />}
            {activeTab === 'templates' && <TemplateManager />}
            {activeTab === 'bajar' && <BajarExpedientes />}
            {activeTab === 'analytics' && <AnalyticsDashboard cases={caseHistory} />}

            {activeTab === 'economics' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-fade-in">
                    <h2 className="text-xl font-semibold mb-4 text-slate-700">Gestión de Expedientes</h2>
                    
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Seleccionar Tipo de Expediente</label>
                        <select
                            value={selectedTemplateType}
                            onChange={(e) => setSelectedTemplateType(e.target.value)}
                            className="w-full md:w-1/3 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            {Object.keys(templates).map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-4">
                        {(templates[selectedTemplateType] || []).map((line, index) => (
                            <div key={index} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Concepto</label>
                                    <input
                                        type="text"
                                        value={line.concept}
                                        onChange={(e) => handleTemplateChange(selectedTemplateType, index, 'concept', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                                    />
                                </div>
                                <div className="w-32">
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Importe</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={line.amount}
                                            onChange={(e) => handleTemplateChange(selectedTemplateType, index, 'amount', parseFloat(e.target.value))}
                                            className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md text-sm"
                                        />
                                        <Euro className="w-4 h-4 text-slate-400 absolute left-2 top-2.5" />
                                    </div>
                                </div>
                                <div className="pt-5">
                                    <button
                                        onClick={() => removeTemplateLine(selectedTemplateType, index)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Eliminar línea"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex justify-between">
                        <button
                            onClick={() => addTemplateLine(selectedTemplateType)}
                            className="flex items-center gap-2 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Añadir Línea
                        </button>
                        <button
                            onClick={saveTemplates}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            <Save className="w-4 h-4" />
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'mandate' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-fade-in">
                    <h2 className="text-xl font-semibold mb-4 text-slate-700">Configuración de Mandatos</h2>
                    <p className="text-slate-600 mb-4">
                        Aquí podrás configurar las plantillas y opciones para la generación de mandatos.
                        (Funcionalidad en desarrollo)
                    </p>
                </div>
            )}
        </div>
    );
};

export default ResponsibleDashboard;
