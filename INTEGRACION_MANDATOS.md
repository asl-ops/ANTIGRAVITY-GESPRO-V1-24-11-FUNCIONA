# Integración de Plantilla de Mandatos

## 📋 Resumen

Se han integrado exitosamente los archivos de la carpeta **FICHEROS MANDATO** en el proyecto. Esta implementación proporciona un sistema completo para la configuración y generación de mandatos profesionales.

## 🗂️ Archivos Creados

### 1. **Tipos y Definiciones**
- **`src/types/mandate.ts`**: Define las interfaces para los datos del mandato
  - `MandateData`: Estructura completa del mandato (mandante, mandatario, asunto, firma)
  - `MandatarioConfig`: Configuración del gestor administrativo que se guarda en settings

### 2. **Componentes**
- **`src/components/MandateDocument.tsx`**: Componente React que renderiza el mandato con formato profesional
  - Formato Times New Roman, tamaño A4
  - Campos destacados en azul oscuro
  - Estructura legal completa según normativa
  
- **`src/components/MandateConfiguration.tsx`**: Panel de configuración en el Dashboard del Responsable
  - Formulario para datos del gestor principal
  - Gestor secundario opcional
  - Datos del colegio y despacho
  - Domicilio del despacho

### 3. **Actualizaciones**
- **`src/types/index.ts`**: Añadido campo `mandatarioConfig` a `AppSettings`
- **`src/components/ResponsibleDashboard.tsx`**: Integrado el componente de configuración en la pestaña "Configuración de Mandatos"

## 🎯 Cómo Usar

### Paso 1: Configurar los Datos del Mandatario

1. Accede al **Panel del Responsable** desde el dashboard principal
2. Ve a la pestaña **"Configuración de Mandatos"**
3. Rellena los datos del gestor administrativo:
   - **Gestor Principal**: Nombre, DNI, Nº Colegiado (obligatorios)
   - **Gestor Secundario**: Opcional, para mandatos con dos gestores
   - **Colegio y Despacho**: Nombre del colegio oficial y del despacho
   - **Domicilio**: Dirección completa del despacho
4. Haz clic en **"Guardar Configuración"**

### Paso 2: Generar un Mandato

Los datos configurados se utilizarán automáticamente al generar mandatos desde los expedientes. El sistema:

1. Toma los datos del **cliente** (mandante) del expediente actual
2. Usa los datos del **mandatario** configurados en el Panel del Responsable
3. Incluye el **asunto** específico del expediente
4. Genera el documento con la **fecha y lugar** actuales

## 📊 Estructura de Datos

### MandateData
```typescript
{
  mandante: {
    nombre: string;
    dni: string;
    representante?: { nombre, dni };
    empresa?: string;
    cif?: string;
    domicilio: { poblacion, calle, numero, cp };
  },
  mandatario: {
    nombre_1, dni_1, col_1;
    nombre_2?, dni_2?, col_2?;
    colegio, despacho;
    domicilio: { poblacion, calle, numero, cp };
  },
  asunto: {
    linea_1: string;
    linea_2?: string;
  },
  firma: {
    lugar: string;
    fecha: Date;
  }
}
```

## 🔄 Próximos Pasos (Recomendados)

### 1. Integración con Generación de PDF
Crear un servicio que:
- Use el componente `MandateDocument`
- Convierta el HTML a PDF usando `html2pdf.js` o similar
- Guarde el PDF en Firebase Storage
- Lo adjunte automáticamente al expediente

### 2. Integración en el Flujo de Expedientes
Modificar el componente de detalle del expediente para:
- Añadir un botón "Generar Mandato"
- Abrir un modal para confirmar/editar el asunto
- Generar el PDF automáticamente
- Guardarlo como documento adjunto

### 3. Plantillas Personalizables
Permitir al responsable:
- Crear múltiples plantillas de mandato
- Asociar plantillas específicas a tipos de expediente
- Personalizar el texto legal según necesidades

## 📝 Notas Técnicas

- Los datos del mandatario se guardan en `appSettings.mandatarioConfig`
- El componente `MandateDocument` es reutilizable y puede usarse para vista previa o impresión
- Los estilos están inline para garantizar compatibilidad con generación de PDF
- Los campos variables están destacados en azul oscuro (#00008B) para fácil identificación

## ✅ Estado Actual

- ✅ Tipos definidos
- ✅ Componente de renderizado creado
- ✅ Panel de configuración implementado
- ✅ Integrado en Panel del Responsable
- ⏳ Pendiente: Generación de PDF
- ⏳ Pendiente: Integración en flujo de expedientes
