# Fight Simulator patch safety protocol

Run before commit:

\`\`\`powershell
cd C:\FightSimulator_GitHub
node .\scripts\patch-check.cjs
\`\`\`

Then run locally:

\`\`\`powershell
cd C:\FightSimulator_GitHub
python -m http.server 5189
\`\`\`

Open:

\`\`\`text
http://localhost:5189
\`\`\`

Do not commit apply scripts, backups, broken files, or patch archives.
