import React from 'react';
import { CaseRecord, getCaseStatusBadgeColor } from '../types';
import { TrashIcon } from './icons';

interface ExpedienteListItemProps {
  caseRecord: CaseRecord;
  onSelectCase: (caseRecord: CaseRecord) => void;
  onDelete: (fileNumber: string) => void;
}

const ExpedienteListItem: React.FC<ExpedienteListItemProps> = ({ caseRecord, onSelectCase, onDelete }) => {
  const { fileNumber, client, vehicle, status, fileConfig } = caseRecord;

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 flex items-center justify-between hover:shadow-md transition-shadow duration-200 border">
      <div className="flex items-center gap-4 flex-grow">
        <div className="flex-shrink-0 w-28">
            <p className="font-bold text-md text-sky-600 font-mono truncate">{fileNumber}</p>
            <p className="text-xs text-slate-500">{new Date(caseRecord.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex-grow">
          <p className="font-semibold text-slate-800 truncate">{client.surnames}{client.firstName ? `, ${client.firstName}` : ''} ({client.nif})</p>
          <p className="text-sm text-slate-600 truncate">{vehicle.brand} {vehicle.model} - <span className="font-mono">{vehicle.vin}</span></p>
        </div>
        <div className="w-48 flex-shrink-0">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCaseStatusBadgeColor(status)}`}>
                {status}
            </span>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <button onClick={() => onSelectCase(caseRecord)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-1 px-3 rounded-md text-sm">
          Ver
        </button>
        <button onClick={() => onDelete(fileNumber)} className="p-2 text-slate-400 hover:bg-red-100 hover:text-red-600 rounded-full" title="Eliminar expediente">
          <TrashIcon />
        </button>
      </div>
    </div>
  );
};

export default ExpedienteListItem;