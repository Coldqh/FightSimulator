# Test Checklist 2.0.4

```powershell
cd C:\FightSimulator_GitHub
node tools\core-smoke-test.cjs
node tools\week-benchmark.cjs
start index.html
```

Manual:
1. Tournament rows show next exact date and weeks left, not the full rule.
2. When an available tournament week starts, a modal says `Доступен турнир`.
3. Team card modal has only one `Сборная ...` heading.
4. New career has foreign residents in street/amateur scenes across countries.
5. Foreign residents show origin → current country route.
6. Mobile tournament row stays in one compact line.
7. Auto-resolved winChance fights do not show punch logs.
8. Week tick should be noticeably faster than 2.0.3.
