# ChordSelector — Functions Reference Guide

## Overview

ChordSelector consists of two main modules:
- **chord_engine.js** — Harmonic logic and grid generation (source of truth)
- **chord_ui.js** — Visual rendering and user interaction

This guide documents all major functions in both modules.

---

## chord_ui.js — User Interface Module

### Rendering Functions

#### `paint()`
Main drawing loop. Called continuously to render the entire UI.
- Draws background
- Calls all drawing functions (CONFIG, grid, monitor, dropdowns)
- Manages redraw timing

#### `drawConfig(g, l)`
Draws the left control panel (CONFIG).
- **Parameters:** graphics context `g`, layout object `l`
- Draws SYNC button, KEY/SCALE selectors, OCT, VOICING, VL, VLMODE
- Calls specialized draw functions for each element

#### `drawSelector(g, r, label, value, isOpen, isHover, pressTime)`
Draws a dropdown selector (KEY, SCALE, VOICING).
- **Parameters:** graphics `g`, rect `r`, label, current value, open state, hover/press feedback
- Shows label and value
- Highlights when open or on hover
- Caret shows up/down direction

#### `drawSyncButton(g, r)`
Draws the SYNC button with diapason icon (♪).
- **Parameters:** graphics `g`, rect `r`
- Feedback: hover = lighter, press = darker
- Sends "synclive" message to engine on click

#### `drawStepper(g, r, label, value, isHover, pressTime)`
*Legacy function — replaced by drawOctaveSelector*

#### `drawOctaveSelector(g, r)`
Draws the octave selector (7 buttons: -3 to +3).
- **Parameters:** graphics `g`, rect `r`
- Each button clickable, active value highlighted in gold
- Hover/press feedback on each button
- Direct value selection (no dragging)

#### `drawCfgButton(g, r, txt, on, isHover, pressTime)`
Draws configuration buttons (VL, VLMODE).
- **Parameters:** graphics `g`, rect `r`, text, on/off state, hover/press feedback
- State-based coloring: off = dark, on = light, hover = lighter
- Text shows button state or cycle mode (ANCHOR/RELAT/PIANO)

#### `drawGrid(g, l)`
Draws the main chord grid (7 diatonic columns + BORROWED).
- **Parameters:** graphics `g`, layout object `l`
- Column headers (I–VII, BORR) at top
- Calls drawCell for each valid chord

#### `drawCell(g, r, valid, label, isAct, borrowed, roman, isHov)`
Draws a single cell in the grid.
- **Parameters:** graphics `g`, rect `r`, valid flag, chord label, active state, borrowed flag, roman numeral, hover state
- Active cell = bright white/magenta
- Borrowed chord = purple tones
- Hover = slightly brighter
- Shows chord name and (for borrowed) roman numeral

#### `drawMonitor(g, l)`
Draws the right monitor panel (notes, mini-keyboard, HOLD/LATCH).
- **Parameters:** graphics `g`, layout object `l`
- Displays currently playing notes in gold
- Mini-keyboard shows note activity with green highlights
- HOLD/LATCH button with state feedback

#### `drawDropdown(g, l)`
Draws the popover menu overlay (KEY, SCALE, VOICING).
- **Parameters:** graphics `g`, layout object `l`
- Menu title at top
- Grid of selectable items
- Active item highlighted in doré (KEY) or blue (SCALE)
- Hover feedback on each cell

#### `drawCollapse(g, l)`
Draws the collapse/expand arrow button (top-right).
- **Parameters:** graphics `g`, layout object `l`
- Arrow points left (collapsed) or right (expanded)

#### `drawExt(g, l)`
Draws the EXT toggle button (reveal extended chords).
- **Parameters:** graphics `g`, layout object `l`
- State-based coloring: off = dark, on = bright
- Shows "EXT ●" when active

### Layout & Geometry Functions

#### `L()`
Calculates layout dimensions based on window size.
- Returns: layout object with `W`, `H`, `gridX`, `gridR`, `gridW`, `rowH`, `nRows`, etc.
- Adjusts for collapsed mode
- Called at start of paint() and onclick()

#### `cfgRect(l, i)`
Calculates rectangle for a CONFIG item (by index).
- **Parameters:** layout `l`, item index `i`
- Returns: [x, y, width, height]
- Accounts for octave being compact (0.8 height units), others = 1.2

#### `cfgIndex(id)` 
Finds index of a CONFIG item by ID string.
- **Parameters:** item ID ("keyscale", "oct", "voicing", "vl", "vlmode")
- Returns: index in CFG_ITEMS array, or -1 if not found

#### `cfgWeight(id)`
Returns relative height weight of a CONFIG item.
- **Parameters:** item ID
- oct = 0.8 (compact), others = 1.2
- Used by cfgRect to allocate vertical space

#### `cellRect(l, col, row)`
Calculates rectangle for a grid cell.
- **Parameters:** layout `l`, column (0-7), row
- Returns: [x, y, width, height]
- Cells are uniform height (rowH)

#### `ddLayout(l)`
Calculates layout for the dropdown popover.
- **Parameters:** layout `l`
- Returns: { n, items, x0, y0, w, perRow, cw, ch }
- KEY = 3 cols, SCALE = 2 cols, VOICING = 2 cols

#### `ddCellRect(dl, i)`
Calculates rectangle for a dropdown cell.
- **Parameters:** dropdown layout `dl`, item index `i`
- Returns: [x, y, width, height]

#### `collapseRect(l)` / `extRect(l)` / `holdRect(l)`
Return rectangles for specific UI elements.
- **Parameters:** layout `l`
- Used for hit-testing in onclick()

### Text Utilities

#### `midiName(n)`
Converts MIDI note number to display name.
- **Parameters:** MIDI note (0-127)
- Returns: string like "C4", "C#5", etc.

#### `safeTextW(str, fs)`
Measures text width in pixels (with fallback).
- **Parameters:** text string, font size
- Returns: approximate width in pixels
- Fallback: `str.length * fs * 0.58`

#### `kbRange()`
Calculates the MIDI range for the mini-keyboard display.
- Returns: { low: MIDI note, oct: number of octaves }
- Centered around active notes, minimum 2 octaves

#### `isNoteActive(m)`
Checks if a MIDI note is in the currently active notes.
- **Parameters:** MIDI note
- Returns: boolean

### Interaction Functions

#### `onclick(x, y, but, cmd, shift, capslock, option, ctrl)`
Max jsui onclick handler. Routes all mouse clicks.
- **Parameters:** x, y coordinates, button, modifier keys
- Handles: EXT toggle, collapse/expand, HOLD/LATCH, CONFIG clicks, grid clicks, dropdown
- Updates state and sends messages to engine

#### `onidle(x, y, but)`
Continuous tracking of mouse position (hover feedback).
- **Parameters:** x, y, button state
- Updates: hoverSync, hoverCfg, hoverOctave, hoverDD, hoverCell
- Triggers redraw on state change

#### `onidleout(x, y, but)`
*Legacy function — now empty*

#### `playCell(col, row, fn, semis, type)`
Handles grid cell click (plays a chord).
- **Parameters:** column, row, function name, semitone offset, chord type
- Updates activeCol/activeRow
- Sends "fn deg" or "colorchord" message to engine
- Manages LATCH mode (toggle on/off)

#### `stepOct(x, r)`
*Legacy function — replaced by octave selector*

### Dropdown Handling

#### `applyDropdown(i)`
Applies a dropdown selection (KEY, SCALE, VOICING).
- **Parameters:** selected item index
- Updates rootIdx, scaleIdx, or voicingIdx
- Sends message to engine
- Resets isSynced flag if key/scale changed

#### `openDropdown(id)` / `closeDropdown()`
Opens/closes the dropdown popover.
- **Parameters:** dropdown ID ("key", "scale", "voicing")
- Triggers redraw

#### `ddItems()` / `ddCurrent()`
Get current dropdown items and selected index.
- Returns: items array and selected index

### Message Handling (from chord_engine)

#### `scale(v)` / `root(v)`
Receive scale/root changes from engine.
- **Parameters:** scale index or root index
- Updates scaleIdx/rootIdx
- Triggers redraw

#### `active(fn, degree)`
Receive active chord notification from engine.
- **Parameters:** function name (or "color"), degree
- Updates activeCol/activeRow
- Triggers redraw

#### `notes()`
Receive active notes list from engine.
- **Parameters:** variable number of MIDI notes
- Updates activeNotes
- Triggers redraw

#### `clearnotes()`
Clear active notes display.
- Resets activeNotes, activeCol, activeRow

#### `gridclear()` / `gridcell()` / `gridbor()` / `griddone()`
Receive grid data from engine (multi-message protocol).
- gridclear() = reset buffers
- gridcell(col, fn, label) = add diatonic chord
- gridbor(i, label, semis, type, roman) = add borrowed chord
- griddone() = commit grid to display

#### `gridRows()`
Calculate number of rows in grid.
- Returns: max rows across all columns (for layout)

---

## chord_engine.js — Harmonic Engine Module

*Documentation pending — comprehensive function list available in code comments*

### Core Functions

#### `setup()`
Initializes the engine on device load.
- Loads scale data
- Sets default key (C Major)
- Generates initial grid
- Broadcasts to UI

#### `setKey(idx)` / `setScale(idx)`
Change the current key or scale.
- **Parameters:** index (0-11 for key, 0-6 for scale)
- Regenerates grid
- Broadcasts to UI

#### `playChord(degree)` / `playColor(semis, type)`
Play a diatonic or borrowed chord.
- **Parameters:** degree (0-6) or semitone offset + type
- Generates notes via voice leading
- Sends MIDI output

#### `setVoicing(idx)` / `setVoiceLeading(on)` / `setVLMode(mode)`
Configure voicing and voice leading.
- Updates UI display
- Affects next chord playback

#### `generateGrid()`
Builds the full chord grid for current key/scale.
- Returns: gridCols (7 arrays) and gridBor (borrowed chords)
- Calls gridcell() / gridbor() to send to UI

---

## State Variables

### Key State
- `rootIdx` — current root (0-11, C = 0)
- `scaleIdx` — current scale (0-6, Major = 0)
- `octave` — current octave transpose (-3 to +3)
- `voicingIdx` — current voicing (0-9)
- `vlEnabled` — voice leading on/off
- `vlMode` — "anchored", "relative", or "piano"
- `latchMode` — toggle on/off for sustained play

### Grid State
- `gridCols` — 7 arrays of diatonic chords
- `gridBor` — array of borrowed chords
- `activeCol`, `activeRow` — currently active chord position
- `activeNotes` — MIDI notes currently sounding

### Hover/Press State
- `hoverSync`, `hoverOctave`, `hoverCfg`, `hoverDD`, `hoverCell` — UI feedback
- `lastClickInJsui`, `syncPressed`, `pressedCfg` — timing for press feedback

### Layout
- `collapsed` — device folded (CONFIG + MONITOR only)
- `openDropdown` — "key", "scale", "voicing", or ""
- `extMode` — EXT toggle (show all chords)

---

## Message Protocol

### Engine → UI (via inlets/outlets)

**From chord_engine.js (outlet 7 broadcasts):**
- `gridclear`
- `gridcell col fn label`
- `gridbor i label semis type roman`
- `griddone`
- `active fn degree` or `active color semis`
- `scale idx`
- `root idx`
- `notes midi1 midi2 midi3 ...`
- `clearnotes`

### UI → Engine (outlet 0)

**From chord_ui.js (clicking, selecting):**
- `rootidx N` — user selected root
- `scaleidx N` — user selected scale
- `voicingidx N` — user selected voicing
- `octave N` — user selected octave
- `fn deg` — user clicked diatonic chord (fn = function name, deg = degree 0-6)
- `colorchord semis type` — user clicked borrowed chord
- `voiceleading on/off` — toggle VL
- `vlmode anchor/relat/piano` — change VL algorithm
- `synclive` — user clicked SYNC button
- `extended on/off` — toggle EXT
- `release` — user released LATCH

---

## Key Constants

- `NOTE_NAMES` = ["C", "C#", "D", ..., "B"]
- `SCALE_NAMES` = ["Major", "Minor", "Dorian", ...]
- `DEG_NAMES` = ["I", "II", ..., "VII"]
- `VOICING_LIST` = ["classic", "piano", "open", ..., "drop3"]
- `OCT_MIN`, `OCT_MAX` = -2, +2
- `SYNC_W` = 22 (width of SYNC button in pixels)
- `CFG_W` = 136 (width of CONFIG panel)
- `MON_W` = 96 (width of MONITOR panel)
- `HDR_H` = 15 (height of grid header)
- `KB_H` = 40 (height of mini-keyboard)
- `PAD` = 4 (padding/margin constant)

---

## Performance Notes

- **Redraw:** Minimized with state tracking. Only redraws on state change.
- **Hit-testing:** O(1) for buttons, O(n) for grid and dropdowns.
- **Grid generation:** Called once per key/scale change.
- **Memory:** ~50KB for UI state, ~20KB for grid data.

---

## Tips for Modification

1. **Add a new CONFIG item:** Update CFG_ITEMS array, add cfgWeight case, add draw function, add onclick handler.
2. **Add a new control:** Follow the pattern: state variable → draw function → onclick/onidle → engine message.
3. **Change grid appearance:** Edit drawCell() colors and drawGrid() layout.
4. **Add animation:** Store timestamps, check delta in paint(), update state incrementally.
5. **Optimize redraw:** Use targeted mgraphics.redraw() only when state changes (see onidle pattern).

---

**Last updated:** 2026-06-06
**Author:** Claude with user feedback
