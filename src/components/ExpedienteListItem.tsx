import React from 'react';
import { CaseRecord, getCaseStatusBadgeColor } from '../types';
import { getStatusRowColorClasses } from '../utils/statusColors';

interface ExpedienteListItemProps {
    caseRecord: CaseRecord;
    onSelectCase: (caseRecord: CaseRecord) => void;
}

const ExpedienteListItem: React.FC<ExpedienteListItemProps & { isSelected: boolean; onToggleSelection: (fileNumber: string) => void }> = ({
    caseRecord,
    onSelectCase,
    isSelected,
    onToggleSelection
}) => {
    const { fileNumber, status, fileConfig, createdAt, client, situation, closedAt } = caseRecord;

    return (
        <div className={`grid grid-cols-[auto_1fr_1fr_3fr_1fr_1fr_1fr_1fr_2fr] gap-2 p-3 text-sm cursor-pointer transition-colors border-b ${getStatusRowColorClasses(status)} ${isSelected ? 'bg-blue-50' : ''}`}
            onClick={() => onSelectCase(caseRecord)}
        >
            {/* Checkbox Selection */}
            <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelection(fileNumber)}
                    className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                />
            </div>

            {/* Tipo */}
            <div className="truncate" title={fileConfig.category}>{fileConfig.category}</div>

            {/* EXPEDIENTE */}
            <div className="font-mono font-semibold text-sky-600 truncate" title={fileNumber}>{fileNumber}</div>

            {/* Cliente */}
            <div className="text-slate-700 truncate" title={
                caseRecord.clientSnapshot?.nombre ||
                `${client.surnames} ${client.firstName}` ||
                '—'
            }>
                {caseRecord.clientSnapshot?.nombre ||
                    `${client.surnames} ${client.firstName}` ||
                    '—'}
            </div>

            {/* FECHA DE APERTURA */}
            <div className="text-slate-600 text-xs flex items-center justify-center">
                <span>{new Date(createdAt).toLocaleDateString()}</span>
            </div>

            {/* FECHA DE CIERRLast login: Sat Nov 29 21:29:41 on ttys001
antoniosanchez@Mac-mini-de-Antonio ~ % cd "~/Downloads/gestor-de-expedientes-pro VS CODE"
cd: no such file or directory: ~/Downloads/gestor-de-expedientes-pro VS CODE
antoniosanchez@Mac-mini-de-Antonio ~ % bash scripts/fix-and-install.sh
bash: scripts/fix-and-install.sh: No such file or directory
antoniosanchez@Mac-mini-de-Antonio ~ % npm run prepare
npm error code ENOENT
npm error syscall open
npm error path /Users/antoniosanchez/package.json
npm error errno -2
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory, open '/Users/antoniosanchez/package.json'
npm error enoent This is related to npm not being able to find a file.
npm error enoent
npm error A complete log of this run can be found in: /Users/antoniosanchez/.npm/_logs/2025-11-29T20_32_12_922Z-debug-0.log
antoniosanchez@Mac-mini-de-Antonio ~ % 






E */}
            <div className="text-slate-600 text-xs flex items-center justify-center">
                {status === 'Cerrado' && closedAt ? (
                    <span>{new Date(closedAt).toLocaleDateString()}</span>
                ) : null}
            </div>

            {/* Saldo */}
            <div className="text-slate-700 font-semibold flex items-center justify-end pr-4" title={`${caseRecord.economicData.totalAmount.toFixed(2)} €`}>
                {new Intl.NumberFormat('es-ES', {
                    style: 'currency',
                    currency: 'EUR'
                }).format(caseRecord.economicData.totalAmount)}
            </div>

            {/* Situación */}
            <div className="text-sm text-slate-700 truncate" title={situation || 'Iniciado'}>
                {situation || 'Iniciado'}
            </div>

            {/* Estado */}
            <div className="">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCaseStatusBadgeColor(status)}`}>
                    {status}
                </span>
            </div>
        </div>
    );
};

export default ExpedienteListItem;
