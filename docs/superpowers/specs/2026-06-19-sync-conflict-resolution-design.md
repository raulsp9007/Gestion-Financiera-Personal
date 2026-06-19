# Spec: Sync Conflict Resolution — `updatedAt` per record

**Fecha:** 2026-06-19  
**Estado:** Aprobado  
**Objetivo:** Garantizar persistencia de datos con múltiples usuarios/dispositivos accediendo y guardando simultáneamente. Ningún cambio guardado (✅) debe poder ser sobrescrito por un dispositivo con datos más antiguos.

---

## Contexto y problema

CashMap usa Google Drive como backend (un único archivo JSON). El cliente hace merge local antes de guardar. El merge actual tiene dos bugs críticos:

**Bug 1 — Tombstones no aplican a registros locales**  
En `mergeData`, los registros en `deletedIds` (tombstones) se excluyen del remoto pero NO del local. Un dispositivo que aún tiene en memoria un registro eliminado lo resucita en el próximo push.

**Bug 2 — "Local siempre gana" destruye cambios del otro dispositivo**  
Si Yolanda tiene en memoria una versión vieja del registro #5 y Raul ya lo editó y guardó en Drive, cuando Yolanda hace cualquier otro push, su versión vieja sobreescribe la de Raul. El campo `updatedAt` permite comparar quién tocó el registro más recientemente.

**Bug 3 — `initFromDrive` ignora localStorage al cargar online**  
Si la pestaña se cerró en un race condition (save en curso), localStorage puede tener datos más nuevos que Drive. `initFromDrive` toma Drive directo sin mezclar.

---

## Diseño

### 1. Campo `updatedAt` en todos los registros

Todos los arrays de datos llevan el nuevo campo:

```js
{ id: 5, date: "2026-06-19", amount: 100, ..., updatedAt: "2026-06-19T14:30:25.123Z" }
```

- Formato: `new Date().toISOString()` (UTC, comparable lexicográficamente)
- Se asigna en creación y en cada edición
- Registros existentes sin `updatedAt` se tratan como `""` — siempre pierden ante uno con timestamp
- Arrays afectados: `txs[]`, `deudas[]`, `homeTxs[]`, `customMenus[n].data[]`
- Sin cambios en el backend GAS

### 2. Nueva función `mergeArr` en `mergeData`

Reemplaza la lógica "local siempre gana":

```js
const mergeArr = (loc, rem) => {
  const map = {};
  (rem||[]).forEach(t => { if (!allDel.has(t.id)) map[t.id] = t; });
  (loc||[]).forEach(t => {
    if (allDel.has(t.id)) return;                               // Bug 1 fix: tombstone bloquea local también
    const prev = map[t.id];
    if (!prev || (t.updatedAt || '') >= (prev.updatedAt || '')) map[t.id] = t; // Bug 2 fix: más nuevo gana
  });
  return Object.values(map);
};
```

Mismo patrón para `mergeMenuData` (custom menu records) dentro de `mergeData`.

### 3. Mismo fix en `applyRemoteData`

`_safeMerge` (txs/deudas/home) y la función interna de merge de menús reciben el mismo cambio:
- Tombstone excluye registros locales también
- `updatedAt` decide el ganador cuando el mismo ID existe en ambos lados

### 4. `initFromDrive` — merge con localStorage al cargar online

```js
function initFromDrive(driveData) {
  let data = driveData;
  if (driveData && !driveData.error) {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try { data = mergeData(JSON.parse(cached), driveData); } catch(e) {}
    }
  }
  // resto de la función usa `data` en vez de `driveData`
}
```

Drive actúa como "remoto", localStorage como "local". El `updatedAt` decide quién gana — normalmente Drive (datos más recientes), pero localStorage gana si tiene edits más nuevos (race condition al cerrar).

### 5. Puntos donde agregar `updatedAt`

| Función | Array afectado |
|---|---|
| `saveTx()` | `txs[]` |
| `saveDeuda()` | `deudas[]` |
| `savePago()` | `deudas[]` (modifica la deuda padre) |
| `saveHomeTx()` | `homeTxs[]` |
| `saveCustomRecord()` | `customMenus[n].data[]` |

---

## Invariantes del sistema post-fix

- Un registro con mayor `updatedAt` siempre gana al mismo `id`
- Un registro en `deletedIds` (tombstone) nunca sobrevive el merge, sin importar si es local o remoto
- `initFromDrive` online: merge(localStorage, Drive) → dato más reciente por id gana
- `applyRemoteData` (poller): merge(memoria, Drive) → dato más reciente por id gana
- `pushToDrive`: merge(local_payload, Drive) → dato más reciente por id gana

---

## Lo que NO cambia

- Backend GAS: sin cambios
- Estructura del archivo JSON en Drive: sin cambios (nuevo campo `updatedAt` es retrocompatible)
- Auth, roles, sessionSeed: sin cambios
- Tombstone behavior para menús custom (`deletedCustomRecords`): mismo patrón, mismo fix
- Debounce de 900ms: sin cambios
- Polling 3s/60s: sin cambios
