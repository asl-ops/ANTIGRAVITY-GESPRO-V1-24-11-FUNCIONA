# 🎉 PROBLEMA RESUELTO - Bucket Incorrecto

## ✅ Cambio Realizado

**ANTES (Incorrecto):**
```
storageBucket: "gestor-expedientes-pro.appspot.com"
```

**DESPUÉS (Correcto):**
```
storageBucket: "gestor-de-expedientes-pro.firebasestorage.app"
```

## 🔍 Por Qué Fallaba

1. **Bucket inexistente**: `gestor-expedientes-pro.appspot.com` no existe
2. **CORS error**: El preflight OPTIONS fallaba porque no había servidor respondiendo
3. **net::ERR_FAILED**: Firebase no podía conectar con un bucket que no existe

## 📋 Reglas de Firebase Storage Recomendadas

Para permitir que usuarios autenticados suban plantillas, actualiza las reglas en Firebase Console:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Plantillas de mandato - solo usuarios autenticados pueden escribir
    match /mandate-templates/{fileName} {
      allow read: if true;  // Lectura pública
      allow write: if request.auth != null;  // Solo autenticados pueden escribir
    }
    
    // Por defecto, denegar acceso a otros paths
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### Cómo Actualizar las Reglas:

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto: **gestor-de-expedientes-pro**
3. Ve a **Storage** en el menú lateral
4. Click en la pestaña **Reglas** (Rules)
5. Reemplaza las reglas actuales con las de arriba
6. Click en **Publicar** (Publish)

## 🧪 Cómo Probar

1. **Recarga la aplicación** en el navegador (Ctrl+R o Cmd+R)
2. Navega a: **Panel del Responsable** → **Plantillas de Mandatos**
3. Click en **Nueva Plantilla**
4. Rellena el formulario:
   - Nombre: `Prueba Final`
   - Descripción: `Test después del fix`
   - Selecciona un archivo DOCX
5. Click en **Subir Plantilla**

## ✅ Resultado Esperado

Deberías ver en la consola:
```
[TemplateManager] Starting upload process...
[TemplateManager] User authenticated: xxxxx
[TemplateService] Starting file upload...
[TemplateService] Creating storage reference: mandate-templates/...
[TemplateService] Uploading file...
[TemplateService] Upload successful: mandate-templates/...
[TemplateService] Download URL obtained: https://firebasestorage.googleapis.com/v0/b/gestor-de-expedientes-pro.firebasestorage.app/...
[TemplateManager] Upload completed successfully
✅ Plantilla creada exitosamente
```

Y la plantilla aparecerá en la lista.

## 🚨 Si Aún Aparece Error de Permisos

Si ves el error `storage/unauthorized`, significa que las reglas están muy restrictivas. 

**Opción temporal para testing** (SOLO para desarrollo):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;  // TEMPORAL - solo para debugging
    }
  }
}
```

⚠️ **IMPORTANTE**: Esto permite que cualquiera suba archivos. Úsalo solo para confirmar que funciona, luego vuelve a las reglas restrictivas.

## 📊 Verificación de Bucket en Firebase Console

Para confirmar que el bucket existe:

1. Ve a Firebase Console → Storage
2. Verifica que el nombre del bucket sea: `gestor-de-expedientes-pro.firebasestorage.app`
3. Si ves un bucket diferente, cópialo y actualiza `firebase.config.ts` con ese nombre exacto

## 🎯 Estado Actual

- ✅ Configuración de Firebase actualizada
- ✅ Servidor reiniciado con nueva configuración
- ✅ Logging detallado habilitado
- ⏳ **PENDIENTE**: Probar subida de plantilla
- ⏳ **PENDIENTE**: Actualizar reglas de Storage si es necesario

---

**¡El fix principal está hecho!** Ahora prueba subir una plantilla y avísame si funciona o si necesitas ajustar las reglas de Storage. 🚀
