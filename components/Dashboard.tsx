
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
import { FileCategory, CaseRecord } from '../types';

interface DashboardProps {
    onSelectCase: (c: CaseRecord) => void;
    onCreateNewCase: (category: FileCategory) => void;
    onShowRemoteAccess: () => void;
    onShowTasksDashboard: () => void;
}

const FILE_CATEGORIES: { id: FileCategory; label: string }[] = [
    { id: 'GE-MAT', label: 'GE-MAT (Tráfico)' },
    { id: 'FI-TRI', label: 'FI-TRI (Fiscal)' },
    { id: 'FI-CONTA', label: 'FI-CONTA (Contable)' },
];

const Dashboard: React.FC<DashboardProps> = ({
    onSelectCase,
    onCreateNewCase,
    onShowRemoteAccess,
    onShowTasksDashboard,
}) => {
    const { caseHistory, deleteCase, appSettings } = useAppContext();

    // Filtros
    const [statusFilter, setStatusFilter] = useState<string>('Todos');
    const [categoryFilter, setCategoryFilter] = useState<string>('Todos');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [dateFilterType, setDateFilterType] =
        useState<'createdAt' | 'updatedAt'>('createdAt');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [caseToDelete, setCaseToDelete] = useState<string | null>(null);

    // Procesar expedientes
    const processedCases = useMemo(() => {
        let filtered = [...caseHistory];

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (c) =>
                    c.fileNumber.toLowerCase().includes(q) ||
                    `${c.client.firstName} ${c.client.surnames}`.toLowerCase().includes(q) ||
                    c.client.nif.toLowerCase().includes(q) ||
                    c.fileConfig.fileType.toLowerCase().includes(q)
            );
        }

        if (statusFilter !== 'Todos') {
            filtered = filtered.filter((c) => c.status === statusFilter);
        }

        if (categoryFilter !== 'Todos') {
            filtered = filtered.filter((c) => c.fileConfig.category === categoryFilter);
        }

        if (startDate || endDate) {
            const start = startDate
                ? new Date(`${startDate}T00:00:00`).getTime()
                : -Infinity;
            const end = endDate
                ? new Date(`${endDate}T23:59:59.999`).getTime()
                : Infinity;

            filtered = filtered.filter((c) => {
                const recordDate = c[dateFilterType];
                if (!recordDate) return false;
                const t = new Date(recordDate).getTime();
                return t >= start && t <= end;
            });
        }

        return filtered;
    }, [
        caseHistory,
        searchQuery,
        statusFilter,
        categoryFilter,
        startDate,
        endDate,
        dateFilterType,
    ]);

    // Confirmar eliminación
    const confirmDelete = async () => {
        if (!caseToDelete) return;
        await deleteCase(caseToDelete);
        setCaseToDelete(null);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Explorador de Expedientes</h1>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded ${
                            viewMode === 'grid' ? 'bg-sky-200' : 'bg-slate-200'
                        }`}
                    >
                        <GridViewIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded ${
                            viewMode === 'list' ? 'bg-sky-200' : 'bg-slate-200'
                        }`}
                    >
                        <ListViewIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="bg-slate-100 p-4 rounded-lg border border-slate-300 space-y-4">
                <div className="flex items-center space-x-3">
                    <div className="flex items-center bg-white border border-slate-300 rounded px-2">
                        <SearchIcon className="w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="ml-2 py-1 outline-none text-sm"
                        />
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
                        <option value="Todos">Tipo: Todos</option>
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
