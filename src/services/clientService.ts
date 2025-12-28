/**
 * Servicio de Gestión de Clientes
 * Adaptado para Firebase Firestore (no REST API)
 */

import { db } from './firebase';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where
} from 'firebase/firestore';
import type {
    Client,
    ClientCreateInput,
    ClientUpdateInput,
    ClientSearchParams,
    ClientSearchResult,
} from '@/types/client';
import { normalizeDocumento, normalizeText, normalizeTelefono, isMostlyNumeric } from '@/utils/normalize';

const clientsCollection = collection(db, 'clients');

/**
 * Busca clientes con filtros inteligentes
 * Soporta búsqueda por nombre, documento, teléfono, email
 * Ordenamiento: documento exacto > empieza por > contiene
 */
export async function searchClients(params: ClientSearchParams): Promise<ClientSearchResult> {
    const {
        q,
        documento,
        nombre,
        telefono,
        email,
        tipo,
        estado = 'ACTIVO', // Por defecto solo activos
        limit = 10,
        offset = 0
    } = params;

    try {
        // Obtener todos los clientes (Firestore no tiene búsqueda "contains" nativa eficiente)
        let clientsQuery = query(clientsCollection);

        // Filtro por estado si está especificado
        if (estado) {
            clientsQuery = query(clientsCollection, where('estado', '==', estado));
        }

        const snapshot = await getDocs(clientsQuery);
        let allClients = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Client));

        // Filtrar en memoria
        let filtered = allClients;

        // Filtro por tipo
        if (tipo) {
            filtered = filtered.filter(c => c.tipo === tipo);
        }

        // Búsqueda general (q)
        if (q && q.trim()) {
            const normalizedQ = normalizeText(q.trim());
            const isNumericSearch = isMostlyNumeric(q);

            filtered = filtered.filter(client => {
                const normalizedNombre = normalizeText(client.nombre || '');
                const normalizedDocumento = normalizeDocumento(client.documento || '');
                const normalizedTelefono = normalizeTelefono(client.telefono || '');
                const normalizedEmail = (client.email || '').toLowerCase();

                // Si es búsqueda numérica, priorizar documento y teléfono
                if (isNumericSearch) {
                    return normalizedDocumento?.includes(normalizedQ) ||
                        normalizedTelefono?.includes(normalizedQ);
                }

                // Búsqueda textual
                return normalizedNombre.includes(normalizedQ) ||
                    normalizedDocumento?.includes(normalizedQ) ||
                    normalizedTelefono?.includes(normalizedQ) ||
                    normalizedEmail.includes(q.toLowerCase());
            });

            // Ordenar resultados por relevancia
            filtered.sort((a, b) => {
                const aNombre = normalizeText(a.nombre || '');
                const bNombre = normalizeText(b.nombre || '');
                const aDoc = normalizeDocumento(a.documento || '') || '';
                const bDoc = normalizeDocumento(b.documento || '') || '';

                // Prioridad 1: Documento exacto
                if (aDoc === normalizedQ) return -1;
                if (bDoc === normalizedQ) return 1;

                // Prioridad 2: Nombre empieza por
                const aStartsWith = aNombre.startsWith(normalizedQ);
                const bStartsWith = bNombre.startsWith(normalizedQ);
                if (aStartsWith && !bStartsWith) return -1;
                if (!aStartsWith && bStartsWith) return 1;

                // Prioridad 3: Documento empieza por
                const aDocStarts = aDoc.startsWith(normalizedQ);
                const bDocStarts = bDoc.startsWith(normalizedQ);
                if (aDocStarts && !bDocStarts) return -1;
                if (!aDocStarts && bDocStarts) return 1;

                // Por defecto: orden alfabético
                return aNombre.localeCompare(bNombre);
            });
        }

        // Filtros específicos
        if (documento) {
            const normDoc = normalizeDocumento(documento);
            filtered = filtered.filter(c =>
                normalizeDocumento(c.documento || '')?.includes(normDoc || '')
            );
        }

        if (nombre) {
            const normNombre = normalizeText(nombre);
            filtered = filtered.filter(c =>
                normalizeText(c.nombre).includes(normNombre)
            );
        }

        if (telefono) {
            const normTel = normalizeTelefono(telefono);
            filtered = filtered.filter(c =>
                normalizeTelefono(c.telefono || '')?.includes(normTel || '')
            );
        }

        if (email) {
            filtered = filtered.filter(c =>
                c.email?.toLowerCase().includes(email.toLowerCase())
            );
        }

        // Paginación
        const total = filtered.length;
        const paginatedItems = filtered.slice(offset, offset + limit);

        return {
            items: paginatedItems,
            total
        };
    } catch (error) {
        console.error('Error searching clients:', error);
        throw new Error('Error al buscar clientes');
    }
}

/**
 * Obtiene un cliente por ID
 */
export async function getClientById(id: string): Promise<Client> {
    try {
        const clientDoc = doc(clientsCollection, id);
        const snapshot = await getDoc(clientDoc);

        if (!snapshot.exists()) {
            throw new Error(`Cliente con ID ${id} no encontrado`);
        }

        return {
            id: snapshot.id,
            ...snapshot.data()
        } as Client;
    } catch (error) {
        console.error('Error getting client by ID:', error);
        throw error;
    }
}

/**
 * Crea un nuevo cliente
 */
export async function createClient(input: ClientCreateInput): Promise<Client> {
    try {
        const now = new Date().toISOString();
        const id = crypto.randomUUID();

        // Construir objeto sin undefined (Firestore no lo acepta)
        const newClient: any = {
            id,
            tipo: input.tipo,
            nombre: normalizeText(input.nombre),
            estado: 'ACTIVO',
            createdAt: now,
            updatedAt: now,
        };

        // Solo añadir campos opcionales si tienen valor
        const normalizedDoc = normalizeDocumento(input.documento);
        if (normalizedDoc) newClient.documento = normalizedDoc;

        if (input.telefono?.trim()) newClient.telefono = input.telefono.trim();
        if (input.email?.trim()) newClient.email = input.email.trim().toLowerCase();
        if (input.direccion?.trim()) newClient.direccion = input.direccion.trim();
        if (input.notas?.trim()) newClient.notas = input.notas.trim();

        const clientDoc = doc(clientsCollection, id);
        await setDoc(clientDoc, newClient);

        return newClient as Client;
    } catch (error) {
        console.error('Error creating client:', error);
        throw new Error('Error al crear cliente');
    }
}

/**
 * Actualiza un cliente existente
 */
export async function updateClient(id: string, input: ClientUpdateInput): Promise<Client> {
    try {
        const clientDoc = doc(clientsCollection, id);
        const snapshot = await getDoc(clientDoc);

        if (!snapshot.exists()) {
            throw new Error(`Cliente con ID ${id} no encontrado`);
        }

        // Construir objeto de actualizaciones sin undefined
        const updates: any = {
            updatedAt: new Date().toISOString(),
        };

        // Solo añadir campos que vengan en el input
        if (input.tipo !== undefined) updates.tipo = input.tipo;
        if (input.nombre !== undefined) {
            updates.nombre = normalizeText(input.nombre);
        }
        if (input.documento !== undefined) {
            const normalized = normalizeDocumento(input.documento);
            if (normalized) updates.documento = normalized;
        }
        if (input.email !== undefined && input.email.trim()) {
            updates.email = input.email.trim().toLowerCase();
        }
        if (input.telefono !== undefined && input.telefono.trim()) {
            updates.telefono = input.telefono.trim();
        }
        if (input.direccion !== undefined && input.direccion.trim()) {
            updates.direccion = input.direccion.trim();
        }
        if (input.notas !== undefined && input.notas.trim()) {
            updates.notas = input.notas.trim();
        }
        if (input.estado !== undefined) updates.estado = input.estado;

        await updateDoc(clientDoc, updates);

        // Retornar cliente actualizado
        const updatedSnapshot = await getDoc(clientDoc);
        return {
            id: updatedSnapshot.id,
            ...updatedSnapshot.data()
        } as Client;
    } catch (error) {
        console.error('Error updating client:', error);
        throw error;
    }
}

/**
 * Desactiva un cliente (no se elimina)
 */
export async function deactivateClient(id: string): Promise<Client> {
    return updateClient(id, { estado: 'INACTIVO' });
}

/**
 * Reactiva un cliente
 */
export async function reactivateClient(id: string): Promise<Client> {
    return updateClient(id, { estado: 'ACTIVO' });
}

/**
 * Obtiene todos los clientes activos (para cargar en contexto)
 */
export async function getActiveClients(): Promise<Client[]> {
    try {
        const q = query(clientsCollection, where('estado', '==', 'ACTIVO'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Client));
    } catch (error) {
        console.error('Error getting active clients:', error);
        return [];
    }
}

/**
 * Obtiene todos los clientes (activos e inactivos)
 */
export async function getAllClients(): Promise<Client[]> {
    try {
        const snapshot = await getDocs(clientsCollection);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Client));
    } catch (error) {
        console.error('Error getting all clients:', error);
        return [];
    }
}

/**
 * Detecta posibles duplicados de un cliente
 * Retorna clientes con documento idéntico o nombre muy similar + teléfono igual
 */
export async function findPossibleDuplicates(client: Client | ClientCreateInput): Promise<Client[]> {
    try {
        const allClients = await getAllClients();
        const duplicates: Client[] = [];

        const normalizedDoc = normalizeDocumento(client.documento || '');
        const normalizedTel = normalizeTelefono(client.telefono || '');

        for (const existing of allClients) {
            // Saltar si es el mismo cliente
            if ('id' in client && existing.id === client.id) continue;

            // Duplicado seguro: mismo documento
            if (normalizedDoc && normalizeDocumento(existing.documento || '') === normalizedDoc) {
                duplicates.push(existing);
                continue;
            }

            // Posible duplicado: nombre similar + mismo teléfono
            if (normalizedTel && normalizeTelefono(existing.telefono || '') === normalizedTel) {
                const nameSimilarity = calculateSimilarity(client.nombre, existing.nombre);
                if (nameSimilarity > 0.8) {
                    duplicates.push(existing);
                }
            }
        }

        return duplicates;
    } catch (error) {
        console.error('Error finding duplicates:', error);
        return [];
    }
}

// Helper: calcular similitud entre nombres
function calculateSimilarity(a: string, b: string): number {
    const normA = normalizeText(a);
    const normB = normalizeText(b);

    if (normA === normB) return 1;

    const longer = normA.length > normB.length ? normA : normB;
    const shorter = normA.length > normB.length ? normB : normA;

    if (longer.length === 0) return 1;

    // Implementación simple: caracteres en común / longitud
    let matches = 0;
    for (const char of shorter) {
        if (longer.includes(char)) matches++;
    }

    return matches / longer.length;
}
