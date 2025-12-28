# 🔧 DEBUGGING: Subida de Plantillas de Mandato

## Problema
La subida de plantillas DOCX se queda en "Subiendo..." y no completa.

## Cambios Realizados

### 1. Mejoras en `templateService.ts`
- ✅ Agregado logging detallado en cada paso de la subida
- ✅ Verificación de que Firebase Storage está inicializado
- ✅ Mensajes de error más específicos según el tipo de fallo
- ✅ Logging de detalles del error (code, message, serverResponse)

### 2. Mejoras en `TemplateManager.tsx`
- ✅ Verificación del estado de autenticación antes de subir
- ✅ Logging detallado del proceso de subida
- ✅ Timeout aumentado de 30s a 60s
- ✅ Mensajes de error con emojis para mejor visualización
- ✅ Validación de que `auth.currentUser` existe antes de subir

## 📋 Instrucciones de Prueba

### Paso 1: Abrir la Consola del Navegador
1. Abre la aplicación en el navegador (localhost:5173)
2. Abre las Herramientas de Desarrollo (F12)
3. Ve a la pestaña "Console"

### Paso 2: Navegar a Plantillas de Mandatos
1. Inicia sesión como Responsable
2. Ve a "Panel del Responsable"
3. Haz clic en "Plantillas de Mandatos"
4. Haz clic en "Nueva Plantilla"

### Paso 3: Intentar Subir una Plantilla
1. Rellena el formulario:
   - Nombre: `Prueba Debug`
   - Descripción: `Test de debugging`
   - Selecciona un archivo DOCX
2. Haz clic en "Subir Plantilla"
3. **IMPORTANTE**: Observa la consola del navegador

### Paso 4: Analizar los Logs

En la consola deberías ver logs como estos:

```
[TemplateManager] Starting upload process... {fileName: "...", templateName: "...", currentUser: "..."}
[TemplateManager] Checking authentication status...
[TemplateManager] User authenticated: xxx
[TemplateManager] Creating template...
[TemplateService] Starting file upload... {fileName: "...", fileSize: xxx, fileType: "..."}
[TemplateService] Creating storage reference: mandate-templates/xxx
[TemplateService] Uploading file...
```

### Paso 5: Identificar el Problema

#### ✅ Si ves `[TemplateService] Upload successful:`
- **La subida funciona correctamente**
- El problema estaba en la configuración de autenticación

#### ❌ Si ves `[TemplateManager] User not authenticated`
- **Problema**: La autenticación anónima no se completó
- **Solución**: Recargar la página y esperar 2-3 segundos antes de subir

#### ❌ Si ves error con `code: "storage/unauthorized"`
- **Problema**: Las reglas de Firebase Storage están bloqueando
- **Solución**: Actualizar las reglas de Storage (ver más abajo)

#### ❌ Si ves error con `code: "storage/unknown"`
- **Problema**: El bucket de Storage no está configurado
- **Solución**: Verificar que Firebase Storage está habilitado en la consola

#### ❌ Si se queda en "Uploading file..." sin avanzar
- **Problema**: Problema de red o CORS
- **Solución**: Ver sección "Soluciones Alternativas"

## 🔍 Logs Esperados (Éxito)

```
[TemplateManager] Starting upload process... {fileName: "mandato.docx", templateName: "Prueba", ...}
[TemplateManager] Checking authentication status...
[TemplateManager] User authenticated: xxxxx
[TemplateManager] Creating template...
[TemplateService] Starting file upload... {fileName: "mandato.docx", fileSize: 15234, ...}
[TemplateService] Creating storage reference: mandate-templates/1733222123456_mandato.docx
[TemplateService] Uploading file...
[TemplateService] Upload successful: mandate-templates/1733222123456_mandato.docx
[TemplateService] Getting download URL...
[TemplateService] Download URL obtained: https://firebasestorage.googleapis.com/...
[TemplateManager] Upload completed successfully
```

## 🔧 Solución de Problemas de Autenticación

Si el problema es que `auth.currentUser` es null:

### Opción 1: Esperar a que se complete la auth
```javascript
// Agregar un pequeño delay antes de permitir subidas
// (Ya implementado en el código con la verificación)
```

### Opción 2: Forzar autenticación antes de abrir el formulario
Modificar `TemplateManager.tsx` para verificar auth al abrir el formulario:

```typescript
const handleShowUploadForm = async () => {
    const { auth, initializeAuth } = await import('@/services/firebase');
    if (!auth.currentUser) {
        await initializeAuth();
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setShowUploadForm(true);
};
```

## 🛠️ Actualizar Reglas de Firebase Storage

Si el problema son las reglas, actualízalas a:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Plantillas de mandato - solo autenticados pueden escribir
    match /mandate-templates/{fileName} {
      allow read: if true;  // Cualquiera puede leer
      allow write: if request.auth != null;  // Solo usuarios autenticados pueden escribir
    }
    
    // Otros archivos - restringido
    match /{allPaths=**} {
      allow read: iffalse;
      allow write: if false;
    }
  }
}
```

## 📊 Verificación Manual de Firebase Storage

Para verificar que Firebase Storage funciona:

1. Ve a la consola de Firebase: https://console.firebase.google.com
2. Selecciona tu proyecto: "gestor-de-expedientes-pro"
3. Ve a "Storage" en el menú lateral
4. Verifica que:
   - El bucket existe: `gestor-de-expedientes-pro.firebasestorage.app`
   - Puedes ver la carpeta `mandate-templates` (si ya subiste archivos)
   - Las reglas están configuradas correctamente

## 🔄 Solución Alternativa: Usar Base64

Si Firebase Storage sigue sin funcionar, podemos cambiar a guardar los archivos en Base64 directamente en Firestore:

**Ventajas:**
- ✅ No depende de Firebase Storage
- ✅ Más simple
- ✅ No requiere configuración adicional

**Desventajas:**
- ⚠️ Límite de ~1MB por archivo (suficiente para la mayoría de plantillas DOCX)

¿Quieres que implemente esta alternativa?

## 📝 Siguiente Paso

**Prueba la subida ahora y comparte:**
1. Los logs completos de la consola del navegador
2. Cualquier mensaje de error que aparezca
3. Una captura de pantalla si es posible

Con esta información sabré exactamente qué está fallando y cómo solucionarlo.
