# Configuración de Firebase Storage para Plantillas de Mandatos

## Problema
El botón "Subiendo..." se queda atascado al intentar subir una plantilla de mandato.

## Soluciones Implementadas

### 1. Timeout de 30 segundos
- Ahora la subida tiene un tiempo máximo de espera de 30 segundos
- Si se excede este tiempo, se muestra un error específico
- Evita que el botón se quede "Subiendo..." indefinidamente

### 2. Mensajes de Error Mejorados
El sistema ahora muestra mensajes específicos para diferentes tipos de errores:
- **Timeout**: "La subida está tardando demasiado. Verifica tu conexión a Internet."
- **Permisos**: "Error: No tienes permisos para subir archivos. Contacta al administrador."
- **Red**: "Error de red. Verifica tu conexión a Internet."
- **Otros**: Muestra el mensaje de error específico

### 3. Garantía de Reset del Estado
El bloque `finally` garantiza que `setUploading(false)` se ejecuta SIEMPRE, incluso si hay errores.

## Reglas de Firebase Storage Necesarias

Para que las subidas funcionen, necesitas configurar las siguientes reglas en Firebase Storage:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Reglas para plantillas de mandatos
    match /mandate-templates/{fileName} {
      // Permitir lectura a usuarios autenticados
      allow read: if request.auth != null;
      
      // Permitir escritura solo a usuarios autenticados
      // y solo archivos DOCX menores de 10MB
      allow write: if request.auth != null
                   && request.resource.size < 10 * 1024 * 1024
                   && request.resource.contentType == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
    
    // Denegar todo lo demás
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## Cómo Aplicar las Reglas

1. Ve a la consola de Firebase: https://console.firebase.google.com
2. Selecciona tu proyecto
3. En el menú lateral, ve a **Storage**
4. Haz clic en la pestaña **Rules**
5. Copia y pega las reglas anteriores
6. Haz clic en **Publish** (Publicar)

## Verificación

Después de aplicar las reglas, la subida de plantillas debería funcionar correctamente:
- ✅ El botón "Subiendo..." aparece durante la subida
- ✅ Si hay un error, se muestra un mensaje específico
- ✅ El botón siempre vuelve a su estado normal
- ✅ No se queda atascado indefinidamente

## Debugging

Si el problema persiste, abre la consola del navegador (F12) y verifica:
1. Mensajes de error en la pestaña "Console"
2. Solicitudes de red en la pestaña "Network"
3. Busca errores relacionados con "storage" o "firebase"
