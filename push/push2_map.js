// push2_map.js — Bridge Push 2 (Phase 3)
// Aucune logique harmonique : reçoit la grille du moteur (source de
// vérité) et fait le pont avec les pads/LEDs du Push 2.
//
// inlet 0  → broadcast grille du moteur (gridclear/gridcell/gridbor/griddone)
//            (+ messages root/scale/active/notes ignorés)
// inlet 1  → pads entrants depuis le Push  ("pack i i" : pitch velocity)
//
// outlet 0 → LEDs vers le Push : [note, couleur] → unpack → noteout (User Port)
// outlet 1 → jeu vers le moteur : "padvel v", "playcell col row", "release"

autowatch = 1;
inlets  = 2;
outlets = 2;

// =====================================================
// COULEURS (index palette Push 2 — à affiner avec le hardware)
// =====================================================
var COLOR_OFF      = 0;
var COLOR_BORROWED = 9;    // orange
function colorForFn(fn) {
	switch(fn) {
		case "triad":            return 21;  // vert
		case "sus2": case "sus4":return 37;  // cyan
		case "seven":            return 45;  // bleu
		case "nine":             return 49;  // violet
		case "add9":             return 57;  // rose
		default:                 return 21;
	}
}

// =====================================================
// GRILLE REÇUE DU MOTEUR (types seulement, pour couleurs + dimensions)
// =====================================================
var gCols = [[],[],[],[],[],[],[]];
var gBor  = [];
var gColsTmp, gBorTmp;

function gridclear() { gColsTmp = [[],[],[],[],[],[],[]]; gBorTmp = []; }
function gridcell(col, fn, label) {
	if (!gColsTmp) gridclear();
	gColsTmp[parseInt(col)].push({ fn:String(fn) });
}
function gridbor(i, label, semis, type, roman) {
	if (!gBorTmp) gBorTmp = [];
	gBorTmp[parseInt(i)] = { fn:"borrowed" };
}
function griddone() {
	if (gColsTmp) gCols = gColsTmp;
	if (gBorTmp)  gBor  = gBorTmp;
	gColsTmp = null; gBorTmp = null;
	refreshPads();
}

// Messages non-grille du moteur : ignorés (évite les erreurs console)
function root() {}
function scale() {}
function active() {}
function notes() {}
function clearnotes() {}

// =====================================================
// LEDS
// =====================================================
// Note Push pour (colonne, rangée) — rangée 0 = HAUT du device.
// Layout User Port : note = 36 + ligne_hardware*8 + col, ligne 0 = bas.
function padNote(col, row) { return 36 + (7 - row) * 8 + col; }

function refreshPads() {
	// éteindre tout le 8×8
	for (var r = 0; r < 8; r++) {
		for (var c = 0; c < 8; c++) outlet(0, padNote(c, r), COLOR_OFF);
	}
	// allumer les cases valides
	for (var col = 0; col < 7; col++) {
		for (var row = 0; row < gCols[col].length; row++) {
			outlet(0, padNote(col, row), colorForFn(gCols[col][row].fn));
		}
	}
	for (var i = 0; i < gBor.length; i++) {
		outlet(0, padNote(7, i), COLOR_BORROWED);
	}
}

// message "update" = rafraîchir les LEDs à la demande
function update() { refreshPads(); }

// =====================================================
// PADS ENTRANTS (inlet 1) : pitch velocity
// =====================================================
function list(pitch, velocity) {
	if (inlet !== 1) return;
	pitch    = parseInt(pitch);
	velocity = parseInt(velocity);

	var idx = pitch - 36;
	if (idx < 0 || idx > 63) return;          // hors 8×8

	var hwRow = Math.floor(idx / 8);
	var col   = idx % 8;
	var row   = 7 - hwRow;                     // notre rangée (0 = haut)

	if (velocity === 0) { outlet(1, "release"); return; }

	// la case existe-t-elle ?
	var exists = (col === 7) ? (row < gBor.length)
	           : (col >= 0 && col < 7 && row < gCols[col].length);
	if (!exists) return;

	outlet(1, "padvel", velocity);
	outlet(1, "playcell", col, row);
}

post("PUSH2 BRIDGE LOADED\n");
