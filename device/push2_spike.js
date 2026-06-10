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
var OFFIDX = 0;
// On reprogramme 8 entrées de palette (slots 1..8) avec les RGB EXACTS de l'UI,
// puis on allume les pads avec ces index → couleurs identiques à l'écran.
var DEGIDX = [1, 2, 3, 4, 5, 6, 7], BORIDX = 8;
var PUSH_RGB = [
	// 0 Spectre — VIF : I rouge · II orange · III jaune · IV vert · V sarcelle · VI cyan · VII bleu · emprunt VIOLET
	[[230,40,40],[255,125,0],[230,205,0],[40,195,40],[0,195,150],[0,170,225],[55,90,240],[170,50,230]],
	// 1 Fonction — groupes francs : T=vert (I,III,VI) · S=bleu (II,IV) · D=rouge (V,VII) · emprunt=violet
	[[40,195,40],[40,120,235],[40,195,40],[40,120,235],[235,45,45],[40,195,40],[235,45,45],[170,50,230]],
	// 2 Tension : I=BLEU (maison) · iii,vi=vert (stables) · tendus jaune→orange→rouge :
	//   ii,IV=jaune · V=orange · vii°=rouge. (emprunt = violet)
	[[50,120,235],[235,215,0],[55,195,75],[235,215,0],[255,140,0],[55,195,75],[230,50,50],[170,50,230]]
];
var scheme = 0;
var NSCHEMES = 4;   // Spectre, Fonction, Quintes, Qualité
// Qualité (chaud/froid) : 0 majeur=chaud · 1 mineur=froid · 2 dim · 3 aug. Reçu du moteur (sortie 7).
var QUAL_RGB = [[255,140,0],[40,130,230],[220,55,55],[230,200,0]];
var degQual = [0,0,0,0,0,0,0];

var enabled   = false;
var gridTask  = null;            // Task persistant (sinon GC -> ne fire pas)
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
	try { theCS.call("release_control", "id", theMid); } catch (e) {}   // défensif : clear un grab fantôme (reload précédent)
	try { theCS.call("grab_control", "id", theMid); } catch (e) { L("grab ERR " + e); }
	try { theMatrix.property = "value"; } catch (e) {}
	enabled = true;
	applyPalette();   // reprogramme la palette aux RGB de l'UI
	if (gridTask) { try { gridTask.cancel(); } catch (e) {} }
	gridTask = new Task(doInit, this); gridTask.schedule(300);   // Task persistant
	L("grab envoyé (CS id=" + theCS.id + " matrix=" + theMid + "), grille dans 300ms."); flush();
}
function doInit() { L("doInit: requestgrid"); flush(); if (enabled) outlet(0, "requestgrid"); }   // -> moteur rediffuse -> griddone -> refreshGrid

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
function griddone() { if (colTmp) { colLen = colTmp; borLen = borTmp; colTmp = null; } L("griddone colLen=[" + colLen.join(",") + "] bor=" + borLen + " enabled=" + enabled); if (enabled) refreshGrid(); }
function anything() {}   // absorbe active/clearnotes/root/scale/octave/voicing/...
function colorscheme(v) { scheme = parseInt(v) % NSCHEMES; L("colorscheme=" + scheme); if (enabled) { applyPalette(); refreshGrid(); } flush(); }
function qualities() { var q = arrayfromargs(arguments); degQual = []; for (var i = 0; i < q.length; i++) degQual.push(parseInt(q[i])); if (scheme === 3 && enabled) { applyPalette(); refreshGrid(); } }

// Réécrit les RGB des slots de palette via SysEx Push 2 (cmd 0x03), puis on allume avec ces index.
function setPaletteRGB(idx, c) {
	if (!theCS) return;
	var r = c[0], g = c[1], b = c[2];
	try { theCS.call("send_midi", 240, 0, 33, 29, 1, 1, 3, idx, r & 127, (r >> 7) & 1, g & 127, (g >> 7) & 1, b & 127, (b >> 7) & 1, 0, 0, 247); }
	catch (e) { L("send_midi ERR " + e); }
}
function applyPalette() {
	if (!theCS) return;
	for (var i = 0; i < 7; i++) {
		var rgb = (scheme < 3) ? PUSH_RGB[scheme][i] : QUAL_RGB[degQual[i] || 0];
		setPaletteRGB(DEGIDX[i], rgb);
	}
	setPaletteRGB(BORIDX, [170, 50, 230]);   // emprunt violet (toutes logiques)
	L("palette RGB appliquée (scheme " + scheme + ")"); flush();
}

function refreshGrid() {
	if (!enabled || !theMatrix) { L("refreshGrid SKIP enabled=" + enabled + " matrix=" + (theMatrix != null)); flush(); return; }
	var n = 0, firstErr = "";
	for (var c = 0; c < 8; c++) for (var r = 0; r < 8; r++) {
		var on = (c < 7) ? (r < colLen[c]) : (r < borLen);
		var idx = on ? ((c < 7) ? DEGIDX[c] : BORIDX) : OFFIDX;
		try { theMatrix.call("send_value", c, r, idx); if (on) n++; } catch (e) { if (!firstErr) firstErr = String(e); }
	}
	L("refreshGrid: " + n + " cases allumées" + (firstErr ? " ERR:" + firstErr : "")); flush();
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
		L("PRESS col=" + col + " row=" + row + " vel=" + vel + " -> midinote " + pitch); flush();
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
