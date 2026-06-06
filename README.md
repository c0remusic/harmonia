# Harmonia

A Max for Live harmonic composition tool for fast and musical chord selection, exploration, and performance.

## Overview

**Not a sequencer** — ChordSelector is a workflow tool for selecting and performing chords in real time. The chord grid is the core: it shows all valid chords for your key and scale, always one click away.

## Features

- **Chord Grid** : 7 diatonic degrees + borrowed chords
- **Key & Scale Selection** : Popover menus (12 keys × 7 scales)
- **Voicing Control** : 10 voicing styles (classic, piano, open, spread, house, prog, rootless A/B, drop2, drop3)
- **Voice Leading** : Smooth note movement (3 modes: anchored, relative, piano)
- **Live Scale Sync** : Detect and sync with Live's current scale
- **Octave Control** : 7 presets (-3 to +3)
- **MIDI Input** : Full keyboard support, grid-mapped
- **Hold/Latch Mode** : Performance feature
- **Visual Feedback** : Hover and press states on all elements
- **Extended Chords** : EXT toggle reveals additional types (cap at 8 per column by default)

## Installation

1. Drag `chord_selector.amxd` onto a MIDI track in Live (before an instrument)
2. All files (`.js`, `.png`) must be in the same folder as the device

## Usage

### Basic Workflow

1. Select **KEY** and **SCALE** (popover menus)
2. Click any cell in the grid
3. Adjust **VOICING** and **OCT** to taste
4. Play with MIDI keyboard or click cells

### Config Panel (Left)

- **SYNC (♪)** : Import scale from Live
- **KEY | SCALE** : Popover selectors  
- **OCT** : 7 buttons (-3 to +3)
- **VOICING** : 10 styles, popover menu
- **VL** : Toggle voice leading
- **VLMODE** : Cycle ANCHOR → RELAT → PIANO

### Grid (Center)

- **Columns I–VII** : Diatonic scale degrees
- **BORROWED Column** : Secondary dominants & borrowed chords
- **Rows** : Chord types (maj, min, 7, sus, etc.)
- **Active Cell** : Bright highlight
- **EXT Toggle** : Reveal all chord types

### Monitor (Right)

- **HOLD/LATCH** : Sustain or toggle
- **Note Display** : Current chord notes
- **Mini Keyboard** : Visual feedback, clickable keys

## Architecture

**Single Source of Truth** : `chord_engine.js` calculates harmony; `chord_ui.js` renders it. No spaghetti patching.

```
chord_engine (harmonic logic)
      ↓
chord_ui (UI rendering)
      ↑
[MIDI input / User clicks]
```

## Tips

- **Fast Chord Changes** : Use KEY/SCALE popovers — they stay compact
- **Smooth Progressions** : Toggle VL on for minimal note movement
- **Explore Registers** : Use OCT buttons before adjusting voicing
- **Borrowed Chords** : BORROWED column has chromatic flavors

## Recording Chords

Route the device output to a **2nd MIDI track** (MIDI From = device track), arm the track, and record. Live doesn't capture MIDI effect output in the source clip, so this workaround captures the actual chord notes.

---

For detailed architecture, see `docs/architecture.md`.
For roadmap and known issues, see `docs/roadmap.md`.
