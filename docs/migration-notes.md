# Notas de Migración - Sistema de Clientes

## Contexto

El sistema de gestión de expedientes ha evolucionado de un modelo con **clientes embebidos** (cada expediente tenía una copia completa del cliente) a un modelo con **clientes centralizados** (referencia por ID + snapshot).

---

## Estado Actual (Post-Fase 4)

### ✅ Implementado

- **Nuevo modelo de datos**: `clienteId` + `clientSnapshot` en `CaseRecord`
- **Componentes UI**: `ClientTypeahead`, `ClientExplorer`, `ClientDetailModal`  
- **Búsqueda inteligente**: Normalización de texto, ranking, debounce
- **Filtrado**: Por `clienteId` en Dashboard
- **Visualización**: Prioridad snapshot → legacy → fallback
- **Alta rápida**: Crear cliente desde formulario de expediente

### ⚠️ Campos Legacy Mantenidos

Los siguientes campos **NO** se han eliminado para garantizar compatibilidad:

```typescript
interface CaseRecord {
  // ... otros campos
  
  client: Client;  // ⚠️ DEPRECADO pero mantenido
}

interface Client {
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
```

**Motivos para mantenerlos:**

1. **Expedientes existentes**: Miles de expedientes en producción usan este formato
2. **Visualización de legacy**: Expedientes antiguos sin `clienteId` aún se pueden mostrar
3. **Rollback seguro**: Si hay problemas, se puede revertir sin pérdida de datos
4. **Migración gradual**: Permite migrar por lotes en lugar de big-bang

---

## Comportamiento de Expedientes Existentes

### Expedientes Antiguos (Pre-Migración)

```typescript
{
  fileNumber: "EXP-0042",
  client: {
    id: "",
    surnames: "GARCÍA LÓPEZ",
    firstName: "JUAN",
    nif: "12345678A",
    // ... otros campos
  },
  // clienteId: undefined (no existe)
  // clientSnapshot: undefined (no existe)
}
```

**Comporta

miento:**
- ✅ Se visualizan correctamente (usa fallback a `client.surnames + client.firstName`)
- ❌ NO aparecen al filtrar por cliente (no tienen `clienteId`)
- ✅ Se pueden editar normalmente
- ⚠️ Al editarlos y seleccionar un cliente, se añaden `clienteId` + `clientSnapshot`

### Expedientes Nuevos (Post-Implementación)

```typescript
{
  fileNumber: "EXP-1234",
  clienteId: "cli_1640000000000",
  clientSnapshot: {
    nombre: "GARCÍA LÓPEZ, JUAN",
    documento: "12345678A",
    telefono: "600123456"
  },
  client: {  // Mantenido por compatibilidad
    id: "cli_1640000000000",
    surnames: "GARCÍA LÓPEZ",
    firstName: "JUAN",
    nif: "12345678A",
    // ... parseado desde snapshot
  }
}
```

**Comportamiento:**
- ✅ Filtrado por cliente funciona
- ✅ Visualización usa snapshot (más rápido)
- ✅ Histórico preservado (aunque se edite el cliente)

---

## Estrategia de Migración Futura

### Fase 6: Migración Masiva (Pendiente)

Cuando se decida migrar los expedientes existentes:

#### 1. Script de Migración

```typescript
async function migrateCase(caseRecord: CaseRecord) {
  // Si ya tiene clienteId, skip
  if (caseRecord.clienteId) return;
  
  const { client } = caseRecord;
  
  // Buscar cliente existente por documento
  let existingClient = await searchClients({
    query: client.nif,
    limit: 1,
    estado: 'ACTIVO'
  });
  
  if (existingClient.length > 0) {
    // Cliente ya existe en sistema nuevo
    caseRecord.clienteId = existingClient[0].id;
    caseRecord.clientSnapshot = {
      nombre: existingClient[0].nombre,
      documento: existingClient[0].documento,
      telefono: existingClient[0].telefono,
      email: existingClient[0].email
    };
  } else {
    // Crear cliente nuevo
    const newClient = await createClient({
      tipo: isLegalEntity(client.nif) ? 'EMPRESA' : 'PARTICULAR',
      nombre: `${client.surnames}, ${client.firstName}`,
      documento: client.nif,
      telefono: client.phone,
      email: client.email,
      direccion: client.address
    });
    
    caseRecord.clienteId = newClient.id;
    caseRecord.clientSnapshot = {
      nombre: newClient.nombre,
      documento: newClient.documento,
      telefono: newClient.telefono,
      email: newClient.email
    };
  }
  
  // Guardar expediente actualizado
  await saveCase(caseRecord);
}
```

#### 2. Ejecución

- **Preparación**: Backup completo de Firestore
- **Batch Processing**: Migrar en lotes de 100-500 expedientes
- **Monitoring**: Log de errores y casos no migrados
- **Rollback Plan**: Script para revertir en caso de problemas

#### 3. Validación Post-Migración

```typescript
// Verificar que todos tienen clienteId
const casesWithoutClientId = await cases.filter(c => !c.clienteId);
console.log(`Expedientes sin migrar: ${casesWithoutClientId.length}`);

// Verificar duplicados de clientes
const clientDocs = new Map();
clients.forEach(c => {
  if (clientDocs.has(c.documento)) {
    console.warn(`Duplicado: ${c.documento}`);
  }
  clientDocs.set(c.documento, c.id);
});
```

---

## Limpieza de Campos Legacy (Post-Migración)

**⚠️ IMPORTANTE**: Solo después de migración completa y validada.

### Paso 1: Dejar de escribir `client` legacy

```typescript
// En handleSaveAndReturn de useCaseManager
const currentCaseData: CaseRecord = {
  fileNumber: finalFileNumber,
  // client,  // ❌ Comentar/eliminar
  clienteId,
  clientSnapshot,
  // ... resto
};
```

### Paso 2: Actualizar tipos para hacer `client` opcional

```typescript
interface CaseRecord {
  fileNumber: string;
  clienteId?: string;
  clientSnapshot?: ClientSnapshot;
  client?: Client;  // Ahora opcional
  // ...
}
```

### Paso 3: Actualizar visualización para no depender de `client`

```typescript
// Eliminar fallback a client legacy
const displayName = case.clientSnapshot?.nombre || '—';
```

### Paso 4: Script de limpieza (opcional)

```typescript
// Eliminar campo client de todos los documentos
async function cleanupLegacyField() {
  const batch = firestore.batch();
  
  const snapshot = await firestore.collection('cases').get();
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, {
      client: firebase.firestore.FieldValue.delete()
    });
  });
  
  await batch.commit();
}
```

---

## Reglas de Retrocompatibilidad

### ✅ SIEMPRE Cumplir

1. **Lectura**: Código nuevo DEBE poder leer expedientes antiguos
2. **Visualización**: Mostrar datos aunque no tengan `clienteId`
3. **Edición**: Al editar expediente antiguo, añadir `clienteId` si se selecciona cliente
4. **No Breaking**: Nunca eliminar campos sin migración previa

### ❌ NUNCA Hacer

1. Eliminar campo `client` antes de migración completa
2. Asumir que `clienteId` siempre existe
3. Hacer filtros que rompan con datos legacy
4. Modificar formato de snapshot sin versioning

---

## Casos Edge y Soluciones

### Caso 1: Cliente Editado después de Snapshot

**Problema**: Cliente cambia nombre, expediente muestra nombre antiguo.

**Solución Actual**: Mantener snapshot (histórico preservado)

**Alternativa Futura**: 
- Añadir botón "Actualizar snapshot desde cliente actual"
- Sincronización automática configurable

### Caso 2: Cliente Duplicado

**Problema**: Mismo documento en múltiples registros de cliente.

**Solución**:
1. Detectar al crear (ya implementado en `clientService.ts`)
2. Herramienta de merge de clientes (Fase 6)

### Caso 3: Expediente sin Cliente

**Problema**: Expediente creado sin seleccionar cliente.

**Solución**:
- `clienteId: null`
- `clientSnapshot: null`
- `client: { id: '', surnames: '', ... }` (objeto vacío para compatibilidad)

---

## Checklist de Migración (Cuando se Ejecute)

- [ ] Backup completo de Firestore
- [ ] Script de migración testeado en desarrollo
- [ ] Plan de rollback documentado
- [ ] Batch size configurado (100-500)
- [ ] Logging y monitoring activos
- [ ] Validación post-migración preparada
- [ ] Comunicación a usuarios sobre mantenimiento
- [ ] Ejecución en horario de baja actividad
- [ ] Validación de resultados
- [ ] Monitoreo de errores 24h post-migración

---

## Contacto y Soporte

Para dudas sobre la migración, consultar:
- Documentación: [client-system.md](./client-system.md)
- Código: `/src/services/clientService.ts`
- Issues: Abrir en repositorio del proyecto

---

## Changelog

- **2025-12-28**: Implementación Fases 1-4 (backend + UI + integración)
- **Pendiente**: Fase 6 - Migración masiva de datos existentes
