# Harmonia Device

Max for Live harmonic composition tool — the device itself.

**Latest**: UI Polish Final (2026-06-08) — Colors, harmonization, descriptions added. See `docs/session-log.md`.

## Files

| File | Purpose |
|------|---------|
| `harmonia_v1.amxd` | Compiled Max device (binary) |
| `chord_engine.js` | **Source of truth** — all harmonic logic |
| `chord_ui.js` | UI rendering & user interaction |
| `init_menus.js` | Menu initialization (KEY, SCALE, VOICING) |
| `live_key_observer.js` | Ableton Live integration (SYNC button) |
| `midi_map.js` | MIDI note output routing |

## Architecture

### Single Source of Truth

**`chord_engine.js`** is the engine. It:
- Holds all state (key, scale, voicing, voice leading mode, etc.)
- Computes the chord grid
- Implements voice leading algorithms
- Broadcasts UI updates via `pushUIState()`

**`chord_ui.js`** is a pure consumer. It:
- Renders the UI based on engine state
- Handles user interaction
- Sends messages back to the engine
- Never modifies state directly — always goes through the engine

### Message Flow

```
User clicks chord
    ↓
chord_ui.js: onclick()
    ↓
outlet(0, "fn", col) or outlet(0, "colorchord", ...)
    ↓
chord_engine.js: receives message
    ↓
Engine updates state + computes notes
    ↓
outlet(2, "noteout", notes) → MIDI output
outlet(3, "pushUIState", ...) → UI update
    ↓
chord_ui.js: paint() redraws
```

## Development

Edit `chord_engine.js` or `chord_ui.js`, save, and Max will auto-reload (autowatch enabled).

**Key principle**: Keep harmonic logic in the engine. Keep rendering in the UI. Never duplicate logic.

## Testing

1. **Load in Ableton Live** → drag `.amxd` onto a MIDI track
2. **Click chords** → should output MIDI notes
3. **Change VOICING** → should affect note output
4. **Toggle VOICE LEADING** → should smooth transitions
5. **SYNC button** → should import Ableton Live's key/scale

## Distribution

To build the `.amxd` file:
1. Open in Max
2. File → Export Code Objects → harmonia_v1.amxd

Upload to [releases](https://github.com/c0remusic/harmonia/releases).
