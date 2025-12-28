import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Client, EconomicData, Vehicle, FileConfig, Communication, AttachedDocument, Task, User, CaseStatus } from '../types';
import { DocumentIcon, SpinnerIcon } from './icons';
import PrintableExpediente from './PrintableExpediente';
import { useToast } from '../hooks/useToast';
import { generatePdfFromElement } from '../services/mandateService';

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
  onAddDocuments: (files: File[]) => void;
}

const DocumentGeneratorSection: React.FC<DocumentGeneratorProps> = ({
  client, vehicle, economicData, communications, attachments, fileNumber,
  fileConfig, tasks, users, onOpenMandatoModal, caseStatus, createdAt, onAddDocuments
}) => {
  const { addToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSaveExpediente = async () => {
    setIsSaving(true);
    try {
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '210mm';
      document.body.appendChild(container);

      const root = ReactDOM.createRoot(container);
      root.render(
        <div className="printable-page bg-white p-8">
          <PrintableExpediente
            client={client} vehicle={vehicle} economicData={economicData}
            communications={communications} attachments={attachments}
            fileNumber={fileNumber} fileConfig={fileConfig} tasks={tasks}
            users={users} caseStatus={caseStatus} createdAt={createdAt}
          />
        </div>
      );

      await new Promise(resolve => setTimeout(resolve, 1000));

      const fileName = `Expediente_${fileNumber}.pdf`;
      const blob = await generatePdfFromElement(container, fileName);

      const file = new File([blob], fileName, { type: 'application/pdf' });
      onAddDocuments([file]);

      addToast('Expediente guardado en adjuntos', 'success');

      root.unmount();
      document.body.removeChild(container);

    } catch (error) {
      console.error(error);
      addToast('Error al guardar expediente', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex items-center mb-4"><DocumentIcon /><h2 className="text-xl font-bold text-slate-900 ml-3">Generador de Documentos</h2></div>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Crea versiones en PDF de los documentos del expediente.</p>
        <div className="flex flex-col space-y-3">
          <button onClick={handleGeneratePdf} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg">Vista Previa / Imprimir Expediente</button>
          <button onClick={handleSaveExpediente} disabled={isSaving} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center">
            {isSaving ? <><SpinnerIcon /> <span className="ml-2">Guardando...</span></> : 'Guardar Expediente en Adjuntos'}
          </button>
          <button onClick={onOpenMandatoModal} className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-lg">Generar Mandato</button>
        </div>
      </div>
    </div>
  );
};

export default DocumentGeneratorSection;