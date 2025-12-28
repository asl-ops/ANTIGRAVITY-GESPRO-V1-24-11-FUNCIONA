import React, { useState } from 'react';
import {
    FileText, BarChart2, PieChart, Calendar, User, AlertTriangle,
    Download, Printer, Filter, X, ChevronRight, FileSpreadsheet
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useToast } from '../hooks/useToast';
import {
    generateGeneralReport,
    generateByStatusReport,
    generateByClientReport,
    generateStalledReport,
    generatePerformanceReport,
    exportToExcel,
    exportToPDF,
    ReportFilters
} from '../services/reportService';

interface ReportsModuleProps {
    onClose: () => void;
}

type ReportCategory = 'basic' | 'advanced' | 'internal' | 'economic' | 'analytics';

interface ReportDefinition {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    category: ReportCategory;
}

const ReportsModule: React.FC<ReportsModuleProps> = ({ onClose }) => {
    const { caseHistory, users } = useAppContext();
    const { addToast } = useToast();
    const [activeCategory, setActiveCategory] = useState<ReportCategory>('basic');
    const [selectedReport, setSelectedReport] = useState<string | null>(null);

    // Global Filter State
    const [dateRange, setDateRange] = useState<{ start: string, end: string }>({ start: '', end: '' });
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [responsibleFilter, setResponsibleFilter] = useState<string>('all');

    const reports: ReportDefinition[] = [
        // Basic
        { id: 'general', title: 'Listado General', description: 'Todos los expedientes con detalles básicos', icon: <FileText className="w-5 h-5" />, category: 'basic' },
        { id: 'by_status', title: 'Por Estado', description: 'Agrupados por estado (Abierto, Cerrado, etc.)', icon: <PieChart className="w-5 h-5" />, category: 'basic' },
        { id: 'by_client', title: 'Por Cliente', description: 'Expedientes organizados por cliente', icon: <User className="w-5 h-5" />, category: 'basic' },

        // Advanced
        { id: 'by_date', title: 'Por Fechas', description: 'Aperturas y cierres por rango de fechas', icon: <Calendar className="w-5 h-5" />, category: 'advanced' },
        { id: 'by_responsible', title: 'Por Responsable', description: 'Expedientes asignados a cada tramitador', icon: <User className="w-5 h-5" />, category: 'advanced' },
        { id: 'by_situation', title: 'Por Situación', description: 'Análisis detallado por situación del trámite', icon: <FileText className="w-5 h-5" />, category: 'advanced' },

        // Internal Control
        { id: 'stalled', title: 'Expedientes Estancados', description: 'Sin movimiento en los últimos 30 días', icon: <AlertTriangle className="w-5 h-5 text-orange-500" />, category: 'internal' },
        { id: 'errors', title: 'Control de Errores', description: 'Fechas inválidas o datos faltantes', icon: <AlertTriangle className="w-5 h-5 text-red-500" />, category: 'internal' },

        // Analytics
        { id: 'performance', title: 'Rendimiento', description: 'Expedientes gestionados por usuario', icon: <BarChart2 className="w-5 h-5" />, category: 'analytics' },
        { id: 'evolution', title: 'Evolución Mensual', description: 'Comparativa de aperturas vs cierres', icon: <BarChart2 className="w-5 h-5" />, category: 'analytics' },
    ];

    const filteredReports = reports.filter(r => r.category === activeCategory);

    const getFilters = (): ReportFilters => ({
        dateRange: dateRange.start && dateRange.end ? dateRange : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        responsible: responsibleFilter !== 'all' ? responsibleFilter : undefined,
    });

    const handleGenerateReport = () => {
        if (!selectedReport) return;

        const filters = getFilters();
        let reportData;

        try {
            switch (selectedReport) {
                case 'general':
                    reportData = generateGeneralReport(caseHistory, filters);
                    break;
                case 'by_status':
                    reportData = generateByStatusReport(caseHistory, filters);
                    break;
                case 'by_client':
                    reportData = generateByClientReport(caseHistory, filters);
                    break;
                case 'stalled':
                    reportData = generateStalledReport(caseHistory, filters);
                    break;
                case 'performance':
                    reportData = generatePerformanceReport(caseHistory, filters, users);
                    break;
                default:
                    addToast('Este informe aún no está implementado', 'info');
                    return;
            }

            console.log('Report Data:', reportData);
            addToast(`Informe "${reportData.title}" generado correctamente`, 'success');
        } catch (error) {
            console.error('Error generating report:', error);
            addToast('Error al generar el informe', 'error');
        }
    };

    const handleExportExcel = () => {
        if (!selectedReport) return;

        const filters = getFilters();
        let reportData;

        try {
            switch (selectedReport) {
                case 'general':
                    reportData = generateGeneralReport(caseHistory, filters);
                    break;
                case 'by_status':
                    reportData = generateByStatusReport(caseHistory, filters);
                    break;
                case 'by_client':
                    reportData = generateByClientReport(caseHistory, filters);
                    break;
                case 'stalled':
                    reportData = generateStalledReport(caseHistory, filters);
                    break;
                case 'performance':
                    reportData = generatePerformanceReport(caseHistory, filters, users);
                    break;
                default:
                    addToast('Este informe aún no está implementado', 'info');
                    return;
            }

            const filename = `${reportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
            exportToExcel(reportData, filename);
            addToast('Informe exportado a Excel correctamente', 'success');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            addToast('Error al exportar a Excel', 'error');
        }
    };

    const handleExportPDF = () => {
        if (!selectedReport) return;

        const filters = getFilters();
        let reportData;

        try {
            switch (selectedReport) {
                case 'general':
                    reportData = generateGeneralReport(caseHistory, filters);
                    break;
                case 'by_status':
                    reportData = generateByStatusReport(caseHistory, filters);
                    break;
                case 'by_client':
                    reportData = generateByClientReport(caseHistory, filters);
                    break;
                case 'stalled':
                    reportData = generateStalledReport(caseHistory, filters);
                    break;
                case 'performance':
                    reportData = generatePerformanceReport(caseHistory, filters, users);
                    break;
                default:
                    addToast('Este informe aún no está implementado', 'info');
                    return;
            }

            exportToPDF(reportData);
            addToast('Abriendo vista de impresión...', 'info');
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            addToast('Error al exportar a PDF', 'error');
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex overflow-hidden">

                {/* Sidebar */}
                <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col">
                    <div className="p-6 border-b border-slate-200">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                            Informes
                        </h2>
                    </div>
                    <nav className="flex-1 p-4 space-y-1">
                        {[
                            { id: 'basic', label: 'Básicos', icon: FileText },
                            { id: 'advanced', label: 'Avanzados', icon: Filter },
                            { id: 'internal', label: 'Control Interno', icon: AlertTriangle },
                            { id: 'economic', label: 'Económicos', icon: PieChart },
                            { id: 'analytics', label: 'Analítica', icon: BarChart2 },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveCategory(item.id as ReportCategory)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeCategory === item.id
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                                {activeCategory === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                            </button>
                        ))}
                    </nav>
                    <div className="p-4 border-t border-slate-200">
                        <p className="text-xs text-slate-400 text-center">
                            Gestor de Expedientes Pro v1.0
                        </p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col bg-white">

                    {/* Header & Global Filters */}
                    <div className="p-6 border-b border-slate-200 bg-white">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">
                                    {activeCategory === 'basic' && 'Listados Básicos'}
                                    {activeCategory === 'advanced' && 'Informes Avanzados'}
                                    {activeCategory === 'internal' && 'Control Interno'}
                                    {activeCategory === 'economic' && 'Informes Económicos'}
                                    {activeCategory === 'analytics' && 'Analítica y Rendimiento'}
                                </h1>
                                <p className="text-slate-500 text-sm mt-1">Selecciona un informe y aplica los filtros necesarios</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X className="w-6 h-6 text-slate-500" />
                            </button>
                        </div>

                        {/* Global Filter Engine */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-end">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Rango de Fechas</label>
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                    />
                                    <span className="self-center text-slate-400">-</span>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="w-48">
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Estado</label>
                                <select
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">Todos los estados</option>
                                    <option value="Iniciado">Iniciado</option>
                                    <option value="En Tramitación">En Tramitación</option>
                                    <option value="Cerrado">Cerrado</option>
                                </select>
                            </div>

                            <div className="w-48">
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Responsable</label>
                                <select
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={responsibleFilter}
                                    onChange={(e) => setResponsibleFilter(e.target.value)}
                                >
                                    <option value="all">Todos los responsables</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Report Cards Grid */}
                    <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredReports.map((report) => (
                                <div
                                    key={report.id}
                                    onClick={() => setSelectedReport(report.id)}
                                    className={`p-5 rounded-xl border cursor-pointer transition-all duration-200 group ${selectedReport === report.id
                                            ? 'bg-blue-50 border-blue-500 shadow-md ring-1 ring-blue-500'
                                            : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                                        }`}
                                >
                                    <div className={`p-3 rounded-lg inline-block mb-3 ${selectedReport === report.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600'
                                        }`}>
                                        {report.icon}
                                    </div>
                                    <h3 className={`font-bold mb-1 ${selectedReport === report.id ? 'text-blue-800' : 'text-slate-800'}`}>
                                        {report.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        {report.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-slate-200 bg-white flex justify-between items-center">
                        <div className="text-sm text-slate-500">
                            {selectedReport
                                ? <span>Informe seleccionado: <strong className="text-slate-800">{reports.find(r => r.id === selectedReport)?.title}</strong></span>
                                : 'Selecciona un informe para continuar'
                            }
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleExportExcel}
                                disabled={!selectedReport}
                                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                Excel
                            </button>
                            <button
                                onClick={handleExportPDF}
                                disabled={!selectedReport}
                                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                PDF
                            </button>
                            <button
                                onClick={handleGenerateReport}
                                disabled={!selectedReport}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2"
                            >
                                <Printer className="w-4 h-4" />
                                Generar Informe
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ReportsModule;
