
import React from 'react';
import { CaseRecord, CaseSelection, getCaseStatusBadgeColor } from '../types';
import { XMarkIcon } from './icons';

interface CaseSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selection: CaseSelection;
  onSelectCase: (caseRecord: CaseRecord) => void;
}

const CaseSelectionModal: React.FC<CaseSelectionModalProps> = ({ isOpen, onClose, selection, onSelectCase }) => {
  if (!isOpen) return null;

  const clientName = `${selection.cases[0].client.surnames}, ${selection.cases[0].client.firstName}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl m-4 p-6 flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Seleccionar Expediente</h3>
            <p className="text-sm text-slate-600">
                Se encontraron varios expedientes para {clientName} ({selection.nif}).
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <XMarkIcon />
          </button>
        </div>

        <div className="overflow-y-auto max-h-80">
          <ul className="divide-y divide-slate-200">
            {selection.cases.map(caseRecord => (
              <li
                key={caseRecord.fileNumber}
                onClick={() => onSelectCase(caseRecord)}
                className="p-4 hover:bg-slate-100 cursor-pointer transition-colors duration-150 rounded-lg flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-sky-600">{caseRecord.fileNumber}</p>
                  <p className="text-sm text-slate-700">{caseRecord.vehicle.brand} {caseRecord.vehicle.model}</p>
                  <p className="text-xs text-slate-500">{caseRecord.fileConfig.fileType}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCaseStatusBadgeColor(caseRecord.status)}`}>
                    {caseRecord.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CaseSelectionModal;