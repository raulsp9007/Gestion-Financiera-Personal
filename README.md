# 💰 CashMap — Gestión Financiera Personal

App de finanzas personales construida con Google Apps Script + HTML/CSS/JS puro. Funciona como PWA instalable en Android y escritorio.

## ✨ Características

- **Dashboard** — Resumen mensual: ingresos, gastos, balance, gráficas
- **Transacciones** — Historial completo con filtros por categoría, tipo y mes
- **Deudas** — Control de deudas y abonos por persona
- **Home Billings** — Gastos del hogar compartidos
- **Menús personalizados** — Vistas personalizadas por usuario/grupo
- **PWA Android** — Instalable desde Chrome, funciona offline
- **Sync con Drive** — Datos guardados en JSON en Google Drive

## 🗂 Archivos

| Archivo | Descripción |
|---------|-------------|
| `index.html` | App completa (SPA, ~3200 líneas) |
| `cashmap_sw.js` | Service Worker para PWA |
| `cashmap_manifest.json` | Manifest para instalación en Android |

## 🚀 Deploy en Google Apps Script

1. Crear nuevo proyecto en [script.google.com](https://script.google.com)
2. Pegar el contenido de `index.html` en un archivo `index.html` del proyecto
3. En `Code.gs` agregar:

```javascript
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('CashMap')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function loadData() {
  // Leer CashMap_Data.json desde Drive
  const files = DriveApp.getFilesByName('CashMap_Data.json');
  if (files.hasNext()) {
    return JSON.parse(files.next().getBlob().getDataAsString());
  }
  return null;
}

function saveData(payload) {
  const files = DriveApp.getFilesByName('CashMap_Data.json');
  const content = JSON.stringify(payload);
  if (files.hasNext()) {
    files.next().setContent(content);
  } else {
    DriveApp.createFile('CashMap_Data.json', content, MimeType.PLAIN_TEXT);
  }
  return { ok: true, count: payload.transactions?.length || 0 };
}
```

4. Deploy → **Nueva implementación → App web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Yo** (o "Cualquier persona")
5. Copiar la URL del deploy

## 📱 Uso como PWA en Android

1. Abre la URL del deploy en Chrome para Android
2. Menú ⋮ → **"Agregar a pantalla de inicio"**
3. O espera el banner de instalación automático

## 🔧 Hosting externo (GitHub Pages / Netlify)

Si hosteas fuera de Apps Script:

1. Renombra `index.html` al nombre que prefieras
2. Coloca `cashmap_sw.js` y `cashmap_manifest.json` en la **misma carpeta**
3. En `index.html`, configura la variable:
   ```javascript
   const CASHMAP_API_URL = 'https://script.google.com/macros/s/TU_DEPLOY_ID/exec';
   ```
4. Deploy → el service worker se registrará automáticamente

## 💾 Estructura de datos (CashMap_Data.json)

```json
{
  "version": 1,
  "lastUpdated": "2026-06-07T00:00:00.000Z",
  "config": {
    "catAll": ["Comida", "Transporte", ...],
    "homeCatsInc": [...],
    "homeCatsExp": [...],
    "homeCurr": "USD",
    "users": ["Raul", "..."],
    "customMenus": [...]
  },
  "transactions": [
    { "id": 1, "fecha": "2026-01-15", "descripcion": "...", "monto": 50.00, "tipo": "gasto", "categoria": "Comida", "usuario": "Raul" }
  ],
  "deudas": [...],
  "home": [...]
}
```

## 🛠 Stack

- **Frontend:** HTML5 + CSS3 + JavaScript (vanilla, sin frameworks)
- **Backend:** Google Apps Script
- **Storage:** Google Drive (JSON)
- **Charts:** Chart.js 4.4
- **PWA:** Service Worker + Web App Manifest + localStorage cache

---

> Proyecto personal — Las Vegas, 2026
