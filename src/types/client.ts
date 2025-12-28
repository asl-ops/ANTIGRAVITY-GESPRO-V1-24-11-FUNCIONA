/**
 * Sistema de Gestión de Clientes
 * Tipos centralizados para evitar duplicación en expedientes
 */

export type ClientType = "PARTICULAR" | "EMPRESA";
export type ClientStatus = "ACTIVO" | "INACTIVO";

export interface Client {
  id: string;

  tipo: ClientType;
  nombre: string;           // Particular: "APELLIDOS, NOMBRE" / Empresa: "RAZON SOCIAL"
  documento?: string;       // DNI/NIE/CIF (normalizado en mayúsculas)
  telefono?: string;
  email?: string;
  direccion?: string;
  notas?: string;

  estado: ClientStatus;

  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface ClientCreateInput {
  tipo: ClientType;
  nombre: string;
  documento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  notas?: string;
}

export interface ClientUpdateInput extends Partial<ClientCreateInput> {
  estado?: ClientStatus;
}

export interface ClientSearchParams {
  q?: string;              // caja única (nombre/doc/tel/email)
  documento?: string;
  nombre?: string;
  telefono?: string;
  email?: string;
  tipo?: ClientType;
  estado?: ClientStatus;
  limit?: number;
  offset?: number;
}

export interface ClientSearchResult {
  items: Client[];
  total: number;
}

/**
 * Snapshot de cliente para mantener en el expediente
 * Esto preserva el histórico si el cliente cambia datos
 */
export interface ClientSnapshot {
  nombre: string;
  documento?: string | null;
  telefono?: string | null;
}
