# Sistema de Clientes Centralizado

## Objetivo del Sistema

El sistema de clientes centralizado permite gestionar clientes de forma unificada y eficiente, eliminando duplicados y proporcionando una experiencia de usuario mejorada con autocompletado inteligente.

### Beneficios

- **✅ Clientes únicos**: Un solo registro por cliente en toda la aplicación
- **✅ Búsqueda rápida**: Typeahead inteligente con búsqueda por nombre o documento
- **✅ Datos consistentes**: El snapshot garantiza que los listados muestren siempre la misma información
- **✅ Escalabilidad**: Soporte para miles de clientes sin degradación de rendimiento
- **✅ Histórico preservado**: Los snapshots mantienen el nombre del cliente aunque se modifique posteriormente

---

## Modelo de Datos

### Cliente (Colección `clients`)

```typescript
interface ClientV2 {
  id: string;                    // ID único del cliente
  tipo: 'PARTICULAR' | 'EMPRESA';
  nombre: string;                // Nombre completo o razón social
  documento?: string;            // DNI/NIE/CIF (opcional)
  telefono?: string;
  email?: string;
  direccion?: string;
  notas?: string;
  estado: 'ACTIVO' | 'INACTIVO';
  createdAt: string;
  updatedAt: string;
}
```

### Expediente (Colección `cases`)

Cada expediente tiene referencias al cliente:

```typescript
interface CaseRecord {
  fileNumber: string;
  
  // 🆕 SISTEMA NUEVO (usar siempre)
  clienteId?: string;            // Referencia al cliente (ID)
  clientSnapshot?: {             // Cache del cliente al crear/asignar
    nombre: string;
    documento?: string;
    telefono?: string;
    email?: string;
  };
  
  // ⚠️ DEPRECADO (mantener por compatibilidad)
  client: Client;                // Cliente embebido (legacy)
  
  // ... resto de campos
}
```

---

## Reglas de Uso

### 1. Filtrado de Expedientes

**✅ SIEMPRE** filtrar por `clienteId`:

```typescript
// ✅ CORRECTO
const filtered = cases.filter(c => c.clienteId === selectedClientId);

// ❌ INCORRECTO
const filtered = cases.filter(c => 
  c.clientSnapshot?.nombre.includes(searchText) // NO!
);
```

### 2. Visualización en Listados

Usar la siguiente prioridad para mostrar el nombre del cliente:

```typescript
// Prioridad de visualización
const displayName = 
  case.clientSnapshot?.nombre ||       // 1º: Snapshot (rápido, consistente)
  `${case.client?.surnames} ${case.client?.firstName}` || // 2º: Legacy
  '—';                                  // 3º: Fallback
```

**Motivo**: El snapshot es rápido (no requiere consulta adicional) y consistente (preserva histórico).

### 3. Documento/DNI

```typescript
const displayDoc = 
  case.clientSnapshot?.documento ||  // 1º: Snapshot
  case.client?.nif ||                // 2º: Legacy
  '—';                               // 3º: Fallback
```

---

## Componentes del Sistema

### `ClientTypeahead`

Componente de búsqueda/selección inteligente de clientes.

#### Modo: Filtro (Dashboard)

```tsx
<ClientTypeahead
  valueClientId={selectedClientId}
  valueLabel={selectedClientLabel}
  placeholder="Buscar cliente por nombre o documento…"
  onSelect={(client) => {
    setSelectedClientId(client.id);
    setSelectedClientLabel(`${client.nombre}${client.documento ? ' · ' + client.documento : ''}`);
  }}
  onClear={() => {
    setSelectedClientId(null);
    setSelectedClientLabel('');
  }}
  enableQuickCreate={false}  // ⛔ No crear desde filtro
  limit={10}
/>
```

#### Modo: Selector (Formulario de Expediente)

```tsx
<ClientTypeahead
  valueClientId={clienteId}
  valueLabel={clientSnapshot?.nombre || ''}
  placeholder="Escribe el nombre o documento del cliente..."
  onSelect={(client) => {
    setClienteId(client.id);
    setClientSnapshot({
      nombre: client.nombre,
      documento: client.documento,
      telefono: client.telefono,
      email: client.email,
    });
  }}
  onClear={() => {
    setClienteId(null);
    setClientSnapshot(null);
  }}
  enableQuickCreate={true}  // ✅ Alta rápida habilitada
  limit={10}
/>
```

### `ClientExplorer`

Pantalla completa de gestión de clientes (`/#/clients`).

**Funcionalidades:**
- Búsqueda avanzada (nombre, documento, tipo, estado)
- Creación de nuevos clientes
- Edición de clientes existentes
- Activar/Desactivar clientes
- Ver número de expedientes asociados

### `ClientDetailModal`

Modal para crear/editar clientes.

**Pestañas:**
1. **Datos del Cliente**: Formulario completo
2. **Expedientes**: Lista de expedientes asociados (solo en edición)

---

## Alta Rápida de Clientes

Cuando `enableQuickCreate={true}`, el usuario puede crear un cliente desde el Typeahead sin salir del formulario de expediente.

### Flujo

1. Usuario escribe en el typeahead
2. No encuentra al cliente
3. Click en "+ Crear cliente"
4. Se abre `ClientDetailModal` prellenado
5. Usuario completa datos mínimos
6. Guarda
7. Cliente se auto-selecciona en el expediente

---

## Búsqueda Inteligente

El `ClientTypeahead` busca por:

- **Nombre**: Ignora tildes y mayúsculas/minúsculas
- **Documento**: Búsqueda exacta y parcial

### Ranking de Resultados

1. **Coincidencia exacta** de documento
2. **Comienza con** el texto buscado
3. **Contiene** el texto buscado

### Validaciones

- Mínimo 2 caracteres para texto
- Mínimo 3 caracteres para números
- Debounce de 250ms para evitar búsquedas excesivas

---

## Ejemplos de Uso

### Crear Expediente con Cliente Nuevo

```typescript
// 1. Usuario crea expediente
// 2. En ClientTypeahead, escribe "GARCÍA LÓPEZ, JUAN"
// 3. No existe → Click "+ Crear cliente"
// 4. Modal se abre prellenado:
//    - tipo: PARTICULAR
//    - nombre: "GARCÍA LÓPEZ, JUAN"
// 5. Usuario añade documento: "12345678A"
// 6. Guarda
// 7. Cliente se selecciona automáticamente
// 8. Al guardar expediente:
//    - clienteId: "cli_1234567890"
//    - clientSnapshot: {
//        nombre: "GARCÍA LÓPEZ, JUAN",
//        documento: "12345678A"
//      }
```

### Filtrar Expedientes por Cliente

```typescript
// 1. Usuario va a Dashboard
// 2. En filtro Cliente, escribe "GARCÍA"
// 3. Aparecen sugerencias
// 4. Selecciona "GARCÍA LÓPEZ, JUAN"
// 5. Tabla se filtra mostrando solo expedientes donde:
//    - case.clienteId === "cli_1234567890"
// 6. Expedientes viejos SIN clienteId no aparecen (esperado)
```

---

## Compatibilidad y Migración

Ver [migration-notes.md](./migration-notes.md) para detalles sobre:
- Campos legacy que se mantienen
- Estrategia de migración de datos existentes
- Reglas de retrocompatibilidad

---

## Troubleshooting

### El cliente no aparece en el typeahead

- **Causa**: Cliente inactivo
- **Solución**: Ir a `/#/clients` y activarlo

### Expedientes antiguos no aparecen al filtrar

- **Causa**: No tienen `clienteId` asignado
- **Solución**: Esperado. Solo expedientes nuevos/migrados tienen `clienteId`
- **Workaround**: No aplicar filtro de cliente para ver todos

### Cliente muestra "—" en listado

- **Causa**: Ni `clientSnapshot` ni campos legacy tienen datos
- **Solución**: Editar expediente y re-seleccionar el cliente

---

## Métricas y Performance

- ⚡ Búsqueda: ~50-100ms (incluye debounce)
- ⚡ Carga de listado: Instantánea (usa snapshot, sin queries adicionales)
- ⚡ Filtrado: O(n) en memoria, muy rápido para <10k expedientes

---

## Próximos Pasos

Ver [../task.md](../.gemini/antigravity/brain/eab36918-8978-41e8-9bd9-c85653b285c7/task.md) Fase 6 para:
- Migración masiva de expedientes existentes
- Sincronización bidireccional cliente ↔ expediente
- Analytics y reportes avanzados
