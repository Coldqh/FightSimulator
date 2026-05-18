# Architecture 1.9.7

`fight.js`
- `damageScale(fighter) = 1 + power * 0.0075`.
- This means every power point gives +0.75% damage.
- At 100 power: 1.75x damage compared with 0 power.
- `maxHp(fighter) = 100 + health`.
- Knockdown recovery uses `knockdownStandChance(previousKnockdowns)`.

`render.js`
- Top header keeps KO only inside record text.
