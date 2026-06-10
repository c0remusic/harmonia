// push2_spike.js — Module Push 2 (toggle Push mode · recording 2-pistes)
// =====================================================================
// Piloté par le toggle UI : "pushmode 1" = ON, "pushmode 0" = OFF
// (l'UI jweb l'envoie au moteur, qui le relaie sur sa sortie 7 -> ici).
//
// ON  : grab CS1 → grille colorée par degré (cases valides) → pads = accords
//       (via midinote, le moteur gère le note-off).
// OFF : release_control → le Push revient à Live. (Aussi au unload : notifydeleted.)
//
// RECORDING : 2-PISTES — les accords sortent par les noteout du moteur → piste →
// enregistrables sur une 2e piste (MIDI From: piste Tuple, Post FX). Aucun code ici.
// L'écriture-clip 1-piste est CONSERVÉE mais DORMANTE (REC=false) pour plus tard.
//
// NB recette Push (empirique, sur hardware) : voir docs/decisions.md § Push RÉSOLU.
// NB couleurs DEGCOL = indices placeholder, à caler sur la vraie palette Push 2.

autowatch = 1;
inlets  = 1;
outlets = 1;

var LOGPATH = "C:/TupleUI/push_spike.log";   // debug temporaire (à retirer avant release)
var USE_CS  = 1;                              // CS1 pilote le Push
var OFFCOL  = 0, BORCOL = 41, DEGCOL = [5, 9, 13, 21, 37, 45, 49];

var enabled   = false;
var theCS = null, theMatrix = null, theMid = null;
var pressed = {}, pressedPitch = {};
var colLen = [0,0,0,0,0,0,0], borLen = 0, colTmp = null, borTmp = 0;

// écriture-clip (option 1-piste) — DORMANTE
var REC = false, lastNotes = [], writePos = 0, entries = [], theClip = null;

function noop() {}

// ---- LOG -------------------------------------------------------------
var logbuf = [];
function L(s) { post("PSPK: " + s + "\n"); logbuf.push(s); }
function flush() { try { var f = new File(LOGPATH, "write"); f.writestring(logbuf.join("\r\n") + "\r\n"); f.eof = f.position; f.close(); } catch (e) { post("PSPK: log err " + e + "\n"); } }

// =====================================================================
// TOGGLE
// =====================================================================
function pushmode(v) { if (parseInt(v)) enable(); else disable(); }
function go() { enable(); }      // alias pour test manuel dans l'éditeur
function bang() { /* pas d'auto-grab */ }
function notifydeleted() { disable(); }   // release si le device est supprimé/rechargé

function enable() {
	if (enabled) return;
	logbuf = []; pressed = {}; pressedPitch = {};
	L("===== PUSH MODE ON =====");
	var found = [];
	for (var i = 0; i < 20; i++) {
		var cs = new LiveAPI(noop, "control_surfaces " + i);
		if (isNaN(parseInt(cs.id)) || parseInt(cs.id) === 0) continue;
		var nm = []; try { nm = cs.call("get_control_names"); } catch (e) {}
		var has = false; if (nm instanceof Array) for (var k = 0; k < nm.length; k++) if (String(nm[k]) === "Button_Matrix") has = true;
		if (has) found.push(cs);
	}
	if (found.length === 0) { L("aucun Push (Control Surface)"); flush(); return; }
	theCS = found[Math.min(USE_CS, found.length - 1)];
	var ret; try { ret = theCS.call("get_control", "Button_Matrix"); } catch (e) { L("get_control ERR " + e); flush(); return; }
	theMid = (ret instanceof Array) ? ret[ret.length - 1] : ret;
	theMatrix = new LiveAPI(onMatrix); theMatrix.id = theMid;
	try { theCS.call("grab_control", "id", theMid); } catch (e) { L("grab ERR " + e); }
	try { theMatrix.property = "value"; } catch (e) {}
	enabled = true;
	var t = new Task(doInit, this); t.schedule(300);   // laisse le grab se poser, puis dessine la grille
	L("CS grabbé, grille dans 300ms."); flush();
}
function doInit() { if (enabled) outlet(0, "requestgrid"); }   // -> moteur rediffuse -> griddone -> refreshGrid

function disable() {
	if (!enabled) return;
	enabled = false;
	if (theCS && theMid != null) { try { theCS.call("release_control", "id", theMid); } catch (e) {} }
	theMatrix = null; theCS = null; pressed = {}; pressedPitch = {};
	L("===== PUSH MODE OFF (release) ====="); flush();
}

// =====================================================================
// RÉCEPTION SORTIE 7 DU MOTEUR (grille + notes)
// =====================================================================
function notes() { var p = arrayfromargs(arguments); lastNotes = []; for (var i = 0; i < p.length; i++) { var n = parseInt(p[i]); if (!isNaN(n)) lastNotes.push(n); } }
function gridclear() { colTmp = [0,0,0,0,0,0,0]; borTmp = 0; }
function gridcell(col) { if (colTmp) colTmp[parseInt(col)]++; }
function gridbor() { borTmp++; }
function griddone() { if (colTmp) { colLen = colTmp; borLen = borTmp; colTmp = null; } if (enabled) refreshGrid(); }
function anything() {}   // absorbe active/clearnotes/root/scale/octave/voicing/...

function refreshGrid() {
	if (!enabled || !theMatrix) return;
	for (var c = 0; c < 8; c++) for (var r = 0; r < 8; r++) {
		var on = (c < 7) ? (r < colLen[c]) : (r < borLen);
		var col = on ? ((c < 7) ? DEGCOL[c] : BORCOL) : OFFCOL;
		try { theMatrix.call("send_value", c, r, col); } catch (e) {}
	}
}

// =====================================================================
// APPUIS PADS  [value, vel, col, row, 1]  -> midinote (note-off géré par le moteur)
// =====================================================================
function padIndex(col, row) { var idx = 0, last = (col < 7) ? col : 7; for (var c = 0; c < last; c++) idx += colLen[c]; return idx + row; }

function onMatrix(args) {
	if (!enabled || !args) return;
	var a = (args.length !== undefined) ? args : [args];
	if (String(a[0]) !== "value" || a.length < 4) return;
	var vel = parseInt(a[1]), col = parseInt(a[2]), row = parseInt(a[3]);
	var valid = (col < 7) ? (row < colLen[col]) : (col === 7 && row < borLen);
	if (!valid) return;
	var key = col + "_" + row;
	if (vel > 0) {
		if (pressed[key]) return; pressed[key] = true;
		var pitch = 48 + padIndex(col, row); pressedPitch[key] = pitch;
		outlet(0, "midinote", pitch, vel);
		if (REC) writeChord();
	} else {
		if (!pressed[key]) return; pressed[key] = false;
		var p = pressedPitch[key]; if (p !== undefined) outlet(0, "midinote", p, 0);
	}
}

// =====================================================================
// ÉCRITURE-CLIP 1-PISTE — DORMANT (REC=false). À reprendre plus tard
// (passer à add_new_notes incrémental ; set_notes REMPLACE d'où l'accumulation).
// =====================================================================
function getClip() {
	if (theClip) return theClip;
	var slot = new LiveAPI(noop, "live_set view highlighted_clip_slot");
	if (!slot || !slot.id || parseInt(slot.id) === 0) { L("pas de clip slot"); return null; }
	var has = slot.get("has_clip"); has = (has instanceof Array) ? has[0] : has;
	if (parseInt(has) === 0) { try { slot.call("create_clip", 16.0); } catch (e) { return null; } }
	theClip = new LiveAPI(noop, "live_set view highlighted_clip_slot clip");
	return theClip;
}
function writeChord() {
	if (!lastNotes.length) return;
	var clip = getClip(); if (!clip) return;
	for (var i = 0; i < lastNotes.length; i++) entries.push({ p: lastNotes[i], beat: writePos });
	writePos += 1;
	try { clip.call("set_notes"); clip.call("notes", entries.length); for (var j = 0; j < entries.length; j++) clip.call("note", entries[j].p, entries[j].beat, 0.9, 100, 0); clip.call("done"); } catch (e) {}
}
function rec() { REC = true; writePos = 0; entries = []; theClip = null; L("clip-write ON"); flush(); }
function norec() { REC = false; L("clip-write OFF"); flush(); }

post("PUSH2 module (toggle) LOADED\n");
