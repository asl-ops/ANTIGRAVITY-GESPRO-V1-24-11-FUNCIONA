
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Client, EconomicData, Vehicle, FileConfig, Communication, AttachedDocument, Task, User, CaseStatus } from '../types';
import { DocumentIcon } from './icons';
import PrintableExpediente from './PrintableExpediente';
import { useToast } from '../hooks/useToast';

interface DocumentGeneratorProps {
  client: Client;
  vehicle: Vehicle;
  economicData: EconomicData;
  communications: Communication[];
  attachments: AttachedDocument[];
  fileNumber: string;
  fileConfig: FileConfig;
  tasks: Task[];
  users: User[];
  onOpenMandatoModal: () => void;
  caseStatus: CaseStatus;
  createdAt: string;
}

const DocumentGeneratorSection: React.FC<DocumentGeneratorProps> = ({ 
    client, vehicle, economicData, communications, attachments, fileNumber, 
    fileConfig, tasks, users, onOpenMandatoModal, caseStatus, createdAt 
}) => {
  const { addToast } = useToast();
  
  const handleGeneratePdf = () => {
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      addToast('Permite las ventanas emergentes para generar documentos.', 'warning');
      return;
    }

    printWindow.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8" /><title>Expediente ${fileNumber}</title></head><body><div id="print-root"></div></body></html>`);
    Array.from(document.styleSheets).forEach(styleSheet => {
        try {
            const cssRules = Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('');
            const style = printWindow.document.createElement('style');
            style.textContent = cssRules;
            printWindow.document.head.appendChild(style);
        } catch (e) { console.warn('Could not copy stylesheet:', e); }
    });
    
    const printStyle = printWindow.document.createElement('style');
    printStyle.textContent = `@media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } .printable-page { margin: 0; box-shadow: none; } .break-inside-avoid { break-inside: avoid; } }`;
    printWindow.document.head.appendChild(printStyle);
    printWindow.document.close();

    printWindow.onload = () => {
      const printRootEl = printWindow.document.getElementById('print-root');
      if (!printRootEl) { printWindow.close(); return; }
      const root = ReactDOM.createRoot(printRootEl);
      root.render(
        <React.StrictMode>
          <div className="p-8 bg-slate-100">
            <PrintableExpediente
              client={client} vehicle={vehicle} economicData={economicData}
              communications={communications} attachments={attachments}
              fileNumber={fileNumber} fileConfig={fileConfig} tasks={tasks}
              users={users} caseStatus={caseStatus} createdAt={createdAt}
            />
          </div>
        </React.StrictMode>
      );

      setTimeout(() => { printWindow.focus(); printWindow.print(); printWindow.close(); }, 250); 
    };
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex items-center mb-4"><DocumentIcon /><h2 className="text-xl font-bold text-slate-900 ml-3">Generador de Documentos</h2></div>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Crea versiones en PDF de los documentos del expediente.</p>
        <div className="flex flex-col space-y-3">
             <button onClick={handleGeneratePdf} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg">Generar PDF del Expediente</button>
             <button onClick={onOpenMandatoModal} className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-lg">Generar Mandato PDF</button>
        </div>
      </div>
    </div>
  );
};

export default DocumentGeneratorSection;