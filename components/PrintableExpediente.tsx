import React from 'react';
import { Client, Vehicle, EconomicData, Communication, FileConfig, AttachedDocument, Task, User, CaseStatus, getCaseStatusBadgeColor } from '../types';
import { GestoriaLogoIcon, UserIcon, CarIcon, EuroIcon, ChatBubbleIcon, ClipboardListIcon, PaperClipIcon } from './icons';

interface PrintableExpedienteProps {
  client: Client;
  vehicle: Vehicle;
  economicData: EconomicData;
  communications: Communication[];
  attachments: AttachedDocument[];
  fileNumber: string;
  fileConfig: FileConfig;
  tasks: Task[];
  users: User[];
  caseStatus: CaseStatus;
  createdAt?: string;
}

const PrintableExpediente: React.FC<PrintableExpedienteProps> = ({
  client,
  vehicle,
  economicData,
  communications,
  attachments,
  fileNumber,
  fileConfig,
  tasks,
  users,
  caseStatus,
  createdAt,
}) => {
  const formatCurrency = (amount: number) => amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
  const formatDate = (dateString: string | undefined) => dateString ? new Date(dateString).toLocaleDateString('es-ES') : 'N/A';
  const today = new Date().toLocaleDateString('es-ES');
  
  const responsibleUser = users.find(u => u.id === fileConfig.responsibleUserId)?.name || 'N/A';
  const pendingTasks = tasks.filter(t => !t.isCompleted);

  const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-white p-4 rounded-lg border shadow-sm break-inside-avoid">
      <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2 border-b pb-2">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );

  const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex justify-between py-1.5 text-sm">
      <span className="text-slate-600 font-semibold uppercase text-xs">{label}</span>
      <span className="text-slate-900 font-medium text-right">{value || '-'}</span>
    </div>
  );
  
  const fullAddress = [client.address, client.city, client.postalCode, client.province].filter(Boolean).join(', ');

  return (
    <div className="printable-page bg-white font-sans text-slate-900">
      <header className="flex justify-between items-start pb-4 border-b-4 border-sky-600">
        <GestoriaLogoIcon />
        <div className="text-right">
          <h2 className="text-3xl font-bold font-serif mb-2 text-slate-800">FICHA DE EXPEDIENTE</h2>
          <div className="bg-slate-100 px-4 py-1 rounded-full inline-block text-lg font-semibold font-mono text-sky-700">
            {fileNumber}
          </div>
        </div>
      </header>

      <section className="grid grid-cols-4 gap-4 my-4 text-sm">
          <div className="bg-slate-50 p-3 rounded">
            <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Tipo de Trámite</p>
            <p className="font-bold text-slate-800">{fileConfig.fileType}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded">
            <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Estado Actual</p>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getCaseStatusBadgeColor(caseStatus)}`}>
              {caseStatus}
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded">
            <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Fecha Apertura</p>
            <p className="font-bold text-slate-800">{formatDate(createdAt)}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded">
            <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Responsable</p>
            <p className="font-bold text-slate-800">{responsibleUser}</p>
          </div>
      </section>

      <main className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Section icon={<UserIcon />} title="Datos del Titular">
            <InfoRow label="Apellidos / Razón Social" value={client.surnames} />
            <InfoRow label="Nombre" value={client.firstName} />
            <InfoRow label="NIF / CIF" value={client.nif} />
            <InfoRow label="Dirección" value={fullAddress} />
            <InfoRow label="Teléfono" value={client.phone} />
            <InfoRow label="Email" value={client.email} />
          </Section>
          
          <Section icon={<CarIcon />} title="Datos del Vehículo">
            <InfoRow label="Nº de Bastidor (VIN)" value={vehicle.vin} />
            <InfoRow label="Marca" value={vehicle.brand} />
            <InfoRow label="Modelo" value={vehicle.model} />
            <InfoRow label="Fecha 1ª Matr." value={vehicle.year} />
            <InfoRow label="Cilindrada" value={vehicle.engineSize ? `${vehicle.engineSize} cc` : '-'} />
            <InfoRow label="Combustible" value={vehicle.fuelType} />
          </Section>
        </div>

        <Section icon={<EuroIcon />} title="Resumen Económico">
          {economicData.lines.map((line) => (
            <InfoRow key={line.id} label={line.concept} value={formatCurrency(line.amount)} />
          ))}
          <div className="mt-2 border-t pt-2">
            <InfoRow label="Subtotal" value={formatCurrency(economicData.subtotalAmount)} />
            <InfoRow label="IVA (21%)" value={formatCurrency(economicData.vatAmount)} />
            <div className="flex justify-between items-center bg-slate-100 p-2 rounded-lg mt-1">
                <span className="text-md font-bold text-slate-800">TOTAL:</span>
                <span className="text-xl font-bold text-sky-600">
                    {formatCurrency(economicData.totalAmount)}
                </span>
            </div>
          </div>
        </Section>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Section icon={<PaperClipIcon />} title="Documentación Adjunta">
            <ul className="space-y-1 text-sm">
                {attachments.length > 0 ? (
                  attachments.map(doc => (
                    <li key={doc.id} className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full ${doc.status === 'synced' ? 'bg-emerald-500' : 'bg-yellow-500'}`}></span>
                      <span>{doc.name}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Sin documentos adjuntos</p>
                )}
              </ul>
          </Section>

          <Section icon={<ClipboardListIcon />} title="Tareas Pendientes">
             <ul className="space-y-1 text-sm">
                {pendingTasks.length > 0 ? (
                  pendingTasks.map(task => (
                    <li key={task.id} className="flex items-center gap-2">
                      <span className="font-mono text-sky-600">□</span>
                      <span>{task.text}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No hay tareas pendientes</p>
                )}
              </ul>
          </Section>
        </div>
        
        <Section icon={<ChatBubbleIcon />} title="Comunicaciones">
          <div className="space-y-2">
            {communications.length > 0 ? (
              communications.map((comm) => (
                <div key={comm.id} className="text-sm border-b pb-1">
                  <span className="font-semibold">{formatDate(comm.date)}: </span>
                  <span>{comm.concept}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No hay comunicaciones registradas</p>
            )}
          </div>
        </Section>
      </main>

      <footer className="mt-6 pt-4 text-center text-xs text-slate-500 border-t">
        Documento generado el {today} | Gestoría Arcos - Documento Confidencial
      </footer>
    </div>
  );
};

export default PrintableExpediente;