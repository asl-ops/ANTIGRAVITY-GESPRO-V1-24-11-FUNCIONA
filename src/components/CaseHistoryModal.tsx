
import React from 'react';
import { CaseRecord, getCaseStatusBadgeColor } from '../types';
import { XMarkIcon } from './icons';

interface CaseHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: CaseRecord[];
  clientNif: string;
  clientName: string;
}

const CaseHistoryModal: React.FC<CaseHistoryModalProps> = ({ isOpen, onClose, history, clientNif, clientName }) => {
  if (!isOpen) return null;

  const relatedCases = history.filter(
    (c) =>
      c.client.nif === clientNif &&
      c.fileConfig.fileType.toLowerCase().includes('matriculación')
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl m-4 p-6 flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Historial de Matriculaciones</h3>
            <p className="text-sm text-slate-600">
                Mostrando expedientes para: <span className="font-bold">{clientName || 'N/A'}</span> ({clientNif || 'N/A'})
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <XMarkIcon />
          </button>
        </div>

        <div className="overflow-y-auto max-h-96">
          {relatedCases.length > 0 ? (
            <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0">
                    <tr>
                        <th scope="col" className="px-6 py-3">Nº Expediente</th>
                        <th scope="col" className="px-6 py-3">Vehículo</th>
                        <th scope="col" className="px-6 py-3">Nº Bastidor (VIN)</th>
                        <th scope="col" className="px-6 py-3">Tipo de Trámite</th>
                        <th scope="col" className="px-6 py-3">Estado</th>
                    </tr>
                </thead>
                <tbody>
                {relatedCases.sort((a,b) => b.fileNumber.localeCompare(a.fileNumber)).map((record) => (
                    <tr key={record.fileNumber} className="bg-white border-b hover:bg-slate-50">
                        <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                            {record.fileNumber}
                        </th>
                        <td className="px-6 py-4">
                            {record.vehicle.brand} {record.vehicle.model}
                        </td>
                        <td className="px-6 py-4 font-mono">
                            {record.vehicle.vin}
                        </td>
                        <td className="px-6 py-4">
                            {record.fileConfig.fileType}
                        </td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCaseStatusBadgeColor(record.status)}`}>
                                {record.status}
                            </span>
                        </td>
                    </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-slate-500 p-8">
              No se encontraron expedientes de matriculación anteriores para este cliente.
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end flex-shrink-0">
            <button
                onClick={onClose}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg transition-colors duration-200"
            >
                Cerrar
            </button>
        </div>
      </div>
    </div>
  );
};

export default CaseHistoryModal;