# Playtests
Automated checks that play the game in a hidden browser and fail if anything errors.

Run them from the game folder (the one with `index.html`):
```
pip install playwright
playwright install chromium
python tests/run_all.py
```
Screenshots go to `tests/shots/`. Each test prints `errors []` when it passes.

| Test | What it checks |
|---|---|
| level3_four_days | Four busy days on Level 3, all systems on |
| two_gps_share_queue | Two GP Offices share one queue; benches don't trap patients |
| sandbox_and_problems | Sandbox tools, fires, the ⚠️ problem list, morning paper |
| expand_entrance_sinks | Expanding the building, the double entrance, sinks |
| items_turn_move_sell | Turning, moving and selling items |
| toilets_and_turning | Toilets and 4-way turning |
| patients_in_beds | Patients lying in beds in their own clothes |
| undo_autofurnish_panels | Undo, auto-furnish, panels, settings |
| mouse_and_save | Mouse building and saving/loading |
| phone_layout | Sideways phone layout |
