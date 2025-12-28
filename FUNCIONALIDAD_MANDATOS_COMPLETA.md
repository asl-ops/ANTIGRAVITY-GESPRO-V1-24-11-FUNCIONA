# ✅ Funcionalidad de Mandatos Completada

## 🎉 Resumen de Implementación

Se ha completado exitosamente la integración completa del sistema de generación de mandatos en PDF. El sistema ahora permite:

1. ✅ Configurar datos del mandatario en el Panel del Responsable
2. ✅ Generar mandatos profesionales en PDF desde cualquier expediente
3. ✅ Vista previa del mandato antes de generarlo
4. ✅ Guardado automático del PDF en Firebase Storage
5. ✅ Adjuntar el mandato generado al expediente

---

## 📦 Archivos Creados/Modificados

### Nuevos Archivos

1. **`src/types/mandate.ts`**
   - Definiciones de tipos para mandatos
   - `MandateData`: Estructura completa del mandato
   - `MandatarioConfig`: Configuración del gestor

2. **`src/components/MandateDocument.tsx`**
   - Componente de renderizado del mandato
   - Formato profesional con Times New Roman
   - Campos variables destacados

3. **`src/components/MandateConfiguration.tsx`**
   - Panel de configuración en Dashboard del Responsable
   - Formulario completo para datos del mandatario

4. **`src/components/GenerateMandateModal.tsx`**
   - Modal mejorado para generación de mandatos
   - Vista previa integrada
   - Edición de asunto del mandato

5. **`src/services/mandateService.ts`**
   - Servicio de generación de PDF
   - Preparación de datos del mandato
   - Utilidades para nombres de archivo

### Archivos Modificados

1. **`src/types/index.ts`**
   - Añadido `mandatarioConfig` a `AppSettings`

2. **`src/components/ResponsibleDashboard.tsx`**
   - Integrado componente `MandateConfiguration`

3. **`src/components/CaseDetailView.tsx`**
   - Reemplazado sistema antiguo de mandatos
   - Integrado nuevo modal `GenerateMandateModal`
   - Añadida lógica de generación y guardado de PDF

---

## 🚀 Cómo Usar

### Paso 1: Configurar el Mandatario (Una sola vez)

1. Accede al **Panel del Responsable** desde el dashboard
2. Ve a la pestaña **"Configuración de Mandatos"**
3. Rellena los datos:
   
   **Gestor Principal** (obligatorio):
   - Nombre completo
   - DNI
   - Número de colegiado
   
   **Gestor Secundario** (opcional):
   - Para mandatos con dos gestores
   
   **Colegio y Despacho**:
   - Nombre del colegio oficial (ej: "Madrid")
   - Nombre del despacho
   
   **Domicilio del Despacho**:
   - Población, calle, número, código postal

4. Haz clic en **"Guardar Configuración"**

### Paso 2: Generar un Mandato desde un Expediente

1. Abre cualquier expediente
2. En la sección **"Configuración del Expediente"**, haz clic en **"Generar Mandato"**
3. Se abrirá un modal con:
   - Datos del cliente (mandante)
   - Asunto del mandato (editable)
   - Botón para mostrar/ocultar vista previa

4. Edita el asunto si es necesario:
   - **Línea 1**: Asunto principal (obligatorio)
   - **Línea 2**: Información adicional (opcional)

5. Haz clic en **"Mostrar Vista Previa"** para ver cómo quedará el mandato

6. Haz clic en **"Generar PDF"**

7. El sistema:
   - Genera el PDF del mandato
   - Lo sube a Firebase Storage
   - Lo añade automáticamente como documento adjunto al expediente
   - Muestra un mensaje de confirmación

---

## 📄 Estructura del Mandato Generado

El mandato incluye:

### Datos del Mandante (Cliente)
- Nombre completo
- DNI/NIF
- Domicilio completo (calle, número, población, CP)
- Representante (si aplica)
- Empresa representada (si aplica)

### Datos del Mandatario (Gestor)
- Gestor principal: nombre, DNI, nº colegiado
- Gestor secundario: nombre, DNI, nº colegiado (si está configurado)
- Colegio oficial
- Nombre del despacho
- Domicilio del despacho

### Asunto
- Descripción detallada del trámite a realizar
- Línea adicional para información complementaria

### Firma
- Lugar de firma (ciudad del cliente)
- Fecha actual (día, mes, año)
- Espacios para firmas del mandante y mandatario

### Marco Legal
- Artículos 1709-1739 del Código Civil
- Ley 39/2015 del Procedimiento Administrativo Común
- Decreto 424/1963 del Estatuto de Gestor Administrativo

---

## 🔧 Características Técnicas

### Generación de PDF
- Usa `html2pdf.js` para conversión HTML a PDF
- Formato A4 vertical
- Márgenes de 10mm
- Alta calidad (escala 2x)
- Tipografía Times New Roman (estándar legal)

### Almacenamiento
- PDFs guardados en Firebase Storage
- Ruta: `mandates/{fileNumber}/{fileName}`
- Formato de nombre: `Mandato_{ClientName}_{FileNumber}_{Date}.pdf`

### Integración con Expedientes
- Mandatos adjuntados automáticamente
- Visibles en la sección de documentos adjuntos
- Descargables desde el expediente
- URL permanente en Firebase Storage

---

## 📊 Flujo de Datos

```
1. Usuario abre expediente
   ↓
2. Click en "Generar Mandato"
   ↓
3. Sistema prepara datos:
   - Cliente del expediente → Mandante
   - Config del responsable → Mandatario
   - Tipo de expediente → Asunto predefinido
   ↓
4. Modal muestra vista previa
   ↓
5. Usuario edita asunto (opcional)
   ↓
6. Usuario genera PDF
   ↓
7. Sistema:
   - Renderiza MandateDocument
   - Convierte a PDF
   - Sube a Firebase Storage
   - Añade a attachments del expediente
   ↓
8. Confirmación al usuario
```

---

## 🎨 Personalización

### Asuntos Predefinidos por Tipo de Expediente

El sistema incluye asuntos predefinidos según el tipo:

- **Transferencia**: "CAMBIO DE TITULARIDAD VEHICULO, PAGO IMPUESTO DE TRANSMISIONES"
- **Matriculación Nacional**: "MATRICULACIÓN VEHÍCULO NACIONAL"
- **Importación UE**: "MATRICULACIÓN VEHÍCULO IMPORTACIÓN UE"
- **Duplicado Permiso**: "DUPLICADO PERMISO DE CIRCULACIÓN"
- **Baja Definitiva**: "BAJA DEFINITIVA DEL VEHÍCULO"
- **Informe DGT**: "SOLICITUD INFORME DE TRÁFICO"

Estos se pueden editar antes de generar el mandato.

---

## 🔐 Seguridad y Validaciones

- ✅ Validación de configuración del mandatario antes de generar
- ✅ Mensaje de error si no hay configuración
- ✅ Validación de asunto obligatorio
- ✅ Subida segura a Firebase Storage
- ✅ URLs permanentes y seguras

---

## 📝 Notas Importantes

1. **Primera vez**: Debes configurar los datos del mandatario en el Panel del Responsable antes de poder generar mandatos.

2. **Múltiples gestores**: Si trabajas con un gestor secundario, rellena sus datos en la configuración. Aparecerán automáticamente en todos los mandatos.

3. **Edición de asuntos**: Aunque hay asuntos predefinidos, siempre puedes editarlos antes de generar el PDF.

4. **Vista previa**: Usa la vista previa para verificar que todo está correcto antes de generar el PDF final.

5. **Almacenamiento**: Los PDFs se guardan permanentemente en Firebase Storage y se adjuntan al expediente.

---

## ✅ Checklist de Funcionalidad

- ✅ Configuración de mandatario en Panel del Responsable
- ✅ Generación de PDF desde expedientes
- ✅ Vista previa del mandato
- ✅ Edición de asunto
- ✅ Guardado en Firebase Storage
- ✅ Adjuntar automáticamente al expediente
- ✅ Formato profesional y legal
- ✅ Datos del cliente automáticos
- ✅ Fecha y lugar automáticos
- ✅ Soporte para representantes y empresas
- ✅ Soporte para gestor secundario
- ✅ Validaciones y mensajes de error
- ✅ Compilación sin errores

---

## 🎯 Próximas Mejoras Sugeridas

1. **Plantillas múltiples**: Permitir crear diferentes plantillas de mandato según el tipo de trámite

2. **Firma digital**: Integrar sistema de firma digital en los mandatos

3. **Envío por email**: Añadir opción para enviar el mandato por email al cliente

4. **Historial de mandatos**: Panel para ver todos los mandatos generados

5. **Edición de texto legal**: Permitir personalizar el texto legal del mandato

---

## 📞 Soporte

Si encuentras algún problema:

1. Verifica que has configurado el mandatario en el Panel del Responsable
2. Comprueba que el cliente tiene todos los datos necesarios
3. Revisa la consola del navegador para errores
4. Verifica la conexión con Firebase Storage

---

**¡Sistema de Mandatos Completamente Funcional! 🎉**
