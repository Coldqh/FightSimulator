# Manual QA Checklist

## Core startup
- Launch the game and verify the main menu opens without errors.
- Confirm `New game`, `Continue`, and `Archive` buttons render correctly.
- If a save exists, confirm `Continue` restores the same fighter.

## Character creation
- Start a new run and verify all 8 countries are visible.
- Change the starting country and verify a new identity is generated.
- Start the career and confirm the home panel opens.

## Weekly loop
- Run one training week.
- Run one work week.
- Run one recovery week.
- Travel to another country.
- Confirm week, month, year, age, money, and stress all update correctly.
- Confirm weekly expenses are logged once as a total.

## Career ecosystem
- Open `Career`.
- If there is no gym, open gym selection and join a gym.
- Open trainer selection and hire a trainer.
- Open contract offers and sign a contract.
- Verify current gym, trainer, contract, and territory render correctly.

## People and relationships
- Open `People`.
- If no contacts exist, confirm the empty state renders.
- Use debug tools or random events to create a contact.
- Interact with a person using all available actions.
- Confirm the week advances and relation changes are shown.

## Events and arcs
- Trigger at least one normal weekly event.
- Trigger at least one relationship arc event.
- Verify each choice shows only the stat changes.
- Pick a choice and confirm the feed updates.

## Fight offers and fight flow
- Open fight offers.
- Verify offers render with purse, fame, toxicity, and contract link.
- Start a fight.
- Verify pre-fight context shows opponent details and player condition.
- Play through at least one full round.
- Verify knockdown count and round scoring still work.
- Finish a fight by decision or KO.
- Confirm results apply money, fame, injuries, and week advancement.

## Injury and condition systems
- Use debug tools to grant each injury type.
- Verify injuries appear in state-dependent screens and affect recovery.
- Confirm health, fatigue, wear, and morale continue updating over weeks.

## Reputation and legend
- Finish a short career.
- Confirm the end screen shows a legend summary.
- Return to the main menu and open the archive.
- Confirm the finished career is stored in Hall of Fame.

## Debug tools
- Enable debug mode with `DEBUG.enable()`.
- Give money, fame, and stress.
- Force a context event.
- Force a relationship arc event.
- Create a friend and a rival.
- Give an injury.
- Teleport to another country.
- Launch a quick fight.

## Batch simulation
- Run `simulateWeeks(8)` and check that batch stats appear in the debug panel.
- Run `simulateFights(10)` and confirm the batch summary includes:
  - wins/losses/draws
  - KO count
  - injuries
  - bankruptcies
  - career endings
  - average income and fame growth context

## Mobile checks
- Open the web version on a narrow viewport.
- Verify the main panels remain readable without horizontal overflow.
- Verify collapsible sections open and close correctly.
- Check compact cards for people, events, fight offers, and contracts.
- Confirm the debug panel remains usable when enabled.

## Save and update flow
- Make progress, close the app, reopen it, and continue from save.
- Confirm save still works after a fight and after a normal week action.
- If `version.json` changes, verify the update banner appears.
- Apply the update and confirm progress is preserved.
