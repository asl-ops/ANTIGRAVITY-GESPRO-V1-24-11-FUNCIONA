import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    onPageChange,
    onPageSizeChange,
}) => {
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
        <div className="flex items-center justify-between bg-white border-t border-slate-200 px-4 py-3 sm:px-6">
            {/* Left side: Items per page */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-slate-700">Mostrar:</span>
                <select
                    value={pageSize}
                    onChange={(e) => {
                        onPageSizeChange(Number(e.target.value));
                        onPageChange(1); // Reset to first page
                    }}
                    className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-sky-500 outline-none"
                >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                </select>
                <span className="text-sm text-slate-700">por página</span>
            </div>

            {/* Center: Item count */}
            <div className="hidden sm:block">
                <p className="text-sm text-slate-700">
                    Mostrando <span className="font-medium">{startItem}</span> a{' '}
                    <span className="font-medium">{endItem}</span> de{' '}
                    <span className="font-medium">{totalItems}</span> expedientes
                </p>
            </div>

            {/* Right side: Page navigation */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${currentPage === 1
                            ? 'text-slate-400 cursor-not-allowed'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                </button>

                {/* Page numbers */}
                <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                            pageNum = i + 1;
                        } else if (currentPage <= 3) {
                            pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                        } else {
                            pageNum = currentPage - 2 + i;
                        }

                        return (
                            <button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${currentPage === pageNum
                                        ? 'bg-sky-600 text-white'
                                        : 'text-slate-700 hover:bg-slate-100'
                                    }`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                </div>

                {/* Mobile page indicator */}
                <div className="sm:hidden px-3 py-1.5 text-sm font-medium text-slate-700">
                    Página {currentPage} de {totalPages}
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${currentPage === totalPages || totalPages === 0
                            ? 'text-slate-400 cursor-not-allowed'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                >
                    Siguiente
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default PaginationControls;
