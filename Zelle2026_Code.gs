// ============================================================
//  Zelle 2026 – Gestión Financiera Personal
//  Google Apps Script – Código del servidor
//
//  INSTRUCCIONES DE DESPLIEGUE:
//  1. Ve a script.google.com → Nuevo proyecto
//  2. Renombra el proyecto a "Zelle 2026"
//  3. Reemplaza el contenido de Code.gs con este archivo
//  4. Crea un nuevo archivo HTML → nómbralo "index" → pega Zelle2026_index.html
//  5. Desplegar → Nueva implementación → Aplicación web
//     - Descripción: Zelle 2026 v1
//     - Ejecutar como: Yo (tu cuenta de Google)
//     - Quién puede acceder: Solo yo (o cualquiera con el enlace)
//  6. Copia la URL de implementación
//
//  DATOS: Se guardan automáticamente como "Zelle2026_Data.json"
//  en la raíz de tu Google Drive. Archivo JSON puro, portable.
// ============================================================

const DATA_FILE_NAME = 'Zelle2026_Data.json';

// Sirve la aplicación HTML
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Zelle 2026 – Gestión Financiera')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Lee el archivo de datos desde Drive
function loadData() {
  try {
    const folder = DriveApp.getRootFolder();
    const files = folder.getFilesByName(DATA_FILE_NAME);
    if (files.hasNext()) {
      const raw = files.next().getBlob().getDataAsString('UTF-8');
      return JSON.parse(raw);
    }
    // No existe aún el archivo — la app lo creará al primer guardado
    return null;
  } catch (e) {
    console.error('loadData error:', e.toString());
    return { error: e.message };
  }
}

// Guarda el objeto de datos completo en Drive
function saveData(payload) {
  try {
    const content = JSON.stringify(payload, null, 2);
    const folder = DriveApp.getRootFolder();
    const files = folder.getFilesByName(DATA_FILE_NAME);
    if (files.hasNext()) {
      // Actualiza el archivo existente
      files.next().setContent(content);
    } else {
      // Crea el archivo por primera vez
      folder.createFile(DATA_FILE_NAME, content, MimeType.PLAIN_TEXT);
    }
    return {
      ok: true,
      savedAt: new Date().toISOString(),
      count: (payload.transactions || []).length
    };
  } catch (e) {
    console.error('saveData error:', e.toString());
    return { error: e.message };
  }
}

// Exporta el archivo JSON como texto (para descarga desde la app)
function exportData() {
  try {
    const folder = DriveApp.getRootFolder();
    const files = folder.getFilesByName(DATA_FILE_NAME);
    if (files.hasNext()) {
      return files.next().getBlob().getDataAsString('UTF-8');
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Devuelve la URL del archivo JSON en Drive (para referencia)
function getDataFileUrl() {
  try {
    const folder = DriveApp.getRootFolder();
    const files = folder.getFilesByName(DATA_FILE_NAME);
    if (files.hasNext()) {
      return files.next().getUrl();
    }
    return null;
  } catch (e) {
    return null;
  }
}
