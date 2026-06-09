# CLAUDE.md — CashMap

## Project overview

CashMap is a single-file personal finance SPA. All application code lives in `index.html`.
Do not split into multiple files unless explicitly asked.

**Repo:** github.com/raulsp9007/Gestion-Financiera-Personal  
**Branch:** main  
**Hosting:** GitHub Pages (root of main branch)  
**Language:** Spanish (UI and all output unless told otherwise)

## Stack

- Frontend: vanilla HTML/CSS/JS, no framework
- Charts: Chart.js 4.4 (CDN, already loaded)
- Backend: Google Apps Script (`CASHMAP_API_URL` in the script block)
- Storage: Google Drive (CashMap_Data.json) + localStorage (offline cache)
- PWA: `cashmap_sw.js` service worker + dynamic manifest generated via Canvas API

## File map

```
index.html      -- entire app (~4000+ lines)
cashmap_sw.js   -- service worker, bump CACHE_NAME on every deploy
deploy.bat      -- manual deploy helper (token placeholder, not for automation)
```

## Key data structures

```js
txs[]          // main transactions   {id, date, amount, description, type, category, notes, recurring}
deudas[]       // debts               {id, date, amount, persona, description, type, status, paid, payments[]}
homeTxs[]      // Home Billings       {id, date, amount, description, type, category, notes}
customMenus[]  // custom menus        {id, name, icon, currency, pin, access, data[], nextDataId}
globalCats     // {inc: {key:{label,color}}, exp: {key:{label,color}}}
budgets        // {catKey: {monthly: number}}
navOrder[]     // ordered keys: 'dashboard','deudas','home','balance','custom-{id}'
sessionSeed    // string, invalidates all sessions when changed
```

## Critical modal category pattern

Order is mandatory or category select breaks:

```js
// 1. set defaults
// 2. if editing, override with saved values
updateCatOptions();   // 3. populate select for current type
// 4. if editing, restore saved category AFTER updateCatOptions()
```

## Auth

Roles: `admin` (full), `editor` (can write), `viewer` (read-only).  
Custom menus support optional PIN + minimum role (`viewer`/`editor`/`admin`).  
`sessionSeed` stored in Drive config -- changing it forces re-login on all devices.

## Sync pattern

```
initFromDrive(data)      on load (Drive or localStorage fallback)
scheduleSave()           debounce 900ms -> pushToDrive()
pushToDrive()            saves to Drive + localStorage simultaneously
```

Config is serialised inside every push: `globalCats, homeCurr, users, customMenus, navOrder, sessionSeed, budgets`.

## Service worker

Bump `CACHE_NAME` in `cashmap_sw.js` on every deploy that touches `index.html`.  
Current pattern: `cashmap-v1.N`.

## Git / deploy workflow

After every code change: `git add`, `git commit`, `git push`.  
Push uses token-authenticated URL -- token stored only in the remote URL, never in files.  
Do not commit `.env`, secrets, or the actual token string.

## Communication style

- Responses: direct and concrete, no filler or generic phrases.
- Ask before assuming when something is ambiguous.
- Explain briefly what each code block does when writing new code.
- Flag logic errors even if not asked.
- Offer options when more than one viable solution exists.
- For complex tasks, propose a step-by-step plan before executing.

## Restrictions

- Do not change the folder structure without asking first.
- Do not install or add new libraries without notifying first.
- Do not overwrite existing files without warning (note what will change).
- Always use Spanish for app UI text and user-facing output.
- Do not add calls to external services unless explicitly requested.
- Do not use deprecated APIs when modern alternatives exist.

## Code style

- Vanilla JS only. No TypeScript, no build step, no bundler.
- Inline styles are acceptable inside template literals for dynamic values.
- Keep functions short and single-purpose.
- Prefer `const`/`let`, arrow functions, template literals.
- ID naming pattern: `kebab-case` for DOM ids, `camelCase` for JS variables.
- New render helpers go near the section they serve, or at the bottom before `</script>`.

## Reading files

Read relevant sections before writing. Do not re-read unless the file changed.  
`index.html` exceeds 100 KB -- read only the sections needed for the current task.  
Use line offsets: key landmarks are listed below.

### Approximate section offsets in index.html (verify before using)

| Section | ~Line |
|---|---|
| CSS start | 19 |
| CSS end / `</style>` | 699 |
| HTML body / views | 701 |
| `<script>` start | 1347 |
| Data constants / `globalCats` | 1359 |
| `renderAll()` | ~1728 |
| `renderHistory()` | ~1994 |
| `renderHome()` | ~2310 |
| `renderDeudas()` | ~2687 |
| `openPagoModal()` / `savePago()` | ~2837 |
| `renderCustomMenuView()` | ~3172 |
| `buildSidebarNav()` | ~3026 |
| Auth / session functions | ~3085 |
| Admin modal JS | ~3310 |
| New helper functions (mejoras) | ~4090 |
| `</script>` end | last lines |
