Gym and trainer binding

Core hierarchy
- GymEntity owns trainerIds.
- TrainerEntity belongs to one gym through currentGymId.
- FighterEntity signs a gym first and only then can choose a trainer inside that gym.

Player flow
1. Player opens gym selection.
2. Player signs one gym.
3. Career UI opens the trainer list for that gym.
4. Player chooses one trainer from that gym only.

Gym depth by price
- Cheap gyms offer 1-2 trainers.
- Mid-tier gyms offer 2-3 trainers.
- Expensive and elite gyms offer 3-5 trainers.

What happens on gym change
- The player keeps the new gym immediately.
- If the old trainer belongs to another gym, that trainer link is cleared.
- The UI then sends the player into the trainer panel of the new gym.

World rules
- NPC fighters also bind to gyms and trainers through the same model.
- Newgen fighters receive a gym first and then a trainer from that gym.
- World simulation prefers changing trainers inside the current gym.

Compatibility layer
- Legacy UI fields world.gymMembership and world.trainerAssignment are still populated.
- Old saves where a trainer had no gym binding are repaired during normalization.
- Old saves where gym and trainer do not match are reconciled safely:
  - if possible, the trainer is rebound to a compatible gym
  - if the fighter gym and trainer gym still conflict, the trainer link is cleared

Why this exists
- The player no longer sees all gyms and all trainers at once.
- Gym choice becomes the first career decision.
- Expensive gyms differ not only by bonuses, but also by coach depth.
