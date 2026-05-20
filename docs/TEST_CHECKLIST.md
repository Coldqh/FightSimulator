# Test Checklist 2.2.2 Persistent Save

```powershell
cd C:\FightSimulator_GitHub
node tools\core-smoke-test.cjs
node tools\week-benchmark.cjs
node --check sw.js
start index.html
```

Manual:
1. Start a career.
2. Switch a week.
3. Refresh the page.
4. Career should continue from the same week.
5. Close and reopen browser / iPhone web app.
6. Career should still load.
7. Open the start screen after deleting app state only if save is absent.
8. Start screen should have Continue Career and Import when a save exists.
9. Update app version and reload.
10. Save should migrate, not reset.
11. If primary localStorage save is missing but backup exists, game should restore from backup.
