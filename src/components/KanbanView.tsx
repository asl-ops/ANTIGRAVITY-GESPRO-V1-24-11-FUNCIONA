import React, { useState, useMemo } from 'react';
import { CaseRecord } from '../types';
import { ArrowLeft, GripVertical, User, Calendar, FileText } from 'lucide-react';

interface KanbanViewProps {
    cases: CaseRecord[];
    onUpdateCase: (caseRecord: CaseRecord) => void;
    onSelectCase: (fileNumber: string) => void;
    onClose: () => void;
}

interface KanbanColumn {
    id: string;
    title: string;
    color: string;
    bgColor: string;
    statuses: string[];
}

const KanbanView: React.FC<KanbanViewProps> = ({ cases, onUpdateCase, onSelectCase, onClose }) => {
    const [draggedCase, setDraggedCase] = useState<CaseRecord | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    const columns: KanbanColumn[] = [
        {
            id: 'pending',
            title: 'Pendiente',
            color: 'text-amber-700',
            bgColor: 'bg-amber-50',
            statuses: ['Pendiente Documentación', 'Iniciado']
        },
        {
            id: 'in_progress',
            title: 'En Tramitación',
            color: 'text-blue-700',
            bgColor: 'bg-blue-50',
            statuses: ['En Tramitación', 'En Proceso']
        },
        {
            id: 'review',
            title: 'Revisión',
            color: 'text-purple-700',
            bgColor: 'bg-purple-50',
            statuses: ['En Revisión', 'Pendiente Aprobación']
        },
        {
            id: 'completed',
            title: 'Completado',
            color: 'text-green-700',
            bgColor: 'bg-green-50',
            statuses: ['Cerrado', 'Finalizado']
        }
    ];

    // Group cases by column
    const casesByColumn = useMemo(() => {
        const grouped: Record<string, CaseRecord[]> = {};
        columns.forEach(col => {
            grouped[col.id] = cases.filter(c =>
                c.status !== 'Eliminado' && col.statuses.includes(c.status)
            );
        });
        return grouped;
    }, [cases, columns]);

    const handleDragStart = (e: React.DragEvent, caseRecord: CaseRecord) => {
        setDraggedCase(caseRecord);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = () => {
        setDraggedCase(null);
        setDragOverColumn(null);
    };

    const handleDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverColumn(columnId);
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        if (!draggedCase) return;

        const targetColumn = columns.find(col => col.id === columnId);
        if (!targetColumn) return;

        // Update case status to the first status of the target column
        const newStatus = targetColumn.statuses[0];

        if (draggedCase.status !== newStatus) {
            const updatedCase: CaseRecord = {
                ...draggedCase,
                status: newStatus,
                situation: newStatus,
                updatedAt: new Date().toISOString(),
                ...(newStatus === 'Cerrado' && !draggedCase.closedAt ? { closedAt: new Date().toISOString() } : {}),
                ...(newStatus !== 'Cerrado' && draggedCase.closedAt ? { closedAt: undefined } : {})
            };

            onUpdateCase(updatedCase);
        }

        setDraggedCase(null);
        setDragOverColumn(null);
    };

    const getCaseCount = (columnId: string) => {
        return casesByColumn[columnId]?.length || 0;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg border border-slate-300 transition-colors shadow-sm"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="font-medium">Volver a Lista</span>
                        </button>
                        <h1 className="text-3xl font-bold text-slate-800">Vista Kanban</h1>
                    </div>
                    <div className="text-sm text-slate-600 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                        <span className="font-semibold">{cases.filter(c => c.status !== 'Eliminado').length}</span> expedientes totales
                    </div>
                </div>

                {/* Kanban Board */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {columns.map(column => (
                        <div
                            key={column.id}
                            className="flex flex-col h-[calc(100vh-200px)]"
                        >
                            {/* Column Header */}
                            <div className={`${column.bgColor} ${column.color} px-4 py-3 rounded-t-xl border-b-2 border-${column.color.replace('text-', '')}`}>
                                <div className="flex items-center justify-between">
                                    <h2 className="font-bold text-lg">{column.title}</h2>
                                    <span className="bg-white px-2 py-1 rounded-full text-xs font-semibold">
                                        {getCaseCount(column.id)}
                                    </span>
                                </div>
                            </div>

                            {/* Column Content - Droppable Area */}
                            <div
                                onDragOver={(e) => handleDragOver(e, column.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, column.id)}
                                className={`flex-1 bg-white rounded-b-xl p-3 overflow-y-auto space-y-3 transition-all ${dragOverColumn === column.id
                                        ? 'ring-2 ring-blue-400 bg-blue-50'
                                        : 'border border-slate-200'
                                    }`}
                            >
                                {casesByColumn[column.id]?.map(caseRecord => (
                                    <div
                                        key={caseRecord.fileNumber}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, caseRecord)}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => onSelectCase(caseRecord.fileNumber)}
                                        className={`bg-white border border-slate-200 rounded-lg p-4 cursor-move hover:shadow-lg transition-all group ${draggedCase?.fileNumber === caseRecord.fileNumber
                                                ? 'opacity-50 rotate-2'
                                                : 'hover:scale-105'
                                            }`}
                                    >
                                        {/* Drag Handle */}
                                        <div className="flex items-start gap-2 mb-2">
                                            <GripVertical className="w-4 h-4 text-slate-400 group-hover:text-slate-600 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-slate-800 text-sm truncate">
                                                    {caseRecord.fileNumber}
                                                </h3>
                                                {caseRecord.description && (
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {caseRecord.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Client Info */}
                                        <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
                                            <User className="w-3 h-3" />
                                            <span className="truncate">
                                                {caseRecord.client.surnames} {caseRecord.client.firstName}
                                            </span>
                                        </div>

                                        {/* Category Badge */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                                                <FileText className="w-3 h-3" />
                                                {caseRecord.fileConfig.category}
                                            </span>
                                        </div>

                                        {/* Date */}
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Calendar className="w-3 h-3" />
                                            <span>
                                                {new Date(caseRecord.createdAt).toLocaleDateString('es-ES')}
                                            </span>
                                        </div>

                                        {/* Tasks indicator */}
                                        {caseRecord.tasks && caseRecord.tasks.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-slate-100">
                                                <div className="flex items-center gap-1 text-xs">
                                                    <span className="text-slate-500">Tareas:</span>
                                                    <span className="font-semibold text-slate-700">
                                                        {caseRecord.tasks.filter(t => t.isCompleted).length}/{caseRecord.tasks.length}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Empty State */}
                                {(!casesByColumn[column.id] || casesByColumn[column.id].length === 0) && (
                                    <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
                                        Sin expedientes
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Help Text */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        <strong>💡 Tip:</strong> Arrastra y suelta las tarjetas entre columnas para cambiar el estado de los expedientes.
                        Haz clic en una tarjeta para ver sus detalles.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default KanbanView;
