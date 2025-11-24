


export interface Client {
  id: string;
  surnames: string;
  firstName: string;
  nif: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
}

export interface EconomicLineItem {
  id: string;
  conceptId: string;         // References ConceptCatalog
  concept: string;           // Denormalized concept name for display
  type: LineType;            // 'suplido' or 'honorario'
  amount: number;
}

export interface EconomicData {
  lines: EconomicLineItem[];
  subtotalAmount: number;
  vatAmount: number;
  totalAmount: number;
}

// --- PHASE 2: PREFIX & CONCEPT MANAGEMENT ---

export type LineType = 'suplido' | 'honorario';

export interface ConceptCatalog {
  id: string;
  name: string;              // e.g., "Notaría", "Tasas DGT", "Gestoría"
  category: LineType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PrefixLine {
  id: string;
  order: number;
  type: LineType;
  conceptId: string;         // References ConceptCatalog
  conceptName: string;       // Denormalized for display
  defaultAmount: number;
  isIncluded: boolean;
}

// PHASE 3: Auto-Save System
export interface Draft {
  id: string;
  fileNumber: string;
  userId: string;
  data: Partial<CaseRecord>;
  lastSaved: string;
  autoSaved: boolean;
  version: number;
}

// PHASE 3: Dashboard Analytics
export interface CaseStats {
  total: number;
  byStatus: Record<string, number>;
  byPrefix: Record<string, number>;
  thisMonth: number;
  lastMonth: number;
  avgProcessingTime: number; // days
}

export interface RevenueStats {
  total: number;
  byPrefix: Record<string, number>;
  thisMonth: number;
  lastMonth: number;
}

export interface TopClient {
  clientId: string;
  clientName: string;
  caseCount: number;
  totalRevenue: number;
}

// PHASE 3: Template Management System
export interface MandateTemplate {
  id: string;
  name: string;
  description?: string;
  prefixId?: string; // null/undefined = global template
  fileUrl: string; // Firebase Storage URL
  fileName: string;
  variables: string[]; // e.g., ['CLIENT_NAME', 'VEHICLE_VIN']
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface PrefixConfig {
  id: string;
  code: string;              // e.g., "GMAT", "FITRI", "FICONTA"
  description: string;       // e.g., "Gestión de Matriculaciones"
  isActive: boolean;
  lines: PrefixLine[];
  createdAt: string;
  updatedAt: string;
}

// --- END PHASE 2 TYPES ---


export interface Vehicle {
  id?: string;
  vin: string;
  brand: string;
  model: string;
  year: string;
  engineSize: string;
  fuelType: string;
}

export interface Communication {
  id: string;
  date: string;
  concept: string;
  authorUserId: string;
}

// --- CONFIGURACIÓN DINÁMICA ---

export type FileCategory = 'GE-MAT' | 'FI-TRI' | 'FI-CONTA';

export interface FieldDefinition {
  id: string;
  label: string;
  options: string[];
}

export interface FileConfig {
  fileType: string; // El subtipo (ej. Matriculación, Trimestre 1)
  category: FileCategory; // La categoría principal (GE-MAT)
  responsibleUserId: string;
  customValues: Record<string, string>; // Valores de los campos dinámicos { "jefatura": "Madrid" }
}

export interface AgencyData {
  name: string;
  cif: string;
  address: string;
  managerName: string;
  managerColegiado: string;
  managerDni: string;
}

export interface AppSettings {
  fileCounter: number;
  generalSavePath: string;
  mandatoBody: string;
  // Datos del despacho (Responsable)
  agency: AgencyData;
  // Configuración de campos dinámicos por categoría
  fieldConfigs: Record<FileCategory, FieldDefinition[]>;
  // Estados configurables del expediente (Situaciones)
  caseStatuses: string[];
  // Tipos de expediente configurables (Categoría -> Lista de Subtipos)
  fileTypes: Record<FileCategory, string[]>;
  // PHASE 2: Mandate configuration
  mandateConfig?: {
    defaultFormat: 'pdf' | 'docx' | 'both';
    templateByPrefix: Record<string, string>; // prefixId -> templateId
    globalTemplate?: string;
  };
}

// --- FIN CONFIGURACIÓN DINÁMICA ---

export interface HermesResponse {
  success: boolean;
  message: string;
  transactionId?: string;
  reportUrl?: string;
}

export type DocumentStatus = 'local' | 'uploading' | 'synced' | 'error';

export interface AttachedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  file?: File;
  status: DocumentStatus;
  url?: string;
}

export interface User {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
}

export interface Task {
  id: string;
  text: string;
  isCompleted: boolean;
  assignedToUserId: string;
  createdByUserId: string;
  createdAt: string;
}

export type CaseStatus = string; // Dinámico

export const DEFAULT_CASE_STATUSES: string[] = [
  'Pendiente Documentación',
  'En Tramitación',
  'Pendiente Pago',
  'Finalizado',
  'Archivado',
  'Eliminado',
];

export const getCaseStatusBadgeColor = (status: string): string => {
  const s = (status || '').toLowerCase();
  if (s.includes('pendiente') || s.includes('documentación')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (s.includes('tramitación') || s.includes('proceso')) return 'bg-sky-100 text-sky-800 border-sky-200';
  if (s.includes('dgt') || s.includes('administración')) return 'bg-purple-100 text-purple-800 border-purple-200';
  if (s.includes('pago') || s.includes('factura')) return 'bg-orange-100 text-orange-800 border-orange-200';
  if (s.includes('finalizado') || s.includes('completado')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (s.includes('archivado') || s.includes('cerrado')) return 'bg-slate-200 text-slate-800 border-slate-300';
  return 'bg-slate-100 text-slate-800 border-slate-200';
};

export const getCaseStatusBorderColor = (status: string): string => {
  // Helper for selects
  const s = (status || '').toLowerCase();
  if (s.includes('pendiente')) return 'border-yellow-300 focus:ring-yellow-500';
  if (s.includes('finalizado')) return 'border-emerald-300 focus:ring-emerald-500';
  return 'border-slate-300 focus:ring-sky-500';
};

export interface CaseRecord {
  fileNumber: string;
  client: Client;
  vehicle: Vehicle;
  fileConfig: FileConfig;
  prefixId?: string;         // PHASE 2: New prefix-based system (optional during migration)
  economicData: EconomicData;
  communications: Communication[];
  status: string;
  attachments: AttachedDocument[];
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface CaseSelection {
  nif: string;
  cases: CaseRecord[];
}

export interface TemplateEconomicLineItem {
  concept: string;
  amount: number;
  included: boolean;
}

export type EconomicTemplates = Record<string, TemplateEconomicLineItem[]>;
