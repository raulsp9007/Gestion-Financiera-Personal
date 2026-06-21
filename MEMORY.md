# CashMap Memory Index

- [CashMap Project](project-cashmap.md) — Architecture, stack, data patterns, deploy info
- [User: Raul](user-raul.md) — Owner profile, GitHub handle, preferences
- [Auto-push after changes](feedback-auto-push.md) — Always commit+push to repo after every code change
- [GAS deployment required](feedback-gas-deployment.md) — Script edits don't apply until a new version is deployed; verify via version number in logs
- [mergeData custom menus](feedback-merge-custom-menus.md) — mergeData must include local-only menus, not just iterate remote; fixed in 45f2e46
- [Modal open class order](feedback-modal-open-class-order.md) — Call _attachInit() AFTER modal.classList.add('open'), never before
- [Attach response guard](feedback-attach-response-guard.md) — Guard r.fileId explicitly; r.ok alone is not sufficient, esc(undefined) crashes
- [Debug commits cleanup](feedback-debug-commits.md) — Remove debug alerts/logs before next feature commit, never leave across sessions
- [applyRemoteData merge](feedback-apply-remote-data-merge.md) — applyRemoteData must merge customMenus/navOrder, not replace; same pattern as mergeData fix
- [Response prefix](feedback-response-prefix.md) — Always start every response with "Raul"
- [Tombstone protection](feedback-tombstone-protection.md) — Remote tombstones never filter local records; local tombstones (deletedIds this device created) DO filter local records in merge (Bug 1 fix in updatedAt PR)
- [Compact at 75%](feedback-compact-at-70.md) — Compact conversation when context window reaches ~75%
- [Sync corruption pattern](feedback-sync-corruption-pattern.md) — Data gone ~60s after load = another device pushing stale state; diagnosis + fix hierarchy
- [Session management](feedback-session-management.md) — Change sessionSeed to force all devices to re-login and discard corrupted local state
- [No thinking in responses](feedback-no-thinking.md) — Only show problem + solution, never internal reasoning steps
