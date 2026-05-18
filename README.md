# Fight Simulator

Version: `world-scale-flags-2.0.0`

- Reworked country system to 100+ countries.
- World roster is capped and distributed by final country counts:
  - 20,000 amateurs total
  - 5,000 street fighters total
  - 1,800 professionals total
- Pro distribution is country-weighted and split across weight classes.
- Amateur distribution is country-weighted and split across weight/OVR/rank layers.
- Street distribution is country-weighted and capped globally.
- Club count is now based on total athletes in the country: `ceil((street + amateur + pro) / 30)`.
- Flights are paid and reset the current gym.
- Profile management now opens separate modals for travel, weight change and path change.
- Flags are displayed next to country labels and included as PNG files.
