import React from 'react';
import { CaseRecord, getCaseStatusBadgeColor } from '../types';
import { UserIcon, CarIcon, TrashIcon } from './icons';

interface ExpedienteCardProps {
  caseRecord: CaseRecord;
  onSelectCase: (caseRecord: CaseRecord) => void;
  onDelete: (fileNumber: string) => void;
}

const ExpedienteCard: React.FC<ExpedienteCardProps> = ({ caseRecord, onSelectCase, onDelete }) => {
  const { fileNumber, client, vehicle, status, fileConfig } = caseRecord;

  return (
    <div className="relative bg-white rounded-xl shadow-md p-6 flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(fileNumber); }} 
        className="absolute top-2 right-2 p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-600 rounded-full"
        title="Eliminar expediente"
      >
        <TrashIcon />
      </button>
      <div>
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-lg text-sky-600 font-mono">{fileNumber}</h3>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getCaseStatusBadgeColor(status)}`}>
            {status}
          </span>
        </div>
        
        <p className="text-sm text-slate-600 mb-4">{fileConfig.fileType}</p>

        <div className="space-y-3 text-sm">
          <div className="flex items-start space-x-3">
            <UserIcon />
            <div>
              <p className="font-semibold text-slate-800">{client.surnames}{client.firstName ? `, ${client.firstName}` : ''}</p>
              <p className="text-slate-500">{client.nif}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CarIcon />
            <div>
              <p className="font-semibold text-slate-800">{vehicle.brand} {vehicle.model}</p>
              <p className="text-slate-500 font-mono">{vehicle.vin}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-slate-200 pt-4">
        <button
          onClick={() => onSelectCase(caseRecord)}
          className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
        >
          Ver Detalles
        </button>
      </div>
    </div>
  );
};

export default ExpedienteCard;