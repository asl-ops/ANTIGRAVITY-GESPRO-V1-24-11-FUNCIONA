import React from 'react';
import { CaseRecord, getCaseStatusBadgeColor } from '../types';
import { UserIcon, CarIcon } from './icons';
import { FolderOpen, Copy, Trash2 } from 'lucide-react';
import { getStatusColorClasses } from '../utils/statusColors';

interface ExpedienteCardProps {
  caseRecord: CaseRecord;
  onSelectCase: (caseRecord: CaseRecord) => void;
  onDelete: (fileNumber: string) => void;
  onDuplicate?: (caseRecord: CaseRecord) => void;
}

const ExpedienteCard: React.FC<ExpedienteCardProps> = ({
  caseRecord,
  onSelectCase,
  onDelete,
  onDuplicate
}) => {
  const { fileNumber, client, vehicle, status, fileConfig } = caseRecord;

  return (
    <div className={`relative bg-white rounded-xl shadow-md p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl ${getStatusColorClasses(status)}`}>
      {/* Status Badge */}
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
            <p className="font-semibold text-slate-800">
              {caseRecord.clientSnapshot?.nombre ||
                `${client.surnames}${client.firstName ? `, ${client.firstName}` : ''}` ||
                '—'}
            </p>
            <p className="text-slate-500">
              {caseRecord.clientSnapshot?.documento || client.nif || '—'}
            </p>
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

      {/* Action Icons - Simplif icados */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Abrir expediente (unifica Ver y Editar) */}
            <button
              onClick={() => onSelectCase(caseRecord)}
              disabled={status === 'Cerrado'}
              className={`p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors ${status === 'Cerrado' ? 'opacity-40 cursor-not-allowed' : ''}`}
              title={status === 'Cerrado' ? 'Expediente cerrado: reabrir para editar' : 'Abrir expediente'}
            >
              <FolderOpen className="w-5 h-5" />
            </button>

            {/* Duplicar expediente */}
            {onDuplicate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(caseRecord);
                }}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Duplicar expediente"
              >
                <Copy className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Eliminar */}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(fileNumber); }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar expediente"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpedienteCard;