# 🔧 Solución al Error de OCR - Gemini API

**Fecha:** 27 de noviembre de 2025  
**Problema:** Los botones "Leer Documento (OCR)" y "Leer Ficha Técnica (OCR)" daban error

---

## 📋 Resumen del Problema

El sistema OCR no funcionaba debido a **DOS problemas**:

### 1️⃣ **API Key Inválida o Placeholder**
- **Síntoma:** Error "API Key not valid" o "API Key no configurada"
- **Causa:** El archivo `.env.local` contenía una clave de ejemplo (`PLACEHOLDER_KEY`) en lugar de una clave real de Google AI

### 2️⃣ **Modelo de Gemini Obsoleto**
- **Síntoma:** Error `404 - models/gemini-1.5-flash is not found for API version v1beta`
- **Causa:** Google actualizó sus modelos y `gemini-1.5-flash` ya no está disponible

---

## ✅ Solución Aplicada

### **Paso 1: Configurar la API Key Real**

**Archivo:** `.env.local` (en la raíz del proyecto)

```properties
VITE_API_KEY=AIzaSyDrSXianoQlex_q5bfU65EkCNpJ1m-u144
VITE_GEMINI_API_KEY=AIzaSyDrSXianoQlex_q5bfU65EkCNpJ1m-u144
```

> ⚠️ **Importante:** Ambas líneas son necesarias porque el código busca ambos nombres de variable.

**Cómo obtener una API Key:**
1. Ir a [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Crear una nueva API Key (es gratuita)
3. Copiar la clave que empieza por `AIza...`

---

### **Paso 2: Actualizar el Modelo de Gemini**

**Archivo modificado:** `src/services/geminiService.ts`

**Cambio realizado:**
```typescript
// ❌ ANTES (modelo obsoleto)
model: "gemini-1.5-flash"

// ✅ DESPUÉS (modelo actual)
model: "gemini-2.0-flash-exp"
```

**Funciones actualizadas:**
- `extractDataFromImage()` - Extrae datos de DNI/CIF
- `extractVehicleDataFromImage()` - Extrae datos de ficha técnica
- `classifyAndRenameDocument()` - Clasifica documentos
- `getGroundedAnswer()` - Asistente de consultas
- `summarizeCommunications()` - Resume comunicaciones
- `draftCommunication()` - Redacta emails
- `suggestTasks()` - Sugiere tareas

---

## 🔍 Cómo Verificar que Funciona

### **1. Al iniciar el servidor (`npm run dev`)**

Deberías ver en la terminal:

```
-----------------------------------------------------
Gestor Expedientes Pro - Configuración de Entorno
Modo: development
API Key detectada: SÍ (Termina en ...u144)  ← ✅ Debe decir "SÍ"
-----------------------------------------------------
```

### **2. En la consola del navegador**

Al cargar la aplicación, deberías ver:

```
Gemini API Key initialized successfully (ends with ... u144 )
```

### **3. Al usar el OCR**

- El botón debe cambiar a "Procesando..."
- Debe aparecer un mensaje de éxito: "Datos extraídos del documento"
- Los campos del formulario se rellenan automáticamente

---

## 🚨 Si el Error se Repite en el Futuro

### **Error: "API Key not valid"**
1. Verifica que `.env.local` tenga la clave correcta
2. Asegúrate de que la clave empiece por `AIza...`
3. **Reinicia el servidor** (`Ctrl+C` y luego `npm run dev`)
4. La clave puede haber expirado → Genera una nueva en Google AI Studio

### **Error: "404 - model not found"**
1. Google ha vuelto a cambiar los nombres de los modelos
2. Consulta la [documentación oficial de Gemini](https://ai.google.dev/gemini-api/docs/models)
3. Actualiza el nombre del modelo en `src/services/geminiService.ts`
4. Modelos comunes:
   - `gemini-2.0-flash-exp` (experimental, más rápido)
   - `gemini-1.5-pro` (más potente, si está disponible)

### **Error: "CORS" o problemas de red**
- Verifica tu conexión a internet
- Comprueba que no haya un firewall bloqueando `generativelanguage.googleapis.com`

---

## 📝 Notas Importantes

1. **Variables de entorno NO se recargan automáticamente**
   - Siempre debes reiniciar el servidor después de modificar `.env.local`

2. **El archivo `.env.local` está en `.gitignore`**
   - No se sube a Git por seguridad
   - Si clonas el proyecto en otro lugar, debes crear el archivo de nuevo

3. **La API Key es gratuita pero tiene límites**
   - Consulta los límites en [Google AI Studio](https://aistudio.google.com/)
   - Si llegas al límite, espera o crea una nueva clave

---

## ✅ Estado Actual

- ✅ API Key configurada correctamente
- ✅ Modelo actualizado a `gemini-2.0-flash-exp`
- ✅ OCR de documentos funcionando
- ✅ OCR de fichas técnicas funcionando
- ✅ Detección mejorada de claves placeholder

---

**Última actualización:** 27/11/2025 16:44
