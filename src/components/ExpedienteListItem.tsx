
import React from 'react';
import { CaseRecord, getCaseStatusBadgeColor } from '../types';
import { TrashIcon, UserIcon } from './icons';

interface ExpedienteListItemProps {
  caseRecord: CaseRecord;
  onSelectCase: (caseRecord: CaseRecord) => void;
  onDelete: (fileNumber: string) => void;
}

const ExpedienteListItem: React.FC<ExpedienteListItemProps> = ({ caseRecord, onSelectCase, onDelete }) => {
  const { fileNumber, client, vehicle, status, fileConfig, createdAt } = caseRecord;

  const categoryLabel = fileConfig.category || 'GE-MAT';
  const fileTypeLabel = fileConfig.fileType || 'General';
  
  const formatDate = (dateStr: string) => {
      try { return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }); } 
      catch { return 'N/A'; }
  };

  return (
    <div 
        className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-sky-50 transition-colors group cursor-pointer border-b border-slate-100 last:border-0"
        onClick={() => onSelectCase(caseRecord)}
    >
        
        {/* COL 1-2: ID Expediente */}
        <div className="col-span-2 flex flex-col justify-center overflow-hidden">
            <span className="font-bold text-sm text-sky-600 font-mono truncate group-hover:text-sky-700 transition-colors">{fileNumber}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{categoryLabel}</span>
        </div>
        
        {/* COL 3-5: Cliente / Titular */}
        <div className="col-span-3 flex items-center gap-2 overflow-hidden">
          <div className="flex-shrink-0 text-slate-400"><UserIcon /></div>
          <div className="overflow-hidden min-w-0">
            <p className="font-semibold text-slate-800 text-sm truncate" title={`${client.surnames}, ${client.firstName}`}>
                {client.surnames} {client.firstName}
            </p>
            <p className="text-xs text-slate-500 truncate font-mono">{client.nif}</p>
          </div>
        </div>
        
        {/* COL 6-8: Modalidad / Vehículo */}
        <div className="col-span-3 flex flex-col justify-center overflow-hidden min-w-0">
           <p className="text-sm text-slate-700 truncate font-medium" title={fileTypeLabel}>{fileTypeLabel}</p>
           {vehicle.brand ? (
               <p className="text-xs text-slate-500 truncate" title={`${vehicle.brand} ${vehicle.model} ${vehicle.vin}`}>{vehicle.brand} {vehicle.model} <span className="text-slate-400">({vehicle.vin?.slice(-4)})</span></p>
           ) : (
               <p className="text-xs text-slate-400 italic">Sin detalle vehículo</p>
           )}
        </div>
        
        {/* COL 9-10: Estado */}
        <div className="col-span-2 flex items-center">
            <span className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-full truncate block w-full text-center border shadow-sm ${getCaseStatusBadgeColor(status)}`}>
                {status}
            </span>
        </div>
        
        {/* COL 11: Fecha */}
        <div className="col-span-1 text-xs text-slate-600 font-mono text-center">
            {formatDate(createdAt)}
        </div>

        {/* COL 12: Acciones */}
        <div className="col-span-1 flex items-center justify-end gap-2">
            <button 
                onClick={(e) => { e.stopPropagation(); onDelete(fileNumber); }} 
                className="p-2 text-slate-300 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors opacity-0 group-hover:opacity-100" 
                title="Eliminar expediente"
            >
                <TrashIcon />
            </button>
        </div>

    </div>
  );
};

export default ExpedienteListItem;
