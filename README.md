# Gestor de Expedientes Pro

Esta es una aplicación para la gestión de expedientes administrativos que integra IA para la entrada de datos, seguimiento económico y conexión con plataformas externas.

## Desplegar en Firebase Hosting

¡Sigue estas instrucciones para desplegar la aplicación en Firebase Hosting usando la terminal!

---

### 1. Descarga y Descomprime tu Proyecto
- Pulsa el botón **Download App** en Google AI Studio.
- Descomprime el archivo `.zip` y abre la nueva carpeta descargada.

---

### 2. Abre la Terminal y Accede a la Carpeta
```bash
# Navega a la carpeta de tu proyecto.
# Sustituye 'nombre-de-tu-carpeta' por el nombre real.
cd ruta/a/tu/nombre-de-tu-carpeta
```

---

### 3. Instala las Dependencias
Si es la primera vez que abres el proyecto, necesitas instalar todas las librerías necesarias.
```bash
npm install
```

---

### 4. Compila la Aplicación
Este paso empaqueta tu aplicación para producción y crea la carpeta `dist`.
```bash
npm run build
```
Asegúrate de que el proceso termina sin errores.

---

### 5. Configura Firebase (`firebase.json`)
Si no existe, crea un archivo llamado `firebase.json` en la raíz del proyecto con este contenido. Este archivo le dice a Firebase cómo desplegar tu sitio.
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

---

### 6. Vincula tu Proyecto de Firebase
Primero, para ver los proyectos a los que tienes acceso, ejecuta:
```bash
firebase projects:list
```
Luego, para vincular esta carpeta con el proyecto que quieres usar:
```bash
firebase use --add
```
Sigue las instrucciones en la terminal para seleccionar tu proyecto y darle un alias (por ejemplo, `default`).

---

### 7. Despliega la Aplicación
Con todo configurado, ejecuta el comando final para desplegar:
```bash
firebase deploy --only hosting
```

---

### ¡Listo!
Tu aplicación se subirá a Firebase Hosting. Al finalizar, la terminal te mostrará la URL pública donde podrás ver tu aplicación en vivo.

**¿Necesitas ayuda?**  
Si nunca has creado un proyecto en Firebase, el primer paso es ir a [https://console.firebase.google.com](https://console.firebase.google.com) y crear uno nuevo. ¡Es muy rápido!
