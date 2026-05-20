# Fight World — полноценный патч + хост 2.3.1

## Что исправляет

1. Строки бойцов больше не растягивают кнопку имени на всю ширину.
2. Рейтинг одной горизонтальной строкой:
   позиция, имя, флаг/страна, рекорд, OVR.
3. Ростеры клубов и сборных приводятся к такому же виду:
   имя, флаг/страна, рекорд, OVR.
4. В новостях тип события маленький и стоит напротив недели.
5. В турнирных новостях убраны тире: теперь `1 Имя`, `2 Имя`, `3 Имя`.
6. 1/2/3 места в турнирной новости идут в одну горизонтальную линию.
7. Календарь турниров:
   - город — раз в 4 месяца;
   - область — раз в 6 месяцев;
   - регион — раз в 8 месяцев;
   - страна — раз в год;
   - континент — раз в год;
   - чемпионат мира — раз в год;
   - олимпиада — раз в 2 года.
8. “Характеристики” переименованы в “Статы”.
9. Кнопки характеристик уменьшены.
10. В боях соперник в одну строку, кнопка избранного скрыта.
11. Перед боем раунды/деньги/шанс в одну строку.
12. Во время боя скрыты деньги/шанс и служебные фразы.
13. Из итогов боя удалён лог ударов.

## Как применить

Распакуй архив в корень `FightSimulator`, потом:

```powershell
cd C:\FightSimulator_GitHub
PowerShell -ExecutionPolicy Bypass -File .\apply_patch.ps1
```

## Локальный хост

```powershell
cd C:\FightSimulator_GitHub
PowerShell -ExecutionPolicy Bypass -File .\start_host.ps1
```

Откроется:

```text
http://localhost:5173
```

## Пуш и GitHub Pages

```powershell
cd C:\FightSimulator_GitHub
git status
git add .
git commit -m "Fix compact rows news and tournament calendar 2.3.1"
git push origin main
```

Хост:

```text
https://coldqh.github.io/FightSimulator/
```

Если GitHub Pages ещё не включён:
`Settings -> Pages -> Build and deployment -> Source: GitHub Actions`.
