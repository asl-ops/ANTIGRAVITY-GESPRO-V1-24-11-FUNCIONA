# 🧭 Sistema de Navegación - Gestor de Expedientes Pro

## Estructura de Navegación

```
┌─────────────────────────────────────────────────────┐
│           DASHBOARD PRINCIPAL (/)                    │
│  ┌──────────────────────────────────────────────┐  │
│  │ • Explorador de Expedientes                   │  │
│  │ • Vista Grid/Lista                            │  │
│  │ • Filtros y búsqueda                          │  │
│  │ • Acciones por lotes                          │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  Botones de navegación:                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │ + Nuevo      │  │ Panel        │  │ Informes │ │
│  │ Expediente   │  │ Responsable  │  │          │ │
│  └──────────────┘  └──────────────┘  └──────────┘ │
└─────────────────────────────────────────────────────┘
         │                   │                │
         │                   │                │
         ▼                   ▼                ▼
┌─────────────────┐  ┌─────────────┐  ┌──────────────┐
│ DETALLE         │  │ PANEL       │  │ MÓDULO       │
│ EXPEDIENTE      │  │ RESPONSABLE │  │ INFORMES     │
│                 │  │             │  │              │
│ ┌─────────────┐ │  │ Tabs:       │  │ Categorías:  │
│ │ ← Volver    │ │  │ • Despacho  │  │ • Básicos    │
│ └─────────────┘ │  │ • Prefijos  │  │ • Avanzados  │
│                 │  │ • Conceptos │  │ • Control    │
│ Secciones:      │  │ • Plantillas│  │ • Económicos │
│ • Cliente       │  │ • Analítica │  │ • Analítica  │
│ • Vehículo      │  │             │  │              │
│ • Económico     │  │ ┌─────────┐ │  │ ┌──────────┐ │
│ • Tareas        │  │ │ ← Volver│ │  │ │ × Cerrar │ │
│ • Comunicación  │  │ │Dashboard│ │  │ └──────────┘ │
│ • Documentos    │  │ └─────────┘ │  │              │
│                 │  └─────────────┘  │ Exportar:    │
│ ┌─────────────┐ │                   │ • Excel      │
│ │ Guardar y   │ │                   │ • PDF        │
│ │ Volver      │ │                   └──────────────┘
│ └─────────────┘ │
└─────────────────┘
```

## Flujos de Navegación

### 1. Gestión de Expedientes
```
Dashboard → Nuevo Expediente → Detalle → [Guardar y Volver] → Dashboard
Dashboard → Seleccionar Expediente → Detalle → [← Volver] → Dashboard
```

### 2. Configuración
```
Dashboard → Panel Responsable → [← Volver al Dashboard] → Dashboard
```

### 3. Informes
```
Dashboard → Informes → [× Cerrar] → Dashboard
```

## Botones de Navegación por Pantalla

| Pantalla | Botón | Acción | Destino |
|----------|-------|--------|---------|
| **Dashboard** | - | Pantalla inicial | - |
| **Detalle Expediente** | ← Volver | Vuelve sin guardar | Dashboard |
| **Detalle Expediente** | Guardar y Volver | Guarda y vuelve | Dashboard |
| **Panel Responsable** | ← Volver al Dashboard | Regresa | Dashboard |
| **Módulo Informes** | × Cerrar | Cierra modal | Dashboard |
| **Panel Tareas** | ← Volver | Regresa | Dashboard |

## Características de Navegación

✅ **Todas las pantallas tienen salida**: Ninguna pantalla deja al usuario atrapado
✅ **Navegación consistente**: Los botones "Volver" están siempre en la misma posición (arriba izquierda)
✅ **Feedback visual**: Iconos claros (← para volver, × para cerrar)
✅ **Confirmación cuando necesario**: Modales piden confirmación antes de acciones destructivas
✅ **Estado preservado**: Al volver, los filtros y selecciones se mantienen

## Atajos de Teclado (Futuro)

- `Esc`: Cerrar modales / Volver
- `Ctrl + S`: Guardar
- `Ctrl + N`: Nuevo expediente
- `Ctrl + I`: Abrir informes

## Notas Técnicas

- Usa `useHashRouter` para gestión de rutas
- `navigateTo('/')` siempre vuelve al Dashboard
- Los modales usan `onClose` para cerrar
- Las vistas principales usan `onReturnToDashboard`
