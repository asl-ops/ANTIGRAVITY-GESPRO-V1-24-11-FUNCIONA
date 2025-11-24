
import React, { useState, useMemo } from 'react';
import {
    SearchIcon,
    GridViewIcon,
    ListViewIcon,
    XMarkIcon,
} from './icons';
import ExpedienteCard from './ExpedienteCard';
import ExpedienteListItem from './ExpedienteListItem';
import ConfirmationModal from './ConfirmationModal';
import { useAppContext } from '../contexts/AppContext';
import { FileCategory } from '../types';

interface DashboardProps {
    onSelectCase: (c: any) => void;
    onCreateNewCase: (category: FileCategory) => void;
    onShowRemoteAccess: () => void;
    onShowTasksDashboard: () => void;
    onShowResponsibleDashboard: () => void;
}

// ... existing code ...

const Dashboard: React.FC<DashboardProps> = ({
    onSelectCase,
    onCreateNewCase,
    onShowRemoteAccess,
    onShowTasksDashboard,
    onShowResponsibleDashboard,
}) => {
    const { caseHistory, appSettings, deleteCase } = useAppContext();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [identifierFilter, setIdentifierFilter] = useState(''); // NEW: Direct identifier search
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [categoryFilter, setCategoryFilter] = useState('Todos');
    const [dateFilterType, setDateFilterType] = useState<'createdAt' | 'updatedAt'>('createdAt');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [caseToDelete, setCaseToDelete] = useState<string | null>(null);

    const FILE_CATEGORIES = [
        { id: 'GE-MAT', label: 'Matriculación' },
        { id: 'FI-TRI', label: 'Fiscal Trimestral' },
        { id: 'FI-CONTA', label: 'Contabilidad' },
    ];

    const processedCases = useMemo(() => {
        if (!caseHistory) return [];
        return caseHistory.filter(c => {
            if (c.status === 'Eliminado') return false; // Don't show deleted cases in main dashboard

            // Identifier filter (exact or partial match)
            const matchesIdentifier = !identifierFilter ||
                c.fileNumber.toLowerCase().includes(identifierFilter.toLowerCase());

            // General search (client, VIN)
            const matchesSearch =
                c.fileNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.client.surnames.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.client.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.vehicle?.vin || '').toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = statusFilter === 'Todos' || c.status === statusFilter;
            const matchesCategory = categoryFilter === 'Todos' || c.fileConfig.category === categoryFilter;

            let matchesDate = true;
            if (startDate && endDate) {
                const dateToCheck = new Date(c[dateFilterType]);
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                matchesDate = dateToCheck >= start && dateToCheck <= end;
            }

            return matchesIdentifier && matchesSearch && matchesStatus && matchesCategory && matchesDate;
        });
    }, [caseHistory, searchQuery, identifierFilter, statusFilter, categoryFilter, startDate, endDate, dateFilterType]);

    const confirmDelete = async () => {
        if (caseToDelete) {
            await deleteCase(caseToDelete);
            setCaseToDelete(null);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold">Explorador de Expedientes</h1>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => onCreateNewCase('GE-MAT')}
                            className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors"
                        >
                            + Nuevo Expediente
                        </button>
                        <button
                            onClick={onShowTasksDashboard}
                            className="bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                        >
                            Tareas
                        </button>
                        <button
                            onClick={onShowRemoteAccess}
                            className="bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                        >
                            Acceso Remoto
                        </button>
                        <button
                            onClick={onShowResponsibleDashboard}
                            className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-200 transition-colors font-medium"
                        >
                            Panel Responsable
                        </button>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded ${viewMode === 'grid' ? 'bg-sky-200' : 'bg-slate-200'
                            }`}
                    >
                        <GridViewIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded ${viewMode === 'list' ? 'bg-sky-200' : 'bg-slate-200'
                            }`}
                    >
                        <ListViewIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="bg-slate-100 p-4 rounded-lg border border-slate-300 space-y-4">
                <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                    <div className="flex items-center bg-white border border-slate-300 rounded px-2">
                        <SearchIcon className="w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar cliente, VIN…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="ml-2 py-1 outline-none text-sm w-48"
                        />
                    </div>

                    <div className="flex items-center bg-white border border-slate-300 rounded px-2">
                        <input
                            type="text"
                            placeholder="Identificador (ej. EXP-0001)"
                            value={identifierFilter}
                            onChange={(e) => setIdentifierFilter(e.target.value)}
                            className="py-1 outline-none text-sm w-48"
                        />
                        {identifierFilter && (
                            <button
                                onClick={() => setIdentifierFilter('')}
                                className="ml-1 text-slate-400 hover:text-slate-600"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-slate-300 px-2 py-1 rounded text-sm bg-white"
                    >
                        <option value="Todos">Estado: Todos</option>
                        {appSettings?.caseStatuses?.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>

                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="border border-slate-300 px-2 py-1 rounded text-sm bg-white"
                    >
                        <option value="Todos">Prefijo: Todos</option>
                        {FILE_CATEGORIES.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center space-x-3 bg-white p-3 rounded border border-slate-300">
                    <select
                        value={dateFilterType}
                        onChange={(e) =>
                            setDateFilterType(e.target.value as any)
                        }
                        className="border px-2 py-1 rounded text-sm"
                    >
                        <option value="createdAt">Fecha Alta</option>
                        <option value="updatedAt">Fecha Firma</option>
                    </select>

                    <div className="flex items-center space-x-1">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="border border-slate-300 rounded px-2 py-1 text-sm"
                        />
                    </div>

                    <div className="flex items-center space-x-1">
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="border border-slate-300 rounded px-2 py-1 text-sm"
                        />
                    </div>

                    {(startDate || endDate) && (
                        <button
                            onClick={() => {
                                setStartDate('');
                                setEndDate('');
                            }}
                            className="p-1 hover:bg-slate-200 rounded"
                        >
                            <XMarkIcon className="w-4 h-4 text-slate-600" />
                        </button>
                    )}
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {processedCases.map((c) => (
                        <ExpedienteCard
                            key={c.fileNumber}
                            caseRecord={c}
                            onSelectCase={onSelectCase}
                            onDelete={() => setCaseToDelete(c.fileNumber)}
                        />
                    ))}
                </div>
            ) : (
                <div className="divide-y border rounded-lg bg-white">
                    <div className="grid grid-cols-12 p-3 font-bold text-sm bg-slate-200">
                        <div className="col-span-2">ID</div>
                        <div className="col-span-2">Tipo</div>
                        <div className="col-span-2">Modalidad</div>
                        <div className="col-span-2">Situación</div>
                        <div className="col-span-2">Fecha Alta</div>
                        <div className="col-span-2 text-center">Acciones</div>
                    </div>
                    {processedCases.map((c) => (
                        <ExpedienteListItem
                            key={c.fileNumber}
                            caseRecord={c}
                            onSelectCase={onSelectCase}
                            onDelete={() => setCaseToDelete(c.fileNumber)}
                        />
                    ))}
                </div>
            )}

            {caseToDelete && (
                <ConfirmationModal
                    isOpen={!!caseToDelete}
                    title="Eliminar Expediente"
                    message={`¿Eliminar definitivamente el expediente ${caseToDelete}?`}
                    onConfirm={confirmDelete}
                    onClose={() => setCaseToDelete(null)}
                />
            )}
        </div>
    );
};

export default Dashboard;
