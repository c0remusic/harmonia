// chord_ui.js — ChordSelector UI horizontale (Max for Live)
// Zones :  CONFIG (gauche) | GRILLE 8 colonnes (centre) | MONITOR (droite)
//          + barre VOICING (bas)
//
// inlet 0  → "root N", "scale N", "active fn deg", "notes ...", "clearnotes"
// outlet 0 → messages vers chord_engine

autowatch = 1;
inlets  = 1;
outlets = 2;   // 0 = messages chord_engine, 1 = redimensionnement (→ thispatcher)

// =====================================================
// DONNÉES D'AFFICHAGE (aucune logique harmonique ici :
// la grille vient du moteur, source de vérité)
// =====================================================

var NOTE_NAMES  = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
var SCALE_NAMES = ["MAJOR","MINOR","DORIAN","PHRYGIAN","LYDIAN","MIXOLYDIAN","H.MINOR"];
var SCALE_ABBR  = ["MAJ","MIN","DOR","PHR","LYD","MIX","HMI"];
var DEG_NAMES   = ["I","II","III","IV","V","VI","VII"];
var DEG_FUNCTIONS = ["TONIC","SUPERTONIC","MEDIANT","SUBDOMINANT","DOMINANT","SUBMEDIANT","LEADING TONE"];

var VOICING_LIST = ["CLASSIC","PIANO","OPEN","SPREAD","HOUSE","PROG","ROOTL.A","ROOTL.B","DROP2","DROP3"];

// =====================================================
// PALETTE DE COULEURS UNIFIÉE — ABLETON OFFICIELLE 2026
// =====================================================
var COLORS = {
	// Palette officielle Ableton (proven audio UX, 20+ ans)
	// Contraste WCAG : Orange 7.6:1 AAA, Cyan 6.5:1 AAA
	bg_main:      [0.165, 0.165, 0.165],    // #2A2A2A — fond principal (Ableton officiel)
	bg_cell:      [0.212, 0.212, 0.212],    // #363636 — cases grille (gris non sélectionné)
	bg_cfg:       [0.165, 0.165, 0.165],    // #2A2A2A — items CONFIG
	bg_hover:     [0.273, 0.273, 0.273],    // #464646 — gris sélectionné (hover)
	gold_active:  [1.0, 0.678, 0.337],      // #FFAD56 — orange Ableton officiel
	gold_hover:   [1.0, 0.71, 0.38],        // #FFC461 — orange plus clair au hover
	blue_accent:  [0.557, 0.800, 0.910],    // #8ECCE8 — cyan-bleu secondaire (6.5:1 contrast AAA)
	text_white:   [0.95, 0.95, 0.96],       // blanc cassé
	text_dim:     [0.55, 0.55, 0.60],       // gris moyen pour labels
	text_dark:    [0.165, 0.165, 0.165],    // #2A2A2A sombre pour texte sur orange
};

// Grille reçue du moteur :
//  gridCols[d] = [ {fn, label}, ... ]   (colonnes diatoniques, contiguës)
//  gridBor     = [ {label, semis, type, roman}, ... ]   (colonne BORROWED)
var gridCols   = [[],[],[],[],[],[],[]];
var gridBor    = [];
var gridColsTmp, gridBorTmp;   // accumulation pendant la réception

// =====================================================
// ÉTAT
// =====================================================

var scaleIdx    = 0;
var rootIdx     = 0;
var octave      = 0;
var OCT_MIN     = -2, OCT_MAX = 2;
var latchMode   = false;
var vlEnabled   = false;
var vlMode      = "anchored";
var voicingIdx  = 0;
var activeNotes = [];
var initDone    = false;  // track si on a synchronisé l'état au démarrage
var activeCol   = -1;   // 0..6 diatonique, 7 = borrowed, -1 = rien
var activeRow   = -1;
var lastOctClick = 0;
var hoverDD     = -1;   // index cellule survolée dans le popover (-1 = aucune)
var lastClickInJsui = 0;   // timestamp du dernier clic dans le jsui
var hoverSync   = false;   // hover sur le bouton SYNC
var syncPressed = 0;       // timestamp du clic SYNC (feedback temporaire)
var hoverCell   = -1;      // index cellule grille survolée (-1 = aucune)
var hoverCfg    = "";      // ID config survolé ("vl", "vlmode", "oct", "voicing", "")
var hoverOctave = -1;      // index octave survolé dans le sélecteur (-1 = aucun)
var hoverHold     = false;   // hover sur le bouton HOLD
var hoverCollapse = false;   // hover sur le bouton COLLAPSE
var pressedCell   = 0;       // timestamp clic cellule (feedback 150ms)
// Timestamps individuels pour feedback 150ms par bouton
var pressedKeyscale = 0;
var pressedOct      = 0;
var pressedVoicing  = 0;
var pressedVL       = 0;
var pressedVLMode   = 0;
var collapsed   = false;  // device replié (CONFIG + MONITOR seulement)
var fullW       = 0;      // largeur mémorisée en mode déplié
var openDropdown = "";    // "" | "key" | "scale" | "voicing"

// =====================================================
// ANIMATIONS ET MICRO-INTERACTIONS
// =====================================================
function animCurve(timestamp, dur) {
	if (timestamp === 0) return 0;
	var dt = Date.now() - timestamp;
	if (dt < 0 || dt > dur) return 0;
	return 1 - (dt / dur);
}

// =====================================================
// MESSAGES ENTRANTS (depuis chord_engine)
// =====================================================

function scale(v) { scaleIdx = parseInt(v); mgraphics.redraw(); }
function root(v)  { rootIdx  = parseInt(v); mgraphics.redraw(); }

function active(fn, degree) {
	fn = String(fn);
	if (fn === "color") {
		var s = parseInt(degree);
		activeCol = 7; activeRow = -1;
		for (var i = 0; i < gridBor.length; i++) { if (gridBor[i].semis === s) { activeRow = i; break; } }
	} else {
		var d = parseInt(degree);
		activeCol = -1; activeRow = -1;
		if (d >= 0 && d < 7) {
			var cc = gridCols[d];
			for (var j = 0; j < cc.length; j++) { if (cc[j].fn === fn) { activeCol = d; activeRow = j; break; } }
		}
	}
	mgraphics.redraw();
}

function notes() {
	activeNotes = [];
	for (var i = 0; i < arguments.length; i++) activeNotes.push(parseInt(arguments[i]));
	mgraphics.redraw();
}

function clearnotes() {
	activeNotes = [];
	activeCol = -1; activeRow = -1;
	mgraphics.redraw();
}

// =====================================================
// RÉCEPTION DE LA GRILLE (depuis le moteur)
// =====================================================

function gridclear() {
	gridColsTmp = [[],[],[],[],[],[],[]];
	gridBorTmp  = [];
}
function gridcell(col, fn, label) {
	if (!gridColsTmp) gridclear();
	gridColsTmp[parseInt(col)].push({ fn:String(fn), label:String(label) });
}
function gridbor(i, label, semis, type, roman) {
	if (!gridBorTmp) gridBorTmp = [];
	gridBorTmp[parseInt(i)] = { label:String(label), semis:parseInt(semis), type:String(type), roman:String(roman) };
}
function griddone() {
	if (gridColsTmp) gridCols = gridColsTmp;
	if (gridBorTmp)  gridBor  = gridBorTmp;
	gridColsTmp = null; gridBorTmp = null;
	mgraphics.redraw();
}

// Nombre de lignes = la colonne la plus remplie
function gridRows() {
	var m = gridBor.length;
	for (var d = 0; d < 7; d++) { if (gridCols[d].length > m) m = gridCols[d].length; }
	return Math.max(1, m);
}

// =====================================================
// LAYOUT (recalculé dans paint ET onclick — cohérence garantie)
// =====================================================

var PAD    = 4;
var CFG_W  = 136;  // colonne CONFIG gauche (élargie pour la lisibilité)
var MON_W  = 96;   // colonne MONITOR droite
var HDR_H  = 15;   // bandeau des degrés
var KB_H   = 40;   // mini-clavier
var HOLD_H = 15;   // bouton HOLD/LATCH

// CONFIG : TONALITY | CHORD STYLE (pas de gap).
// HOLD est dans le MONITOR (feature de sortie, pas harmonique).
var CFG_ITEMS = ["keyscale","oct","voicing","vl","vlmode"];
var SYNC_W = 22;
function cfgKind(id) {
	if (id==="keyscale"||id==="voicing") return "sel";
	if (id==="oct") return "step";
	if (id==="_gap") return "gap";
	return "btn";
}
// Sous-rectangles de la rangée keyscale : SYNC (gauche) | KEY | SCALE
function ksSyncRect(r)  { return [ r[0], r[1], SYNC_W, r[3] ]; }
function ksKeyRect(r)   { var w = (r[2]-SYNC_W)*0.5; return [ r[0]+SYNC_W, r[1], w, r[3] ]; }
function ksScaleRect(r) { var w = (r[2]-SYNC_W)*0.5; return [ r[0]+SYNC_W+w, r[1], w, r[3] ]; }
function cfgWeight(id) {
	return 1.0;   // toutes les cases : même hauteur
}

function L() {
	var W = box.rect[2] - box.rect[0];
	var H = box.rect[3] - box.rect[1];

	var gridX   = CFG_W;
	var gridR   = W - MON_W;
	var gridW   = gridR - gridX;
	var colW    = gridW / 8;
	var gridTop = HDR_H;
	var gridBot = H - PAD;
	var gridH   = gridBot - gridTop;

	var nRows = gridRows();

	// En mode replié : pas de grille, le monitor vient juste après CONFIG
	var contentW, mGridR, mMonX, mMonW;
	if (collapsed) {
		mGridR  = CFG_W;
		mMonX   = CFG_W + PAD;
		mMonW   = MON_W - 2 * PAD;
		contentW = CFG_W + MON_W;
	} else {
		mGridR  = gridR;
		mMonX   = gridR;          // Seamless: pas de padding à gauche
		mMonW   = W - gridR;      // Seamless: utilise tout l'espace à droite
		contentW = W;
	}

	return {
		W:W, H:H, contentW:contentW,
		gridX:gridX, gridR:mGridR, gridW:gridW, colW:colW,
		gridTop:gridTop, gridH:gridH,
		rowH: gridH / nRows,
		nRows:nRows,
		monX: mMonX,
		monW: mMonW
	};
}

// Petit bouton flèche repli/dépli (coin haut-droit du contenu visible)
function collapseRect(l) {
	return [ l.contentW - 16, PAD, 12, 12 ];
}
// HOLD/LATCH : dans le MONITOR (feature de sortie/perf) — en bas sous le clavier
function holdRect(l) {
	return [ l.monX, l.H - PAD - HOLD_H, l.monW, HOLD_H ];
}

// Redimensionne le device via live.thisdevice (outlet 1).
// Envoie "setwidth <w>" → connecter l'outlet 1 du jsui à live.thisdevice.
function setDeviceWidth(w) {
	outlet(1, "setwidth", Math.round(w));
}

// Case grille (col 0..7, row i) — hauteur de ligne uniforme
function cellRect(l, col, row) {
	return [ l.gridX + col * l.colW, l.gridTop + row * l.rowH, l.colW - 1, l.rowH - 1 ];
}
// Rectangle d'un item CONFIG (par son index dans CFG_ITEMS).
// Hauteur proportionnelle au poids
function cfgRect(l, i) {
	var Ht = l.H - 2 * PAD;
	var total = 0;
	for (var t = 0; t < CFG_ITEMS.length; t++) total += cfgWeight(CFG_ITEMS[t]);
	var unit = Ht / total;
	var y = PAD;
	for (var k = 0; k < i; k++) y += cfgWeight(CFG_ITEMS[k]) * unit;
	var h = cfgWeight(CFG_ITEMS[i]) * unit;
	return [ PAD, y, CFG_W - 2 * PAD, h - 2 ];
}

function cfgWeight(id) {
	if (id === "oct") return 0.8;   // octave compact
	return 1.2;   // autres : plus grand
}
function cfgIndex(id) { for (var i=0;i<CFG_ITEMS.length;i++) if (CFG_ITEMS[i]===id) return i; return -1; }

// =====================================================
// DESSIN
// =====================================================

function paint() {
	var g = mgraphics;
	var l = L();

	// Au premier appel : sync l'état avec le moteur
	if (!initDone) {
		initDone = true;
		outlet(0, "requeststate");  // demande au moteur d'envoyer son état
	}

	g.set_source_rgba(COLORS.bg_main[0], COLORS.bg_main[1], COLORS.bg_main[2], 1.0);
	g.rectangle(0, 0, l.W, l.H);
	g.fill();
	g.select_font_face("Arial");

	drawConfig(g, l);
	if (!collapsed) drawGrid(g, l);
	drawMonitor(g, l);
	drawCollapse(g, l);

	// Overlay: teinte claire quand dropdown ouvert (rend le reste légèrement plus visible)
	if (openDropdown !== "") {
		g.set_source_rgba(1, 1, 1, 0.15);
		g.rectangle(0, 0, l.W, l.H);
		g.fill();
	}

	drawDropdown(g, l);   // par-dessus tout

	// Redraw continu pour animations (300ms max)
	if (animCurve(pressedCell, 300) > 0 ||
	    animCurve(pressedVL, 250) > 0 ||
	    animCurve(pressedVLMode, 250) > 0) {
		mgraphics.redraw();
	}
}


// ---------- MENU DÉROULANT ----------
function ddItems() {
	if (openDropdown === "key")     return NOTE_NAMES;
	if (openDropdown === "scale")   return SCALE_NAMES;
	if (openDropdown === "voicing") return VOICING_LIST;
	return [];
}
function ddCurrent() {
	if (openDropdown === "key")     return rootIdx;
	if (openDropdown === "scale")   return scaleIdx;
	if (openDropdown === "voicing") return voicingIdx;
	return -1;
}
// Popover superposé à la zone CONFIG (colonne gauche)
function ddLayout(l) {
	var items  = ddItems();
	var n      = items.length;
	var x0     = PAD * 2;
	var y0     = PAD * 2 + 14;   // 14 = hauteur titre
	var w      = CFG_W - PAD * 4;   // largeur des cellules remplit la colonne
	var h      = Math.min(l.H - PAD * 4 - 14, 160);   // hauteur augmentée pour remplir le menu
	var perRow = (openDropdown === "voicing") ? 2 : (openDropdown === "key") ? 3 : 2;
	var rows   = Math.ceil(n / perRow);
	var ch     = Math.max(h / rows, 20);   // hauteur cellule, min 20px
	return { n:n, items:items, x0:x0, y0:y0, w:w, perRow:perRow, cw:w/perRow, ch:ch };
}
function ddCellRect(dl, i) {
	var c = i % dl.perRow, r = Math.floor(i / dl.perRow);
	return [ dl.x0 + c * dl.cw, dl.y0 + r * dl.ch, dl.cw - 3, dl.ch - 3 ];
}
function drawDropdown(g, l) {
	if (openDropdown === "") return;
	var dl  = ddLayout(l);
	var cur = ddCurrent();

	// Fond opaque seulement sur la zone CONFIG
	var ddW = CFG_W;   // largeur complète de la colonne
	g.set_source_rgba(COLORS.bg_main[0], COLORS.bg_main[1], COLORS.bg_main[2], 1.0);
	g.rectangle(0, 0, ddW, l.H);   // couvre seulement la colonne CONFIG
	g.fill();

	// Cadre/bordure autour du menu déroulant (zone CONFIG seulement)
	g.set_source_rgba(0.25, 0.25, 0.28, 1.0);   // bordure foncée
	g.set_line_width(1.0);
	g.rectangle(0, 0, ddW, l.H);
	g.stroke();

	// Titre
	g.set_source_rgba(0.55, 0.55, 0.60, 1.0);
	g.set_font_size(8);
	g.move_to(dl.x0, PAD * 2 + 8);
	g.text_path(openDropdown.toUpperCase());
	g.fill();

	g.set_font_size(10);
	for (var i = 0; i < dl.n; i++) {
		var r  = ddCellRect(dl, i);
		var on = (i === cur);
		// couleur fond actif : doré pour KEY, bleu pour SCALE, blanc cassé pour VOICING/TYPES
		var br, bg, bb, tr, tg, tb;
		var isHov = (i === hoverDD && !on);
		if (on) {
			// Doré pour tous les sélecteurs (KEY, SCALE, VOICING) — cohérent
			if      (openDropdown === "key" || openDropdown === "voicing" || openDropdown === "scale")  { br=COLORS.gold_active[0]; bg=COLORS.gold_active[1]; bb=COLORS.gold_active[2]; tr=COLORS.text_dark[0]; tg=COLORS.text_dark[1]; tb=COLORS.text_dark[2]; }
		} else if (isHov) {
			br=COLORS.bg_hover[0]; bg=COLORS.bg_hover[1]; bb=COLORS.bg_hover[2]; tr=0.95; tg=0.95; tb=0.98;
		} else {
			br=COLORS.bg_cell[0]; bg=COLORS.bg_cell[1]; bb=COLORS.bg_cell[2]; tr=0.80; tg=0.80; tb=0.84;
		}
		g.set_source_rgba(br, bg, bb, 1.0);
		g.rectangle_rounded(r[0], r[1], r[2], r[3], 3, 3);
		g.fill();
		g.set_source_rgba(tr, tg, tb, 1.0);
		var t  = String(dl.items[i]);
		var tw = safeTextW(t, 10);
		g.move_to(r[0] + (r[2]-tw)*0.5, r[1] + r[3]*0.5 + 3.5);
		g.text_path(t);
		g.fill();
	}
}
function applyDropdown(i) {
	if (openDropdown === "key")     { rootIdx = i;    outlet(0,"rootidx",i); }
	else if (openDropdown === "scale")   { scaleIdx = i;   outlet(0,"scaleidx",i); }
	else if (openDropdown === "voicing") { voicingIdx = i; outlet(0,"voicingidx",i); }
}

// Flèche de repli/dépli
function drawCollapse(g, l) {
	var r = collapseRect(l);
	// Fond: bleu quand collapsed, gris sinon (+ hover feedback)
	if (collapsed) {
		g.set_source_rgba(COLORS.blue_accent[0], COLORS.blue_accent[1], COLORS.blue_accent[2], 1.0);
	} else if (hoverCollapse) {
		g.set_source_rgba(COLORS.bg_hover[0], COLORS.bg_hover[1], COLORS.bg_hover[2], 1.0);
	} else {
		g.set_source_rgba(COLORS.bg_cfg[0], COLORS.bg_cfg[1], COLORS.bg_cfg[2], 1.0);
	}
	g.rectangle_rounded(r[0], r[1], r[2], r[3], 2, 2);
	g.fill();
	g.set_source_rgba(0.85,0.85,0.90,1.0);
	g.set_font_size(10);
	var a = collapsed ? "▶" : "◀";
	g.move_to(r[0]+2, r[1]+r[3]-2);
	g.text_path(a);
	g.fill();
}

// ---------- CONFIG (gauche) ----------
// TONALITY : [KEY | SCALE | sync]   |   CHORD STYLE : OCT / VOICING / VL / VLMODE
function drawConfig(g, l) {
	var ks = cfgRect(l, cfgIndex("keyscale"));
	drawSyncButton(g, ksSyncRect(ks));
	drawSelector (g, ksKeyRect(ks),   "KEY",   NOTE_NAMES[rootIdx],  openDropdown==="key",   hoverCfg==="key",   pressedKeyscale);
	drawSelector (g, ksScaleRect(ks), "SCALE", SCALE_ABBR[scaleIdx], openDropdown==="scale", hoverCfg==="scale", pressedKeyscale);

	drawOctaveSelector(g, cfgRect(l,cfgIndex("oct")));
	drawSelector (g, cfgRect(l,cfgIndex("voicing")), "VOICING", VOICING_LIST[voicingIdx], openDropdown==="voicing", hoverCfg==="voicing", pressedVoicing);
	// VOICE LEADING button
	var vlRect = cfgRect(l, cfgIndex("vl"));
	drawCfgButton(g, vlRect, "VOICE LEADING", vlEnabled, hoverCfg==="vl", pressedVL);

	// VL MODE button (3 states: ANCHOR=doré, RELATIVE=bleu, PIANO=doré)
	var vlmRect = cfgRect(l, cfgIndex("vlmode"));
	drawVLModeButton(g, vlmRect, vlMode, hoverCfg==="vlmode", pressedVLMode);
}

// Sélecteur octave : -3 -2 -1 0 +1 +2 +3
function drawOctaveSelector(g, r) {
	var values = [-3, -2, -1, 0, 1, 2, 3];
	var n = values.length;
	var cellW = r[2] / n;
	var now = Date.now();

	g.set_font_size(8);
	for (var i = 0; i < n; i++) {
		var cellR = [r[0] + i * cellW, r[1], cellW - 1, r[3]];
		var isActive = (values[i] === octave);
		var isHoverOct = (Math.abs(hoverOctave - i) < 0.5);
		var isPressed = (now - pressedOct) < 150;

		// Fond
		if (isActive) {
			g.set_source_rgba(COLORS.gold_active[0], COLORS.gold_active[1], COLORS.gold_active[2], 1.0);
		} else if (isPressed && isHoverOct) {
			g.set_source_rgba(COLORS.bg_hover[0]*0.85, COLORS.bg_hover[1]*0.85, COLORS.bg_hover[2]*0.85, 1.0);
		} else if (isHoverOct) {
			g.set_source_rgba(COLORS.bg_hover[0], COLORS.bg_hover[1], COLORS.bg_hover[2], 1.0);
		} else {
			g.set_source_rgba(COLORS.bg_cfg[0], COLORS.bg_cfg[1], COLORS.bg_cfg[2], 1.0);
		}
		g.rectangle_rounded(cellR[0], cellR[1], cellR[2], cellR[3], 2, 2);
		g.fill();

		// Label
		var label = (values[i] > 0 ? "+" : "") + values[i];
		g.set_source_rgba(isActive ? COLORS.text_dark[0] : COLORS.text_white[0], isActive ? COLORS.text_dark[1] : COLORS.text_white[1], isActive ? COLORS.text_dark[2] : COLORS.text_white[2], 1.0);
		var tw = safeTextW(label, 8);
		g.move_to(cellR[0] + (cellR[2] - tw) * 0.5, cellR[1] + cellR[3] * 0.5 + 2);
		g.text_path(label);
		g.fill();
	}
}

// Bouton SYNC avec feedback hover/press
function drawSyncButton(g, r) {
	var now = Date.now();
	var isPressed = (now - syncPressed) < 150;   // feedback 150ms

	// Fond : feedback visuel selon état
	// Quand pressé: inverser les couleurs (fond = doré, texte = sombre)
	var bgColor, textColor;
	if (isPressed) {
		bgColor = COLORS.gold_active;   // fond devient doré
		textColor = COLORS.bg_cfg;       // texte devient sombre
	} else if (hoverSync) {
		bgColor = COLORS.bg_hover;       // hover : éclairé
		textColor = COLORS.gold_hover;   // texte plus clair
	} else {
		bgColor = COLORS.bg_cfg;         // repos : cohérent
		textColor = COLORS.gold_active;  // texte doré
	}
	g.set_source_rgba(bgColor[0], bgColor[1], bgColor[2], 1.0);
	g.rectangle_rounded(r[0], r[1], r[2], r[3], 3, 3);
	g.fill();

	// Diapason ASCII : couleur inverse du fond
	g.set_source_rgba(textColor[0], textColor[1], textColor[2], 1.0);
	g.set_font_size(11);
	var tw = 6;
	g.move_to(r[0] + r[2] * 0.5 - tw * 0.5, r[1] + r[3] * 0.5 + 2);
	g.text_path("♪");
	g.fill();
}

// Sélecteur à menu déroulant (KEY, SCALE, VOICING)
function drawSelector(g, r, label, value, isOpen, isHover, pressTime) {
	var now = Date.now();
	var isPressed = (now - pressTime) < 150;

	// fond : feedback hover/press
	if (isOpen) {
		g.set_source_rgba(COLORS.bg_hover[0]*0.9, COLORS.bg_hover[1]*0.9, COLORS.bg_hover[2]*0.9, 1.0);
	} else if (isPressed) {
		g.set_source_rgba(COLORS.bg_hover[0], COLORS.bg_hover[1], COLORS.bg_hover[2], 1.0);
	} else if (isHover) {
		g.set_source_rgba(COLORS.bg_hover[0], COLORS.bg_hover[1], COLORS.bg_hover[2], 1.0);
	} else {
		g.set_source_rgba(COLORS.bg_cfg[0], COLORS.bg_cfg[1], COLORS.bg_cfg[2], 1.0);
	}
	g.rectangle_rounded(r[0], r[1], r[2], r[3], 3, 3);
	g.fill();
	if (isOpen) {
		g.set_source_rgba(0.86, 0.86, 0.90, 0.55);
		g.set_line_width(1.0);
		g.rectangle_rounded(r[0], r[1], r[2], r[3], 3, 3);
		g.stroke();
	}

	// Label petit en haut (removed for cleaner UI)
	// var labelFs = 8;
	// g.set_source_rgba(0.48, 0.48, 0.54, 1.0);
	// g.set_font_size(labelFs);
	// g.move_to(r[0]+6, r[1] + labelFs + 2);
	// g.text_path(label);
	// g.fill();

	// Valeur centré au milieu
	// KEY/SCALE/VOICING: tous au milieu, tailles adaptées
	var valFs = (label === "VOICING") ? 9 : Math.max(10, Math.min(13, r[3] * 0.50));
	// CLASSIC en gris, autres voicings en doré
	var isClassic = (label === "VOICING" && value === "CLASSIC");
	g.set_source_rgba(isClassic ? 0.80 : COLORS.gold_active[0], isClassic ? 0.80 : COLORS.gold_active[1], isClassic ? 0.82 : COLORS.gold_active[2], 1.0);
	g.set_font_size(valFs);
	var vw = safeTextW(value, valFs);
	var vy = r[1] + r[3] * 0.5 + 2;  // Tous centré au milieu
	g.move_to(r[0]+(r[2]-vw)*0.5, vy);
	g.text_path(value);
	g.fill();

	// caret ▾ (pointe vers haut quand ouvert)
	g.set_source_rgba(isOpen?0.80:0.55, isOpen?0.80:0.55, isOpen?0.85:0.62, 1.0);
	g.set_font_size(9);
	g.move_to(r[0]+r[2]-11, vy);
	g.text_path(isOpen ? "▴" : "▾");
	g.fill();
}

function drawStepper(g, r, label, value, isHover, pressTime) {
	var now = Date.now();
	var isPressed = (now - pressTime) < 150;

	// fond : feedback hover/press
	if (isPressed) {
		g.set_source_rgba(COLORS.bg_hover[0]*0.8, COLORS.bg_hover[1]*0.8, COLORS.bg_hover[2]*0.8, 1.0);
	} else if (isHover) {
		g.set_source_rgba(COLORS.bg_hover[0]*0.8, COLORS.bg_hover[1]*0.8, COLORS.bg_hover[2]*0.8, 1.0);
	} else {
		g.set_source_rgba(COLORS.bg_cell[0], COLORS.bg_cell[1], COLORS.bg_cell[2], 1.0);
	}
	g.rectangle_rounded(r[0], r[1], r[2], r[3], 3, 3);
	g.fill();

	// tailles adaptatives selon la hauteur du slot
	var labelFs = Math.max(7, Math.min(9,  r[3] * 0.30));
	var valueFs = Math.max(9, Math.min(14, r[3] * 0.46));

	// label en haut (discret)
	g.set_source_rgba(0.48,0.48,0.54,1.0);
	g.set_font_size(labelFs);
	g.move_to(r[0]+6, r[1] + labelFs + 2);
	g.text_path(label);
	g.fill();

	// ligne valeur (en bas) : ◀  valeur  ▶
	var vy = r[1] + r[3] - 5;

	g.set_source_rgba(0.55,0.55,0.62,1.0);
	g.set_font_size(valueFs);
	g.move_to(r[0]+5, vy);
	g.text_path("◀");
	g.fill();
	g.move_to(r[0]+r[2]-valueFs-2, vy);
	g.text_path("▶");
	g.fill();

	g.set_source_rgba(0.96,0.86,0.46,1.0);   // valeur en doré, bien visible
	var vw = safeTextW(value, valueFs);
	g.move_to(r[0]+(r[2]-vw)*0.5, vy);
	g.text_path(value);
	g.fill();
}

function drawCfgButton(g, r, txt, on, isHover, pressTime) {
	var now = Date.now();
	var isPressed = (now - pressTime) < 150;

	// Feedback : ON couleur de base, sinon repos/hover/press
	if (on) {
		if (isPressed) g.set_source_rgba(COLORS.gold_active[0]*0.85, COLORS.gold_active[1]*0.85, COLORS.gold_active[2]*0.85, 1.0);
		else if (isHover) g.set_source_rgba(COLORS.gold_hover[0], COLORS.gold_hover[1], COLORS.gold_hover[2], 1.0);
		else g.set_source_rgba(COLORS.gold_active[0], COLORS.gold_active[1], COLORS.gold_active[2], 1.0);
	} else {
		if (isPressed) g.set_source_rgba(0.22, 0.22, 0.25, 1.0);
		else if (isHover) g.set_source_rgba(0.22, 0.22, 0.25, 1.0);
		else g.set_source_rgba(COLORS.bg_cfg[0], COLORS.bg_cfg[1], COLORS.bg_cfg[2], 1.0);
	}
	g.rectangle_rounded(r[0], r[1], r[2], r[3], 3, 3);
	g.fill();

	g.set_source_rgba(on ? COLORS.text_dark[0] : 0.72, on ? COLORS.text_dark[1] : 0.72, on ? COLORS.text_dark[2] : 0.75, 1.0);
	g.set_font_size(9);
	var tw = safeTextW(txt, 9);
	g.move_to(r[0]+(r[2]-tw)*0.5, r[1]+r[3]*0.5+3);
	g.text_path(txt);
	g.fill();
}

function drawVLModeButton(g, r, mode, isHover, pressTime) {
	var now = Date.now();
	var isPressed = (now - pressTime) < 150;

	// Couleur selon le mode : ANCHOR=gris (comme VOICE LEADING OFF), RELATIVE=bleu, PIANO=doré
	var br, bg, bb;
	if (mode === "anchored") {
		// Gris cohérent avec VOICE LEADING OFF: bg_cfg au repos, 0.22,0.22,0.25 au hover/press
		if (isPressed || isHover) {
			br = 0.22; bg = 0.22; bb = 0.25;
		} else {
			br = COLORS.bg_cfg[0]; bg = COLORS.bg_cfg[1]; bb = COLORS.bg_cfg[2];
		}
	} else if (mode === "relative") {
		br = COLORS.blue_accent[0]; bg = COLORS.blue_accent[1]; bb = COLORS.blue_accent[2];
	} else { // PIANO = doré
		br = COLORS.gold_active[0]; bg = COLORS.gold_active[1]; bb = COLORS.gold_active[2];
	}

	// Apply hover/press darkening (only for RELATIVE and PIANO)
	if (mode !== "anchored") {
		if (isPressed) {
			br *= 0.85; bg *= 0.85; bb *= 0.85;
		} else if (isHover) {
			br *= 1.05; bg *= 1.05; bb *= 1.05;
		}
	}

	g.set_source_rgba(br, bg, bb, 1.0);
	g.rectangle_rounded(r[0], r[1], r[2], r[3], 3, 3);
	g.fill();

	// Texte: gris clair pour ANCHOR, dark pour RELATIVE et PIANO
	var lbl = (mode==="anchored")?"ANCHOR":(mode==="relative")?"RELATIVE":"PIANO";
	var textColor = (mode === "anchored") ? COLORS.text_dim : COLORS.text_dark;
	g.set_source_rgba(textColor[0], textColor[1], textColor[2], 1.0);
	g.set_font_size(9);
	var tw = safeTextW(lbl, 9);
	g.move_to(r[0]+(r[2]-tw)*0.5, r[1]+r[3]*0.5+3);
	g.text_path(lbl);
	g.fill();
}

// ---------- GRILLE 8 colonnes ----------
function drawGrid(g, l) {
	// Bandeau des degrés — tous en doré
	for (var c = 0; c < 7; c++) {
		g.set_source_rgba(COLORS.gold_active[0], COLORS.gold_active[1], COLORS.gold_active[2], 0.90);
		g.set_font_size(9);
		var lbl = DEG_NAMES[c];
		var func = DEG_FUNCTIONS[c];
		var combined = lbl + " " + func;
		var cw = safeTextW(combined, 9);
		g.move_to(l.gridX + c*l.colW + (l.colW-cw)*0.5, l.gridTop-4);
		g.text_path(combined);
		g.fill();
	}
	// en-tête BORROWED en bleu cyan
	g.set_source_rgba(COLORS.blue_accent[0], COLORS.blue_accent[1], COLORS.blue_accent[2], 1.0);
	g.set_font_size(9);
	var bh = "BORROWED";
	var bhw = safeTextW(bh, 9);
	g.move_to(l.gridX + 7*l.colW + (l.colW-bhw)*0.5, l.gridTop-4);
	g.text_path(bh);
	g.fill();

	// Cases diatoniques — grille reçue du moteur (contiguës)
	for (var col = 0; col < 7; col++) {
		var cc = gridCols[col];
		for (var row = 0; row < cc.length; row++) {
			var rect = cellRect(l, col, row);
			var isAct = (activeCol === col && activeRow === row);
			var isHov = (hoverCell === col * 100 + row);
			drawCell(g, rect, true, cc[row].label, isAct, false, "", isHov);
		}
	}

	// Colonne BORROWED
	for (var i = 0; i < gridBor.length; i++) {
		var c = gridBor[i];
		var rect2 = cellRect(l, 7, i);
		var isAct2 = (activeCol === 7 && activeRow === i);
		var isHov2 = (hoverCell === 700 + i);
		drawCell(g, rect2, true, c.label, isAct2, true, c.roman, isHov2);
	}
}

function drawCell(g, r, valid, label, isAct, borrowed, roman, isHov) {
	// Fond
	if (!valid) {
		g.set_source_rgba(0.13, 0.13, 0.14, 1.0);
	} else if (isAct) {
		g.set_source_rgba(COLORS.blue_accent[0], COLORS.blue_accent[1], COLORS.blue_accent[2], 1.0);
	} else if (isHov) {
		g.set_source_rgba(COLORS.bg_hover[0], COLORS.bg_hover[1], COLORS.bg_hover[2], 1.0);
	} else {
		g.set_source_rgba(COLORS.bg_cell[0], COLORS.bg_cell[1], COLORS.bg_cell[2], 1.0);
	}
	g.rectangle_rounded(r[0], r[1], r[2], r[3], 3, 3);
	g.fill();

	if (!valid) return;

	// Bordure : gris normal, bleu si actif (raised button)
	if (isAct) {
		g.set_source_rgba(COLORS.blue_accent[0], COLORS.blue_accent[1], COLORS.blue_accent[2], 1.0);
		g.set_line_width(1.5);
		// shadow simulé (offset 1px noir)
		g.set_source_rgba(0, 0, 0, 0.18);
		g.rectangle_rounded(r[0]+1, r[1]+1, r[2], r[3], 3, 3);
		g.fill();
		// re-fill fond par-dessus
		g.set_source_rgba(COLORS.blue_accent[0], COLORS.blue_accent[1], COLORS.blue_accent[2], 1.0);
		g.rectangle_rounded(r[0], r[1], r[2], r[3], 3, 3);
		g.fill();
		g.set_source_rgba(1.0, 1.0, 1.0, 0.4);
		g.set_line_width(1.5);
		g.rectangle_rounded(r[0], r[1], r[2], r[3], 3, 3);
		g.stroke();
	} else if (isHov) {
		g.set_source_rgba(0.55, 0.55, 0.60, 0.5);
		g.set_line_width(1.0);
		g.rectangle_rounded(r[0], r[1], r[2], r[3], 3, 3);
		g.stroke();
	}
	// Pas de bordure sur les cases normales — remplacé par le cadre global

	// Texte
	if (isAct) g.set_source_rgba(COLORS.text_dark[0], COLORS.text_dark[1], COLORS.text_dark[2], 1.0);
	else       g.set_source_rgba(COLORS.text_white[0], COLORS.text_white[1], COLORS.text_white[2], 1.0);
	var fs = Math.min(15, r[3]*0.6);
	g.set_font_size(fs);

	if (borrowed && roman) {
		var combined = label + " " + roman;
		var cw = safeTextW(combined, fs);
		g.move_to(r[0]+(r[2]-cw)*0.5, r[1]+r[3]*0.5+fs*0.25);
		g.text_path(combined);
		g.fill();
	} else {
		var tw = safeTextW(label, fs);
		g.move_to(r[0]+(r[2]-tw)*0.5, r[1]+r[3]*0.5+fs*0.35);
		g.text_path(label);
		g.fill();
	}
}

// ---------- MONITOR (droite) ----------
var WHITE_SEMI = [0,2,4,5,7,9,11];

function midiName(n) {
	var pc = ((n % 12) + 12) % 12;
	var oct = Math.floor(n / 12) - 2;
	return NOTE_NAMES[pc] + oct;
}
function kbRange() {
	if (activeNotes.length === 0) return { low:48, oct:2 };
	var mn = Math.min.apply(null, activeNotes), mx = Math.max.apply(null, activeNotes);
	var low = Math.floor(mn/12)*12, high = Math.ceil((mx+1)/12)*12;
	return { low:low, oct:Math.max(2,(high-low)/12) };
}
function isNoteActive(m) {
	for (var i=0;i<activeNotes.length;i++) if (activeNotes[i]===m) return true;
	return false;
}

function drawMonitor(g, l) {
	var x0 = l.monX, w = l.monW;

	// titre
	g.set_source_rgba(0.5,0.5,0.55,1.0);
	g.set_font_size(8);
	g.move_to(x0, 11);
	g.text_path("MONITOR");
	g.fill();

	// noms de notes
	var kbY = l.H - PAD - HOLD_H - PAD - KB_H;  // clavier réduit pour faire place à HOLD en bas
	if (activeNotes.length === 0) {
		g.set_source_rgba(0.4,0.4,0.4,1.0);
		g.set_font_size(11);
		g.move_to(x0, 44);
		g.text_path("—");
		g.fill();
	} else {
		var sorted = activeNotes.slice().sort(function(a,b){return a-b;});
		g.set_source_rgba(COLORS.blue_accent[0], COLORS.blue_accent[1], COLORS.blue_accent[2], 1.0);
		g.set_font_size(11);
		var lineH = 15, listTop = 38;
		var perCol = Math.max(1, Math.floor((kbY - listTop) / lineH));
		var colW2 = w/2;
		for (var k=0;k<sorted.length;k++){
			var ci = Math.floor(k/perCol), ri = k%perCol;
			if (ci > 1) break;
			g.move_to(x0 + ci*colW2, listTop + ri*lineH + 8);
			g.text_path(midiName(sorted[k]));
			g.fill();
		}
	}

	// mini-clavier
	var rng = kbRange(), nWhite = 7*rng.oct, wkW = w/nWhite;
	for (var o=0;o<rng.oct;o++){
		for (var i=0;i<7;i++){
			var midi = rng.low + o*12 + WHITE_SEMI[i];
			var wx = x0 + (o*7+i)*wkW;
			var wa = isNoteActive(midi);
			g.set_source_rgba(wa?COLORS.blue_accent[0]:0.90, wa?COLORS.blue_accent[1]:0.90, wa?COLORS.blue_accent[2]:0.90, 1.0);
			g.rectangle(wx, kbY, wkW-1, KB_H);
			g.fill();
		}
	}
	var bkW = wkW*0.6;
	for (var o2=0;o2<rng.oct;o2++){
		for (var j=0;j<7;j++){
			if (j===2||j===6) continue;
			var m2 = rng.low + o2*12 + WHITE_SEMI[j]+1;
			var bx = x0 + (o2*7+j+1)*wkW - bkW*0.5;
			var ba = isNoteActive(m2);
			g.set_source_rgba(ba?COLORS.blue_accent[0]*0.8:0.12, ba?COLORS.blue_accent[1]*0.6:0.12, ba?COLORS.blue_accent[2]*0.4:0.13, 1.0);
			g.rectangle(bx, kbY, bkW, KB_H*0.62);
			g.fill();
		}
	}
	g.set_source_rgba(0.3,0.3,0.3,1.0);
	g.rectangle(x0, kbY, w, KB_H); g.set_line_width(1.0); g.stroke();

	// HOLD / LATCH (en bas sous le clavier) — seamless like VOICE LEADING
	var hr = holdRect(l);
	var now = Date.now();
	var holdPressed = (now - pressedCell) < 150;  // reuse pressedCell for visual feedback

	// Same style as drawCfgButton: ON=gold, OFF=bg_cfg, with hover/press feedback
	if (latchMode) {
		if (holdPressed) g.set_source_rgba(COLORS.gold_active[0]*0.85, COLORS.gold_active[1]*0.85, COLORS.gold_active[2]*0.85, 1.0);
		else if (hoverHold) g.set_source_rgba(COLORS.gold_hover[0], COLORS.gold_hover[1], COLORS.gold_hover[2], 1.0);
		else g.set_source_rgba(COLORS.gold_active[0], COLORS.gold_active[1], COLORS.gold_active[2], 1.0);
	} else {
		if (hoverHold) g.set_source_rgba(COLORS.bg_hover[0], COLORS.bg_hover[1], COLORS.bg_hover[2], 1.0);
		else g.set_source_rgba(COLORS.bg_cfg[0], COLORS.bg_cfg[1], COLORS.bg_cfg[2], 1.0);
	}
	g.rectangle_rounded(hr[0], hr[1], hr[2], hr[3], 3, 3);
	g.fill();

	// Text label: HOLD / LATCH (style like drawCfgButton)
	g.set_source_rgba(latchMode ? COLORS.text_dark[0] : 0.72, latchMode ? COLORS.text_dark[1] : 0.72, latchMode ? COLORS.text_dark[2] : 0.75, 1.0);
	g.set_font_size(9);
	var ht = latchMode ? "LATCH" : "HOLD";
	var htw = safeTextW(ht, 9);
	g.move_to(hr[0]+(hr[2]-htw)*0.5, hr[1]+hr[3]*0.5+3);
	g.text_path(ht);
	g.fill();
}

function safeTextW(str, fs) {
	try { var m = mgraphics.text_measure(str); if (m && m[0] > 0) return m[0]; } catch(e) {}
	return String(str).length * fs * 0.58;
}

// =====================================================
// INTERACTION
// =====================================================

function playCell(col, row, fn, semis, type) {
	// gère HOLD / LATCH de façon unifiée
	var isActiveCell = (col === activeCol && row === activeRow);
	if (latchMode && isActiveCell) {
		activeCol = -1; activeRow = -1;
		outlet(0, "release");
	} else {
		activeCol = col; activeRow = row;
		if (col === 7) outlet(0, "colorchord", semis, type);
		else           outlet(0, fn, col);
	}
	mgraphics.redraw();
}

function onidleout(x, y, but) {
	// souris quitte le jsui — pas de fermeture ici, géré par mousestate patcher
}

function closemenu() {
	var now = Date.now();
	if (now - lastClickInJsui > 100) {   // 100ms délai : ignore les clics jsui récents
		if (openDropdown !== "") { openDropdown = ""; hoverDD = -1; mgraphics.redraw(); }
	}
}

function onidle(x, y, but) {
	var l = L();

	// Si dropdown ouvert: désactiver hover sur le reste du device
	if (openDropdown !== "") {
		// Réinitialiser les hovers du reste du device
		var needRedraw = false;
		if (hoverSync !== false) { hoverSync = false; needRedraw = true; }
		if (hoverCfg !== "") { hoverCfg = ""; needRedraw = true; }
		if (hoverOctave !== -1) { hoverOctave = -1; needRedraw = true; }
		if (hoverCell !== -1) { hoverCell = -1; needRedraw = true; }
		if (hoverHold !== false) { hoverHold = false; needRedraw = true; }
		if (hoverCollapse !== false) { hoverCollapse = false; needRedraw = true; }

		// Calculer seulement le hover du dropdown
		var dl = ddLayout(l);
		var found = -1;
		for (var i = 0; i < dl.n; i++) { if (hit(x, y, ddCellRect(dl, i))) { found = i; break; } }
		if (found !== hoverDD) { hoverDD = found; needRedraw = true; }
		if (needRedraw) mgraphics.redraw();
		return;
	}

	var ks = cfgRect(l, cfgIndex("keyscale"));

	// Hover SYNC
	var syncR = ksSyncRect(ks);
	var newHoverSync = hit(x, y, syncR);
	if (newHoverSync !== hoverSync) { hoverSync = newHoverSync; mgraphics.redraw(); }

	// Hover config buttons + octave selector
	var newHoverCfg = "";
	var newHoverOctave = -1;
	// Hover sur les sous-zones keyscale
	var ks2 = cfgRect(l, cfgIndex("keyscale"));
	if (hit(x, y, ksKeyRect(ks2)))   newHoverCfg = "key";
	if (hit(x, y, ksScaleRect(ks2))) newHoverCfg = "scale";

	["oct", "voicing", "vl", "vlmode"].forEach(function(id) {
		if (hit(x, y, cfgRect(l, cfgIndex(id)))) {
			newHoverCfg = id;
			if (id === "oct") {
				var octR = cfgRect(l, cfgIndex("oct"));
				var cellW = octR[2] / 7;
				newHoverOctave = Math.floor((x - octR[0]) / cellW);
				if (newHoverOctave < 0 || newHoverOctave > 6) newHoverOctave = -1;
			}
		}
	});
	if (newHoverCfg !== hoverCfg || newHoverOctave !== hoverOctave) {
		hoverCfg = newHoverCfg;
		hoverOctave = newHoverOctave;
		mgraphics.redraw();
	}

	// Hover cellules grille
	var newHoverCell = -1;
	for (var col = 0; col < 7; col++) {
		for (var row = 0; row < gridCols[col].length; row++) {
			if (hit(x, y, cellRect(l, col, row))) {
				newHoverCell = col * 100 + row;
			}
		}
	}
	for (var i = 0; i < gridBor.length; i++) {
		if (hit(x, y, cellRect(l, 7, i))) {
			newHoverCell = 700 + i;
		}
	}
	if (newHoverCell !== hoverCell) { hoverCell = newHoverCell; mgraphics.redraw(); }

	// Hover bouton HOLD
	var newHoverHold = hit(x, y, holdRect(l));
	if (newHoverHold !== hoverHold) { hoverHold = newHoverHold; mgraphics.redraw(); }

	// Hover bouton COLLAPSE
	var newHoverCollapse = hit(x, y, collapseRect(l));
	if (newHoverCollapse !== hoverCollapse) { hoverCollapse = newHoverCollapse; mgraphics.redraw(); }

	if (hoverDD !== -1) { hoverDD = -1; mgraphics.redraw(); }
	var dl = ddLayout(l);
	var found = -1;
	for (var i = 0; i < dl.n; i++) { if (hit(x, y, ddCellRect(dl, i))) { found = i; break; } }
	if (found !== hoverDD) { hoverDD = found; mgraphics.redraw(); }
}

function onclick(x, y, but, cmd, shift, capslock, option, ctrl) {
	lastClickInJsui = Date.now();
	var l = L();

	// ----- Menu déroulant ouvert : priorité absolue -----
	if (openDropdown !== "") {
		var dl = ddLayout(l);
		for (var di = 0; di < dl.n; di++) {
			if (hit(x, y, ddCellRect(dl, di))) { applyDropdown(di); openDropdown=""; hoverDD=-1; mgraphics.redraw(); return; }
		}
		openDropdown = ""; hoverDD = -1;   // clic hors cellule → ferme
		mgraphics.redraw();
		return;
	}

	// ----- Flèche repli/dépli -----
	if (hit(x,y,collapseRect(l))) {
		if (!collapsed) {
			fullW = box.rect[2] - box.rect[0];   // mémorise la largeur dépliée
			collapsed = true;
			setDeviceWidth(CFG_W + MON_W);
		} else {
			collapsed = false;
			setDeviceWidth(fullW > 0 ? fullW : (CFG_W + MON_W + 480));
		}
		mgraphics.redraw();
		return;
	}

	// ----- HOLD / LATCH (dans le monitor) -----
	if (hit(x,y,holdRect(l))) {
		latchMode = !latchMode;
		if (!latchMode && activeCol>=0){ activeCol=-1; activeRow=-1; outlet(0,"release"); }
		mgraphics.redraw(); return;
	}

	// ----- CONFIG : TONALITY [KEY|SCALE|sync] + CHORD STYLE (oct/voicing/vl/vlmode) -----
	var ks = cfgRect(l, cfgIndex("keyscale"));
	if (hit(x,y,ksSyncRect(ks)))  { syncPressed = Date.now(); outlet(0, "synclive"); mgraphics.redraw(); return; }
	if (hit(x,y,ksKeyRect(ks)))   { openDropdown = "key";   mgraphics.redraw(); return; }
	if (hit(x,y,ksScaleRect(ks))) { openDropdown = "scale"; mgraphics.redraw(); return; }
	if (hit(x,y,cfgRect(l,cfgIndex("oct")))) {
		pressedOct = Date.now();
		var octR = cfgRect(l, cfgIndex("oct"));
		var cellW = octR[2] / 7;
		var idx = Math.floor((x - octR[0]) / cellW);
		if (idx >= 0 && idx <= 6) {
			var newOct = idx - 3;   // -3 à +3
			if (newOct !== octave) { octave = newOct; outlet(0, "octave", octave); }
		}
		mgraphics.redraw();
		return;
	}
	if (hit(x,y,cfgRect(l,cfgIndex("voicing")))) { pressedVoicing = Date.now(); openDropdown = "voicing"; mgraphics.redraw(); return; }
	if (hit(x,y,cfgRect(l,cfgIndex("vl"))))      { pressedVL = Date.now(); vlEnabled = !vlEnabled; outlet(0,"voiceleading", vlEnabled?"on":"off"); mgraphics.redraw(); return; }
	if (hit(x,y,cfgRect(l,cfgIndex("vlmode")))) { pressedVLMode = Date.now();
		vlMode = (vlMode==="anchored")?"relative":(vlMode==="relative")?"piano":"anchored";
		outlet(0,"vlmode",vlMode); mgraphics.redraw(); return;
	}

	// ----- Grille (cachée en mode replié) -----
	if (collapsed) return;

	// ----- BORROWED (8e colonne) -----
	for (var bi=0; bi<gridBor.length; bi++){
		if (hit(x,y,cellRect(l,7,bi))){ var c=gridBor[bi]; playCell(7, bi, null, c.semis, c.type); return; }
	}

	// ----- Cases diatoniques -----
	for (var col=0; col<7; col++){
		var cc = gridCols[col];
		for (var row=0; row<cc.length; row++){
			if (hit(x,y,cellRect(l,col,row))){
				playCell(col, row, cc[row].fn, 0, null);
				return;
			}
		}
	}
}

// relâchement souris → note-off en mode HOLD
function ondrag(x, y, but) {
	if (but === 0 && !latchMode && activeCol >= 0) {
		activeCol = -1; activeRow = -1;
		outlet(0, "release");
		mgraphics.redraw();
	}
}

function hit(x, y, r) { return x>=r[0] && x<=r[0]+r[2] && y>=r[1] && y<=r[1]+r[3]; }

function stepKey(x, r) {
	if (x < r[0] + r[2]*0.5) rootIdx = (rootIdx + 11) % 12;
	else                     rootIdx = (rootIdx + 1) % 12;
	outlet(0, "rootidx", rootIdx);
	mgraphics.redraw();
}
function stepScale(x, r) {
	if (x < r[0] + r[2]*0.5) scaleIdx = (scaleIdx + 6) % 7;
	else                     scaleIdx = (scaleIdx + 1) % 7;
	outlet(0, "scaleidx", scaleIdx);
	mgraphics.redraw();
}
function stepVoicing(x, r) {
	var n = VOICING_LIST.length;
	if (x < r[0] + r[2]*0.5) voicingIdx = (voicingIdx + n - 1) % n;
	else                     voicingIdx = (voicingIdx + 1) % n;
	outlet(0, "voicingidx", voicingIdx);
	mgraphics.redraw();
}

function stepOct(x, r) {
	var third = r[2]/4;
	if (x < r[0] + third)            { octave = Math.max(OCT_MIN, octave-1); sendOct(); }
	else if (x > r[0] + r[2]-third)  { octave = Math.min(OCT_MAX, octave+1); sendOct(); }
	else {
		var now = (new Date()).getTime();
		if (now - lastOctClick < 400) { octave = 0; sendOct(); lastOctClick = 0; }
		else lastOctClick = now;
	}
}
function sendOct() { outlet(0, "octave", octave); mgraphics.redraw(); }

// =====================================================
// INIT
// =====================================================

mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;
post("CHORD UI (horizontal) LOADED\n");

// Demande la grille au moteur (différé le temps que tout soit prêt)
var reqGridTask = new Task(function(){ outlet(0, "requestgrid"); }, this);
reqGridTask.schedule(400);

function read() { /* fichier déjà chargé */ }
