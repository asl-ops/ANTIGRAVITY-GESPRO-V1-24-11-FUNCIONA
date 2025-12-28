import React from 'react';
import { SearchIcon, XMarkIcon } from './icons';
import { PrefixConfig } from '../types';
import { ClientTypeahead } from './ClientTypeahead';

interface FilterPanelProps {
    // Search filters
    searchQuery: string;
    setSearchQuery: (value: string) => void;
    selectedClientId: string | null;
    setSelectedClientId: (value: string | null) => void;
    selectedClientLabel: string;
    setSelectedClientLabel: (value: string) => void;
    identifierFilter: string;
    setIdentifierFilter: (value: string) => void;
    vehicleFilter: string;
    setVehicleFilter: (value: string) => void;

    // Dropdown filters
    statusFilter: string;
    setStatusFilter: (value: string) => void;
    categoryFilter: string;
    setCategoryFilter: (value: string) => void;
    situationFilter: string;
    setSituationFilter: (value: string) => void;

    // Date filters
    dateFilterType: 'createdAt' | 'updatedAt';
    setDateFilterType: (value: 'createdAt' | 'updatedAt') => void;
    startDate: string;
    setStartDate: (value: string) => void;
    endDate: string;
    setEndDate: (value: string) => void;

    // Data for dropdowns
    prefixes: PrefixConfig[];
    caseStatuses: string[];

    // Clear function
    onClearFilters: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
    searchQuery,
    setSearchQuery,
    selectedClientId,
    setSelectedClientId,
    selectedClientLabel,
    setSelectedClientLabel,
    identifierFilter,
    setIdentifierFilter,
    vehicleFilter,
    setVehicleFilter,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    situationFilter,
    setSituationFilter,
    dateFilterType,
    setDateFilterType,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    prefixes,
    caseStatuses,
    onClearFilters,
}) => {
    // Check if any filter is active
    const hasActiveFilters =
        searchQuery ||
        selectedClientId ||
        identifierFilter ||
        vehicleFilter ||
        statusFilter !== 'Todos' ||
        categoryFilter !== 'Todos' ||
        situationFilter !== 'Todos' ||
        startDate ||
        endDate;

    return (
        <div className="bg-white rounded-lg border-2 border-slate-200 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2">
                    <SearchIcon className="w-5 h-5 text-sky-600" />
                    <h3 className="text-lg font-semibold text-slate-800">Filtros de búsqueda</h3>
                    {hasActiveFilters && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-sky-100 text-sky-700 rounded-full">
                            Activos
                        </span>
                    )}
                </div>
                <button onClick={onClearFilters} disabled={!hasActiveFilters} className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${hasActiveFilters ? 'text-red-600 hover:bg-red-50' : 'text-slate-400 cursor-not-allowed'}`}>
                    <XMarkIcon className="w-4 h-4" />
                    Limpiar filtros
                </button>
            </div>

            {/* Filter Fields */}
            <div className="p-4 space-y-4">
                {/* Row 1: Cliente (DNI + Nombre) */}
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                        Cliente / DNI / NIE / CIF
                    </label>
                    <ClientTypeahead
                        valueClientId={selectedClientId}
                        valueLabel={selectedClientLabel}
                        placeholder="Buscar cliente por nombre o documento…"
                        onSelect={(client) => {
                            setSelectedClientId(client.id);
                            setSelectedClientLabel(`${client.nombre}${client.documento ? ' · ' + client.documento : ''}`);
                            setSearchQuery(''); // Limpiar búsqueda por texto cuando se selecciona
                        }}
                        onClear={() => {
                            setSelectedClientId(null);
                            setSelectedClientLabel('');
                        }}
                        enableQuickCreate={false}
                        limit={10}
                    />
                </div>

                {/* Row 2: Identificador de Expediente y Matrícula */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Identificador de Expediente
                        </label>
                        <div className="flex items-center bg-white border border-slate-300 rounded px-2">
                            <input
                                type="text"
                                placeholder="Ej: EXP-0001"
                                value={identifierFilter}
                                onChange={(e) => setIdentifierFilter(e.target.value)}
                                className="py-1 outline-none text-sm w-full"
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
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Matrícula del Vehículo
                        </label>
                        <div className="flex items-center bg-white border border-slate-300 rounded px-2">
                            <input
                                type="text"
                                placeholder="Ej: 1234ABC, IBZ1234"
                                value={vehicleFilter}
                                onChange={(e) => setVehicleFilter(e.target.value.toUpperCase())}
                                className="py-1 outline-none text-sm w-full"
                            />
                            {vehicleFilter && (
                                <button
                                    onClick={() => setVehicleFilter('')}
                                    className="ml-1 text-slate-400 hover:text-slate-600"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>


                {/* Row 3: Prefijo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Prefijo
                        </label>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="w-full border border-slate-300 px-3 py-1.5 rounded text-sm bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                        >
                            <option value="Todos">Todos los prefijos</option>
                            {prefixes.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.code} - {p.description}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Situación
                        </label>
                        <select
                            value={situationFilter}
                            onChange={(e) => setSituationFilter(e.target.value)}
                            className="w-full border border-slate-300 px-3 py-1.5 rounded text-sm bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                        >
                            <option value="Todos">Todas las situaciones</option>
                            <option value="Iniciado">Iniciado</option>
                            <option value="En Proceso">En Proceso</option>
                            <option value="Detenido">Detenido</option>
                            <option value="Cerrado">Cerrado</option>
                            <option value="Finalizado">Finalizado</option>
                        </select>
                    </div>
                </div>

                {/* Row 4: Estado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Fecha Cierre/Estado
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full border border-slate-300 px-3 py-1.5 rounded text-sm bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                        >
                            <option value="Todos">Todos los estados</option>
                            {caseStatuses.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Row 5: Filtros de Fecha en una línea */}
                <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-4">
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Tipo de Fecha
                        </label>
                        <select
                            value={dateFilterType}
                            onChange={(e) => setDateFilterType(e.target.value as 'createdAt' | 'updatedAt')}
                            className="w-full border border-slate-300 px-3 py-1.5 rounded text-sm bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                        >
                            <option value="createdAt">Fecha de Apertura</option>
                            <option value="updatedAt">Fecha de Cierre</option>
                        </select>
                    </div>

                    <div className="col-span-4">
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Desde
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                        />
                    </div>

                    <div className="col-span-4">
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Hasta
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                        />
                        {(startDate || endDate) && (
                            <button
                                onClick={() => {
                                    setStartDate('');
                                    setEndDate('');
                                }}
                                className="px-2 py-1 hover:bg-slate-100 rounded transition-colors"
                                title="Limpiar fechas"
                            >
                                <XMarkIcon className="w-4 h-4 text-slate-600" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>

    );
};

export default FilterPanel;
