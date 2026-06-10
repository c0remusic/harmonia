post("CHORD ENGINE v5 LOADED\n");

autowatch = 1;
// outlet 0   = velocity (partagé, tire TOUJOURS en premier)
// outlets 1..6 = pitch voix 1..6
// outlet 7   = feedback UI → "active <fn> <degree>" → jsui chord_ui
outlets = 8;
inlets  = 2;  // inlet 0 = messages accord/config, inlet 1 = velocity

var lastFn           = "triad";
var lastDegree       = 0;
var lastFnLocked     = null;    // Dernier accord avec voicing verrouillée
var lastDegreeLocked = null;

// =====================================================
// GAMMES
// =====================================================

var SCALES = {
	"major":      [0,2,4,5,7,9,11],
	"minor":      [0,2,3,5,7,8,10],
	"dorian":     [0,2,3,5,7,9,10],
	"phrygian":   [0,1,3,5,7,8,10],
	"lydian":     [0,2,4,6,7,9,11],
	"mixolydian": [0,2,4,5,7,9,10],
	"harmminor":  [0,2,3,5,7,8,11]
};

var NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
var NOTE_TO_PC = {
	"C":0,"C#":1,"D":2,"D#":3,"E":4,"F":5,
	"F#":6,"G":7,"G#":8,"A":9,"A#":10,"B":11
};

var root                = 0;
var scale               = SCALES["major"];
var scaleName           = "major";
var currentOctave       = 0;
var currentVelocity     = 100;
var currentVoicing      = "classic";
var voiceLeadingEnabled = false;
var previousChord       = null;
var activeNotes         = [];
var voicingCache        = {};   // mode relative : mémorise le voicing par accord
var vlMode              = "anchored";  // "anchored" | "relative" | "piano"
var relativeCounter     = 0;    // counter pour éviter la dérive en mode relative
var lockedVoicing        = null;  // mémorise la forme du premier accord joué

// =====================================================
// INLET 1 — velocity
// =====================================================

function msg_int(v) {
	if (inlet === 1) {
		currentVelocity = parseInt(v);
	}
}

// Adaptateur d'entrée jweb. Un [jweb] qui fait window.max.outlet('nine', 5)
// n'émet PAS un message-sélecteur "nine 5" mais une LISTE [nine, 5]. Max appelle
// donc list() au lieu de nine(). On redispatch ici le 1er élément (sélecteur) vers
// la vraie fonction du moteur. Aucune logique harmonique ici — pur routage.
// (Les messages à 1 seul argument — requestgrid, requeststate, synclive — arrivent
//  bien comme messages-sélecteurs natifs et n'ont pas besoin de cet adaptateur.)
function list() {
	var a = Array.prototype.slice.call(arguments);
	var sel = String(a[0]);
	var rest = a.slice(1);
	var D = {
		triad: triad, seven: seven, nine: nine, add9: add9, sus2: sus2, sus4: sus4,
		six: six, sixnine: sixnine, sevensus4: sevensus4, mmaj7: mmaj7,
		sevenflat9: sevenflat9, sevensharp9: sevensharp9, m7s5: m7s5,
		colorchord: colorchord, octave: octave, rootidx: rootidx, scaleidx: scaleidx,
		voicingidx: voicingidx, voiceleading: voiceleading, vlmode: vlmode,
		voicing: voicing, synclive: synclive, requestgrid: requestgrid,
		requeststate: requeststate, midinote: midinote, key: key,
		keynote: keynote, keynoteup: keynoteup, pushmode: pushmode,
		colorscheme: colorscheme
	};
	if (D[sel]) { D[sel].apply(null, rest); }
	else { post("list: selecteur jweb inconnu '" + sel + "' (" + rest.join(" ") + ")\n"); }
}

// =====================================================
// CLAVIER ORDINATEUR — via [key] dans le patch Max
// =====================================================
// Quand le jweb a le focus OS, Max peut encore intercepter les frappes
// via [key] (son propre loop d'événements). [key] envoie keynote/keynoteup
// à cet inlet → même chemin que notein → midinote.
//
// Layout piano standard (correspond au "Computer MIDI Keyboard" d'Ableton,
// base C3 = MIDI 48 = MIDI_BASE) :
//   rangée basse  : z s x d c v g b h n j m   → C3..B3 (48..59)
//   rangée haute  : q 2 w 3 e r 5 t 6 y 7 u i → C4..C5 (60..72)
var KEY_TO_MIDI = {
    122:48, 115:49, 120:50, 100:51,  99:52, 118:53, 103:54,
     98:55, 104:56, 110:57, 106:58, 109:59,
    113:60,  50:61, 119:62,  51:63, 101:64, 114:65,  53:66,
    116:67,  54:68, 121:69,  55:70, 117:71, 105:72
};
var KEY_VEL = 100;

function keynote(ascii) {
    ascii = parseInt(ascii);
    var pitch = KEY_TO_MIDI[ascii];
    if (pitch === undefined) return;
    if (pitch === activeMidiNote) return;  // dedup : déjà joué via notein
    midinote(pitch, KEY_VEL);
}

function keynoteup(ascii) {
    ascii = parseInt(ascii);
    var pitch = KEY_TO_MIDI[ascii];
    if (pitch !== undefined) { midinote(pitch, 0); }
}

// Absorbeurs d'événements émis par l'objet [jweb] sur son outlet lors du chargement
// de page (onloadstart, url <url>, title <titre>, onloadend...). Ils n'ont aucun sens
// pour le moteur : on les avale pour ne pas polluer la console Max.
function onbeforeload() {}
function onloadstart()  {}
function onloadend()    {}
function url()          {}
function title()        {}

// =====================================================
// CONFIG
// =====================================================

function key(k) {
	k = String(k);
	if (NOTE_TO_PC[k] !== undefined) {
		root = NOTE_TO_PC[k];
		pushUIState();
	}
}

// Relaie uniquement l'état de config (octave, voicing, vl, vlmode) SANS rebuild de grille.
// À appeler quand seuls ces paramètres changent — la grille ne dépend pas d'eux.
function pushConfigState() {
	outlet(7, "octave", currentOctave);
	var vi = VOICING_NAMES.indexOf(currentVoicing);
	if (vi >= 0) outlet(7, "voicing", vi);
	outlet(7, "vl", voiceLeadingEnabled ? 1 : 0);
	outlet(7, "vlmode", vlMode);
}

// Relaie l'état complet (tonalité + config) ET rebuilde la grille.
// À appeler uniquement quand root ou scale change — pas pour octave/voicing/vl/vlmode.
//  - au jsui via outlet 7 (déjà câblé) → readout + grille
//  - à midi_map / push2 via messnamed → r root_idx / r scale_idx
//    (aucun câblage requis : touche les receive par leur nom)
function pushUIState() {
	outlet(7, "root", root);
	var si = SCALE_NAMES_ARR.indexOf(scaleName);
	if (si >= 0) outlet(7, "scale", si);

	pushConfigState();

	try {
		messnamed("root_idx", root);
		if (si >= 0) messnamed("scale_idx", si);
	} catch(e) {
		// chord_engine chargé hors patch (sans les receive) → on ignore
	}

	broadcastGrid();   // la grille dépend de root/scale → on rediffuse
}

// SYNC : relit la tonalité du set Live (bouton SYNC du jsui)
var LIVE_SCALE_MAP = {
	"major":0, "minor":1, "natural minor":1, "dorian":2, "phrygian":3,
	"lydian":4, "mixolydian":5, "harmonic minor":6, "harmminor":6
};
function synclive() {
	try {
		var api = new LiveAPI(function(){}, "live_set");
		if (!api.id || api.id == 0) { post("SYNC : Live pas prêt\n"); return; }

		var rn = api.get("root_note");
		var sn = api.get("scale_name");
		if (rn instanceof Array) rn = rn[0];
		if (sn instanceof Array) sn = sn[0];
		rn = parseInt(rn);
		sn = String(sn).toLowerCase().trim();

		if (rn >= 0 && rn <= 11) root = rn;
		if (LIVE_SCALE_MAP[sn] !== undefined) setscale(SCALE_NAMES_ARR[LIVE_SCALE_MAP[sn]]);

		pushUIState();
		post("SYNC → " + NOTE_NAMES[root] + " " + scaleName + "\n");
	} catch(e) {
		post("SYNC erreur : " + e + "\n");
	}
}

// Reçoit un index int (0-11) depuis live.menu
function rootidx(v) {
	root = parseInt(v);
	lockedVoicing = null;  // Reset lock quand on change de clé
	pushUIState();
}

// Reçoit un index int (0-6) depuis live.menu
var SCALE_NAMES_ARR = ["major","minor","dorian","phrygian","lydian","mixolydian","harmminor"];
function scaleidx(v) {
	setscale(SCALE_NAMES_ARR[parseInt(v)]);
	pushUIState();
}

function setscale(s) {
	s = String(s).toLowerCase();
	if (SCALES[s]) {
		scale = SCALES[s];
		scaleName = s;
		lockedVoicing = null;  // Reset lock quand on change de gamme
	}
}

function major()      { setscale("major"); }
function minor()      { setscale("minor"); }
function dorian()     { setscale("dorian"); }
function phrygian()   { setscale("phrygian"); }
function lydian()     { setscale("lydian"); }
function mixolydian() { setscale("mixolydian"); }
function harmminor()  { setscale("harmminor"); }

function octave(v) {
	currentOctave = parseInt(v);
	pushConfigState();   // pas de rebuild grille : l'octave n'affecte pas les cellules
}

function voicing(v) {
	currentVoicing = String(v);
	pushConfigState();   // pas de rebuild grille : le voicing n'affecte pas les cellules
}

// Reçoit un index int (0-5) depuis live.menu
var VOICING_NAMES = ["classic","piano","open","spread","house","prog","rootlessa","rootlessb","drop2","drop3"];
function voicingidx(v) {
	currentVoicing = VOICING_NAMES[parseInt(v)] || "classic";
	lockedVoicing = null;  // Reset lock quand on change de voicing
	pushConfigState();   // pas de rebuild grille
}

function voiceleading(v) {
	// Accepte "on"/"off" (toggle jsui) ET 1/0 (toggle jweb)
	var s = String(v).toLowerCase();
	voiceLeadingEnabled = (s === "on" || s === "1" || s === "true");
	// Repart à zéro à chaque activation/désactivation
	previousChord = null;
	voicingCache = {};
	pushConfigState();   // pas de rebuild grille
}

function resetvoiceleading() {
	previousChord = null;
	voicingCache = {};
	relativeCounter = 0;
}

// Reçoit "vlmode anchored" ou "vlmode relative"
function vlmode(m) {
	vlMode = String(m);
	previousChord = null;
	voicingCache = {};
	relativeCounter = 0;
	pushConfigState();   // pas de rebuild grille
}

// =====================================================
// HELPERS
// =====================================================

function noteName(midi) {
	return NOTE_NAMES[((midi % 12) + 12) % 12];
}

// =====================================================
// VALIDATION D'INTERVALLES
// =====================================================

function getIntervals(d) {
	var iv = {};
	for (var step = 0; step <= 8; step++) {
		var absIdx      = d + step;
		var octShift    = Math.floor(absIdx / 7);
		var noteInScale = absIdx % 7;
		var semi        = scale[noteInScale] - scale[d % 7] + octShift * 12;
		iv[step]        = ((semi % 12) + 12) % 12;
	}
	return iv;
}

function isValid(d, type) {
	var iv = getIntervals(d);
	switch(type) {
		case "triad":     return true;
		case "sus2":      return iv[1] === 2  && iv[4] === 7;
		case "sus4":      return iv[3] === 5  && iv[4] === 7;
		case "seven":     return (iv[4] === 7 && (iv[6] === 10 || iv[6] === 11))   // maj7/min7/dom7
		                      || (iv[4] === 6 && (iv[6] === 9  || iv[6] === 10));  // dim7/ø7
		case "maj7":      return iv[4] === 7  && iv[6] === 11;
		case "dom7":      return iv[4] === 7  && iv[6] === 10;
		case "min7":      return iv[2] === 3  && iv[4] === 7  && iv[6] === 10;
		case "dim7":      return iv[2] === 3  && iv[4] === 6  && iv[6] === 9;
		case "hdim7":     return iv[2] === 3  && iv[4] === 6  && iv[6] === 10;
		case "nine":      return iv[4] === 7  && iv[6] === 10 && iv[8] === 2;
		case "maj9":      return iv[4] === 7  && iv[6] === 11 && iv[8] === 2;
		case "min9":      return iv[2] === 3  && iv[4] === 7  && iv[6] === 10 && iv[8] === 2;
		case "add9":      return iv[4] === 7  && iv[8] === 2;
		case "sixtynine": return iv[4] === 7  && iv[8] === 2;
		default: return false;
	}
}

// =====================================================
// GRILLE — SOURCE DE VÉRITÉ
// Le moteur calcule la grille et la diffuse à l'UI / Push (outlet 7).
// =====================================================

// Lignes de types (ordre d'empilement)
// Ordre = priorité d'affichage. Si une colonne dépasse MAX_PER_COL,
// on garde les premiers (les plus utiles), on coupe les derniers (rares).
// Chaque colonne affiche jusqu'à 8 accords valides pour ce degré.
// Ordre : accords courants d'abord, puis alterés/jazz pour remplir.
var GRID_TYPES   = ["triad","seven","nine","mmaj7","sus4","sus2","add9","six","sevensus4","sixnine","sevenflat9","sevensharp9","m7s5"];
var MAX_PER_COL  = 8;
var showExtended = false;

// Grille : tous les types pour remplir les 8 cases au maximum
function getActiveTypes() {
	return GRID_TYPES;
}

// Reçoit "extended on" / "extended off" depuis le jsui
function extended(v) {
	showExtended = (String(v) === "on");
	broadcastGrid();
}

// Accords empruntés par mode (déplacés ici : source de vérité)
var BORROWED_MAJOR = [
	{ roman:"bIII", semis:3,  type:"maj",  suf:""     },
	{ roman:"iv",   semis:5,  type:"min",  suf:"m"    },
	{ roman:"bVI",  semis:8,  type:"maj",  suf:""     },
	{ roman:"bVII", semis:10, type:"maj",  suf:""     },
	{ roman:"V/V",  semis:2,  type:"dom7", suf:"7"    },
	{ roman:"V/ii", semis:9,  type:"dom7", suf:"7"    },
	{ roman:"V/vi", semis:4,  type:"dom7", suf:"7"    }
];
var BORROWED_MINOR = [
	{ roman:"V",    semis:7,  type:"maj",  suf:""     },
	{ roman:"vii°", semis:11, type:"dim7", suf:"dim7" },
	{ roman:"IV",   semis:5,  type:"maj",  suf:""     },
	{ roman:"bII",  semis:1,  type:"maj",  suf:""     },
	{ roman:"V/V",  semis:2,  type:"dom7", suf:"7"    },
	{ roman:"V/iv", semis:0,  type:"dom7", suf:"7"    },
	{ roman:"V/VI", semis:3,  type:"dom7", suf:"7"    }
];
function borrowedFor() {
	if (scaleName === "major") return BORROWED_MAJOR;
	if (scaleName === "minor") return BORROWED_MINOR;
	return [];
}

// Validité d'une ligne de type à un degré (n'importe quelle qualité)
function gridTypeValid(d, fn) {
	var iv = getIntervals(d);
	switch(fn) {
		case "triad":       return true;
		case "six":         return iv[4]===7 && iv[5]===9;                 // 6 / m6 (6e majeure)
		case "sixnine":     return iv[4]===7 && iv[5]===9 && iv[8]===2;    // 6/9
		case "seven":       return isValid(d,"seven");
		case "maj7":        return iv[4]===7 && iv[6]===11;                // maj7 (explicite)
		case "mmaj7":       return iv[2]===3 && iv[4]===7 && iv[6]===11;   // mineur-majeur 7
		case "sevensus4":   return iv[3]===5 && iv[4]===7 && iv[6]===10;  // 7sus4
		case "nine":        return isValid(d,"maj9") || isValid(d,"min9") || isValid(d,"nine");
		case "sevenflat9":  return iv[2]!==3 && iv[4]===7 && iv[6]===10 && iv[8]===1;  // 7b9 (dominante)
		case "sevensharp9": return iv[2]!==3 && iv[4]===7 && iv[6]===10 && iv[8]===3;  // 7#9 (dominante)
		case "m7s5":        return iv[2]===3 && iv[4]===8 && iv[6]===10;   // m7#5 (alteré)
		case "add9":        return isValid(d,"add9");
		case "sus2":        return isValid(d,"sus2");
		case "sus4":        return isValid(d,"sus4");
		default: return false;
	}
}

// Nom d'accord affiché pour une case (degré + type)
function gridLabel(d, fn) {
	var iv = getIntervals(d);
	var rn = NOTE_NAMES[(root + scale[d]) % 12];
	if (fn === "triad") {
		if (iv[2]===3 && iv[4]===6) return rn + "dim";
		if (iv[2]===4 && iv[4]===8) return rn + "aug";
		if (iv[2]===3) return rn + "m";
		return rn;
	}
	if (fn === "sus2") return rn + "sus2";
	if (fn === "sus4") return rn + "sus4";
	if (fn === "add9") return (iv[2]===3 ? rn + "madd9" : rn + "add9");
	if (fn === "six")         return (iv[2]===3 ? rn + "m6"   : rn + "6");
	if (fn === "sixnine")     return (iv[2]===3 ? rn + "m6/9" : rn + "6/9");
	if (fn === "mmaj7")       return rn + "mMaj7";
	if (fn === "sevensus4")   return rn + "7sus4";
	if (fn === "sevenflat9")  return rn + "7b9";
	if (fn === "sevensharp9") return rn + "7#9";
	if (fn === "seven") {
		if (isValid(d,"maj7"))  return rn + "M7";
		if (isValid(d,"min7"))  return rn + "m7";
		if (isValid(d,"dom7"))  return rn + "7";
		if (isValid(d,"dim7"))  return rn + "dim7";
		if (isValid(d,"hdim7")) return rn + "ø7";
	}
	if (fn === "nine") {
		if (isValid(d,"maj9")) return rn + "M9";
		if (isValid(d,"min9")) return rn + "m9";
		if (isValid(d,"nine")) return rn + "9";
	}
	return rn;
}

// Grille "à plat" (col-major) pour le mapping MIDI clavier
var flatGrid = [];
// Grille 2D : gCols[colonne] = [ {fn} ... ] ; gBor = [ {semis,type} ... ]
// Pour jouer une case par (colonne, rangée) — utilisé par le Push.
var gCols = [[],[],[],[],[],[],[]];
var gBor  = [];

// Qualité du triade diatonique par degré : 0=majeur 1=mineur 2=diminué 3=augmenté.
function chordQuality(d) {
	function semi(step) { return scale[step % 7] + 12 * Math.floor(step / 7); }
	var root = semi(d), third = semi(d + 2) - root, fifth = semi(d + 4) - root;
	if (third === 3 && fifth === 6) return 2;
	if (third === 4 && fifth === 8) return 3;
	if (third === 3) return 1;
	return 0;
}

// Diffuse toute la grille à l'UI ET au Push (outlet 7) + reconstruit flatGrid/gCols/gBor
function broadcastGrid() {
	flatGrid = [];
	gCols = [[],[],[],[],[],[],[]];
	gBor  = [];
	outlet(7, "gridclear");
	var activeTypes = getActiveTypes();
	for (var d = 0; d < 7; d++) {
		var count = 0;
		for (var t = 0; t < activeTypes.length; t++) {
			var fn = activeTypes[t];
			if (gridTypeValid(d, fn)) {
				outlet(7, "gridcell", d, fn, gridLabel(d, fn));
				flatGrid.push({ kind:"d", fn:fn, degree:d });
				gCols[d].push({ fn:fn });
				count++;
			}
		}
	}
	var bl = borrowedFor();
	for (var i = 0; i < bl.length; i++) {
		var c = bl[i];
		var lbl = NOTE_NAMES[(root + c.semis) % 12] + c.suf;
		outlet(7, "gridbor", i, lbl, c.semis, c.type, c.roman);
		flatGrid.push({ kind:"b", semis:c.semis, type:c.type });
		gBor.push({ semis:c.semis, type:c.type });
	}
	var quals = [];
	for (var qd = 0; qd < 7; qd++) quals.push(chordQuality(qd));
	outlet(7, ["qualities"].concat(quals));
	outlet(7, "griddone");
}

// L'UI demande la grille (au chargement)
function requestgrid() {
	broadcastGrid();
}

// Synchronise l'état (key, scale) vers l'UI au reload
function requeststate() {
	pushUIState();
}

// Joue une case par (colonne, rangée) — entrée Push.
function playcell(col, row) {
	col = parseInt(col); row = parseInt(row);
	if (col === 7) {
		if (row >= 0 && row < gBor.length) colorchord(gBor[row].semis, gBor[row].type);
		return;
	}
	if (col >= 0 && col < 7 && row >= 0 && row < gCols[col].length) {
		playFlatCell({ kind:"d", fn:gCols[col][row].fn, degree:col });
	}
}

// Vélocité reçue avant un playcell (pad pressé)
function padvel(v) { currentVelocity = parseInt(v); }

// Relais du toggle Push mode (UI jweb → module Push, via la sortie 7 déjà câblée).
function pushmode(v) { outlet(7, "pushmode", parseInt(v)); }

// Relais du schéma de couleur (cycler UI → module Push).
function colorscheme(v) { outlet(7, "colorscheme", parseInt(v)); }

// =====================================================
// ENTRÉE CLAVIER MIDI → case de la grille (Phase 2)
// Reçoit "midinote <pitch> <vel>" depuis midi_map (relais).
// Mappe la note sur la grille du moteur → cohérent avec l'UI.
// =====================================================
var MIDI_BASE      = 48;   // Do2 = première case
var activeMidiNote = -1;

function playFlatCell(cell) {
	if (cell.kind === "b") { colorchord(cell.semis, cell.type); return; }
	switch(cell.fn) {
		case "triad":       triad(cell.degree); break;
		case "six":         six(cell.degree); break;
		case "sixnine":     sixnine(cell.degree); break;
		case "seven":       seven(cell.degree); break;
		case "mmaj7":       mmaj7(cell.degree); break;
		case "sevensus4":   sevensus4(cell.degree); break;
		case "nine":        nine(cell.degree);  break;
		case "sevenflat9":  sevenflat9(cell.degree); break;
		case "sevensharp9": sevensharp9(cell.degree); break;
		case "add9":        add9(cell.degree);  break;
		case "sus2":        sus2(cell.degree);  break;
		case "sus4":        sus4(cell.degree);  break;
	}
}

function midinote(pitch, vel) {
	pitch = parseInt(pitch);
	vel   = parseInt(vel);

	if (vel === 0) {                       // note-off
		if (pitch === activeMidiNote) { activeMidiNote = -1; sendNoteOff(); }
		return;
	}

	var idx = pitch - MIDI_BASE;
	if (idx < 0 || idx >= flatGrid.length) return;

	currentVelocity = vel;
	activeMidiNote  = pitch;
	playFlatCell(flatGrid[idx]);
}

// =====================================================
// CONSTRUCTION DES NOTES
// =====================================================

function buildNotes(d, sidx) {
	var notes = [];
	for (var i = 0; i < sidx.length; i++) {
		var step        = sidx[i];
		var absIdx      = d + step;
		var octShift    = Math.floor(absIdx / 7);
		var noteInScale = absIdx % 7;
		var midi        = root + scale[noteInScale] + (4 + currentOctave + octShift) * 12;
		if (midi >= 0 && midi <= 127) notes.push(midi);
	}
	return notes;
}

// =====================================================
// VOICINGS
// =====================================================

function vsort(a) { return a.slice().sort(function(x,y){ return x-y; }); }

// PIANO : main gauche = fondamentale grave, main droite = reste de
// l'accord groupé au-dessus (avec un écart). Son pianistique classique.
function pianoVoicing(notes) {
	if (notes.length < 3) return notes;
	var s = vsort(notes);
	var bass = s[0] - 12;            // fondamentale une octave plus bas
	return [bass].concat(s.slice(1));
}

// OPEN : position ouverte — on monte la 2e voix d'une octave.
// Écartement modéré, plus aéré que le close.
function openVoicing(notes) {
	if (notes.length < 2) return notes;
	var s = vsort(notes);
	s[1] += 12;
	return vsort(s);
}

// SPREAD : écartement large — une voix sur deux montée d'une octave,
// voix imbriquées. Le plus ouvert.
function spreadVoicing(notes) {
	if (notes.length < 3) return notes;
	var s = vsort(notes);
	var r = [];
	for (var i = 0; i < s.length; i++) r.push(i % 2 === 1 ? s[i] + 12 : s[i]);
	return vsort(r);
}

// HOUSE : stab — accord complet + doublure de la fondamentale à
// l'octave au-dessus. Punchy, caractéristique du house piano.
function houseVoicing(notes) {
	if (notes.length < 3) return notes;
	var s = vsort(notes);
	return s.concat([s[0] + 12]);
}

// PROG HOUSE : la nappe prog techno/house ~1998-2005 (Sasha, Digweed,
// Cattáneo, Way Out West...). Fondamentale grave bien détachée, quinte
// au milieu pour l'ancrage, puis 3ce + extensions (7e/9e) projetées
// dans l'aigu pour ce côté large et émotionnel. Triades doublées à la
// quinte pour le shimmer.
function progHouseVoicing(notes) {
	if (notes.length < 3) return notes;
	var s = vsort(notes);
	var r = [];

	r.push(s[0] - 12);               // fondamentale grave (basse détachée)
	r.push(s[0]);                    // fondamentale
	if (s.length >= 3) r.push(s[2]); // quinte au milieu (ancrage)
	r.push(s[1] + 12);               // 3ce projetée dans l'aigu

	for (var i = 3; i < s.length; i++) r.push(s[i] + 12);  // 7e, 9e... en haut

	if (s.length === 3) r.push(s[2] + 12);  // triade : quinte doublée (shimmer)

	r = vsort(r);
	if (r.length > 6) r = r.slice(0, 6);    // max 6 voix (6 noteout)
	return r;
}

// Rootless A : on retire la fondamentale, structure sup. telle quelle
// ex: Cm9 [C,Eb,G,Bb,D] → [Eb,G,Bb,D]  (3-5-7-9)
function rootlessAVoicing(notes) {
	if (notes.length < 3) return notes;
	return notes.slice(1);
}

// Rootless B : on retire la fondamentale puis on bascule la moitié
// basse une octave au-dessus
// ex: Cm9 [C,Eb,G,Bb,D] → [Bb,D,Eb+12,G+12]  (7-9-3-5)
function rootlessBVoicing(notes) {
	if (notes.length < 3) return notes;
	var u = notes.slice(1);                 // structure sans fondamentale
	var n = u.length;
	var botCount = Math.ceil(n / 2);
	var bottom = u.slice(0, botCount);
	var top    = u.slice(botCount);
	var r = top.slice();
	for (var i = 0; i < bottom.length; i++) r.push(bottom[i] + 12);
	return r;
}

// Drop 2 : depuis une position serrée, on descend la 2e voix
// depuis le haut d'une octave. Son ouvert et riche (jazz/nappes).
function drop2Voicing(notes) {
	if (notes.length < 3) return notes;
	var r = notes.slice().sort(function(a,b){ return a-b; });
	r[r.length - 2] -= 12;                       // 2e voix depuis le haut
	r.sort(function(a,b){ return a-b; });
	return r;
}

// Drop 3 : on descend la 3e voix depuis le haut d'une octave.
// Plus espacé encore. Nécessite au moins 4 notes.
function drop3Voicing(notes) {
	if (notes.length < 4) return notes;
	var r = notes.slice().sort(function(a,b){ return a-b; });
	r[r.length - 3] -= 12;                       // 3e voix depuis le haut
	r.sort(function(a,b){ return a-b; });
	return r;
}

function applyVoicing(notes) {
	switch(currentVoicing) {
		case "piano":     return pianoVoicing(notes);
		case "open":      return openVoicing(notes);
		case "spread":    return spreadVoicing(notes);
		case "house":     return houseVoicing(notes);
		case "prog":      return progHouseVoicing(notes);
		case "rootlessa": return rootlessAVoicing(notes);
		case "rootlessb": return rootlessBVoicing(notes);
		case "drop2":     return drop2Voicing(notes);
		case "drop3":     return drop3Voicing(notes);
		default:          return notes;
	}
}

// =====================================================
// VOICE LEADING
// Principe unifié : on garde la FORME du voicing courant et on
// choisit le renversement (rotation de la forme) + l'octave le
// plus proche de la cible.
//   - mode "anchored" : cible = centre de registre fixe (déterministe,
//     boucles stables, accords groupés autour du centre).
//   - mode "relative"  : cible = accord précédent (transitions plus
//     réactives, mais peut dériver en boucle).
// =====================================================

function asc(a, b) { return a - b; }

// Place la classe de hauteur de `note` dans l'octave la plus proche de `anchor`
function placeNearest(note, anchor) {
	var pc = ((note % 12) + 12) % 12;
	var k  = Math.round((anchor - pc) / 12);
	return pc + 12 * k;
}

// Renversement : monte la note la plus basse d'une octave
function rotateUp(arr) {
	var r = arr.slice().sort(asc);
	r.push(r.shift() + 12);
	r.sort(asc);
	return r;
}

function shiftAll(arr, delta) {
	var r = [];
	for (var i = 0; i < arr.length; i++) r.push(arr[i] + delta);
	return r;
}

// Distance de voice leading (amélioré) :
// - Minimiser la distance voix à voix
// - Favoriser les notes communes (même PC)
// - Pénaliser les grands sauts (> tierce)
// - Pénaliser les octaves/quintes parallèles
// - Pénaliser notes hors de la "preferred zone" (48-72 = Do2 à Do4)
// Profils de voice leading par voicing
function getVoicingProfile(voicingName) {
	switch(voicingName) {
		case "piano":
			return { prefLow: 45, prefHigh: 75, commonToneBonus: -8, jumpPenalty: 0.7, parallelPenalty: 12 };
		case "open":
			return { prefLow: 20, prefHigh: 100, commonToneBonus: -4, jumpPenalty: 0.2, parallelPenalty: 4 };
		case "house":
			return { prefLow: 35, prefHigh: 85, commonToneBonus: -5, jumpPenalty: 0.3, parallelPenalty: 4 };
		case "spread":
			return { prefLow: 30, prefHigh: 90, commonToneBonus: -5, jumpPenalty: 0.4, parallelPenalty: 6 };
		case "prog":
			return { prefLow: 40, prefHigh: 80, commonToneBonus: -6, jumpPenalty: 0.6, parallelPenalty: 8 };
		case "classic":
			return { prefLow: 48, prefHigh: 72, commonToneBonus: -7, jumpPenalty: 0.5, parallelPenalty: 12 };
		case "drop2":
		case "drop3":
			return { prefLow: 42, prefHigh: 78, commonToneBonus: -6, jumpPenalty: 0.5, parallelPenalty: 10 };
		case "rootlessa":
		case "rootlessb":
			return { prefLow: 50, prefHigh: 80, commonToneBonus: -6, jumpPenalty: 0.4, parallelPenalty: 8 };
		default:
			return { prefLow: 48, prefHigh: 72, commonToneBonus: -6, jumpPenalty: 0.5, parallelPenalty: 8 };
	}
}

function vlDistance(a, b) {
	var aa = a.slice().sort(asc);
	var bb = b.slice().sort(asc);
	var n  = Math.min(aa.length, bb.length);
	var tot = 0;

	// Adapter les paramètres selon le voicing courant
	var profile = getVoicingProfile(currentVoicing);
	var PREF_LOW = profile.prefLow, PREF_HIGH = profile.prefHigh;
	var COMMON_TONE_BONUS = profile.commonToneBonus;
	var JUMP_PENALTY_FACTOR = profile.jumpPenalty;
	var PARALLEL_PENALTY = profile.parallelPenalty;

	for (var i = 0; i < n; i++) {
		var dist = Math.abs(bb[i] - aa[i]);
		tot += dist;

		// Pénalité pour grands sauts (> 4 semitones = tierce)
		if (dist > 4) {
			tot += (dist - 4) * JUMP_PENALTY_FACTOR;
		}

		// Bonus pour note commune (même pitch class)
		if ((aa[i] % 12) === (bb[i] % 12)) {
			tot += COMMON_TONE_BONUS;  // valeur négative = bonus
		}

		// Pénalité pour notes en dehors de la zone préférée
		if (bb[i] < PREF_LOW) {
			tot += (PREF_LOW - bb[i]) * 0.3;  // trop bas
		} else if (bb[i] > PREF_HIGH) {
			tot += (bb[i] - PREF_HIGH) * 0.3;  // trop haut
		}
	}

	tot += Math.abs(aa.length - bb.length) * 6;

	// Pénaliser octaves/quintes parallèles sur l'ordre des voix (pas trié)
	if (a.length >= 2) {
		for (var j = 0; j < a.length - 1; j++) {
			var int1 = ((a[j+1] - a[j]) % 12 + 12) % 12;
			var int2 = ((b[j+1] - b[j]) % 12 + 12) % 12;
			// Quinte = 7, octave = 0
			if (int1 === int2 && (int1 === 0 || int1 === 7)) {
				tot += PARALLEL_PENALTY;
			}
		}
	}

	return Math.max(0, tot);
}

// Garde l'accord dans une plage MIDI utile (décale par octaves)
function clampRange(arr) {
	var r = arr.slice().sort(asc);
	while (r.length && r[r.length - 1] > 108) r = shiftAll(r, -12).sort(asc);
	while (r.length && r[0] < 24)             r = shiftAll(r, 12).sort(asc);
	return r;
}

// Cherche le renversement + octave de `notes` (forme du voicing)
// le plus proche de `target`
function bestRotation(notes, target) {
	var base = notes.slice().sort(asc);
	var best = base, bestD = 1e9;
	var rot = base.slice();
	for (var i = 0; i < base.length; i++) {
		for (var oct = -2; oct <= 2; oct++) {
			var cand = shiftAll(rot, oct * 12);
			var d = vlDistance(target, cand);
			if (d < bestD) { bestD = d; best = cand; }
		}
		rot = rotateUp(rot);
	}
	return clampRange(best);
}

function applyVoiceLeading(notes) {
	if (!voiceLeadingEnabled) return notes;

	// Si c'est le MÊME accord et une voicing est verrouillée, la réutiliser
	// (c'est-à-dire qu'on a changé vlMode mais on joue le même accord)
	if (lockedVoicing !== null && lastFn === lastFnLocked && lastDegree === lastDegreeLocked) {
		previousChord = lockedVoicing.slice();
		return lockedVoicing.slice();
	}

	// Sinon, on joue un nouvel accord — réinitialiser le lock
	lockedVoicing = null;
	lastFnLocked = null;
	lastDegreeLocked = null;

	if (vlMode === "piano") {
		var pianoResult = pianoVL(notes);
		// Mémoriser cette voicing comme verrouillée pour ce nouvel accord
		lockedVoicing = pianoResult.slice();
		lastFnLocked = lastFn;
		lastDegreeLocked = lastDegree;
		return pianoResult;
	}

	var target;
	var center = 60 + currentOctave * 12;

	if (vlMode === "relative" && previousChord !== null) {
		// Mode RELATIVE : suit l'accord précédent (100% fluide, moindre mouvement)
		// Pas de "center pull" — la voicing va dériver vers le haut/bas selon la progression
		// mais chaque note se rapproche au maximum du point d'ancrage précédent
		target = previousChord.slice();  // Cible = accord précédent exactement
	} else if (vlMode === "anchored") {
		// Mode ANCHOR : toujours recentrer sur le center (statique, mécanique)
		// Aucune mémoire de l'accord précédent — on recommence à zéro chaque fois
		target = [];
		for (var i = 0; i < notes.length; i++) target.push(center);
		previousChord = null;  // Oublier l'accord précédent en mode ANCHOR
	} else {
		// Par défaut (premier accord, etc.)
		target = [];
		for (var i = 0; i < notes.length; i++) target.push(center);
	}

	var best = bestRotation(notes, target);
	if (vlMode !== "anchored") previousChord = best.slice();  // Garder la mémoire en RELAT

	// Mémoriser cette voicing comme verrouillée pour ce nouvel accord
	lockedVoicing = best.slice();
	lastFnLocked = lastFn;
	lastDegreeLocked = lastDegree;

	return best;
}

// Pitch class de la fondamentale de l'accord courant
function chordRootPc() {
	if (lastFn === "color") return (((root + lastDegree) % 12) + 12) % 12;
	return (((root + scale[lastDegree % 7]) % 12) + 12) % 12;
}

// MODE PIANO : voicing "deux mains" pensé pour la prod électro.
//  - Main gauche : fondamentale dans le bas-médium (jamais sous Do2 / MIDI 48),
//    pour ne pas empiéter sur la basse.
//  - Main droite : structure de l'accord voicée en douceur autour du Do4,
//    mouvement minimal note-à-note (les notes communes restent fixes).
function pianoVL(notes) {
	var rootPc = chordRootPc();

	// --- Main gauche : la fondamentale, bas-médium (~Do2 à octave 0, suit OCT) ---
	var bassCenter = 48 + currentOctave * 12;
	var bass = placeNearest(rootPc, bassCenter);

	// --- Main droite : classes de hauteur de l'accord ---
	var pcs = [];
	for (var i = 0; i < notes.length; i++) {
		var pc = ((notes[i] % 12) + 12) % 12;
		if (pcs.indexOf(pc) < 0) pcs.push(pc);
	}
	pcs.sort(function(a,b){ return a-b; });

	var center = 55 + currentOctave * 12;   // ~Si2/Do3, plus bas pour éviter les hauteurs excessives
	var upper  = [];
	var prevUpper = (previousChord && previousChord.length > 1)
	              ? previousChord.slice(1).sort(asc) : null;

	// voice leading : suit l'accord précédent pour la fluidité
	for (var k = 0; k < pcs.length; k++) {
		var anchor = prevUpper ? prevUpper[Math.min(k, prevUpper.length - 1)] : center;
		upper.push(placeNearest(pcs[k], anchor));
	}

	upper.sort(asc);
	for (var j = 1; j < upper.length; j++) {
		if (upper[j] <= upper[j - 1]) upper[j] += 12 * Math.ceil((upper[j-1] + 1 - upper[j]) / 12);
	}

	// RECALAGE sur l'octave : on transpose le bloc pour que sa moyenne
	// retombe près du centre → OCT redevient effectif + pas de dérive.
	var sum = 0;
	for (var m = 0; m < upper.length; m++) sum += upper[m];
	var mean  = sum / upper.length;
	var shift = Math.round((center - mean) / 12) * 12;
	for (var n = 0; n < upper.length; n++) upper[n] += shift;

	// la main droite reste au-dessus de la basse ET en-dessous de Do5
	while (upper.length && upper[0] <= bass) {
		for (var a = 0; a < upper.length; a++) upper[a] += 12;
	}
	// Limiter max à Do5 (72) pour éviter les notes trop hautes
	while (upper.length && upper[upper.length - 1] > 72) {
		for (var b = 0; b < upper.length; b++) upper[b] -= 12;
	}

	var result = [bass].concat(upper);
	result.sort(asc);
	previousChord = result.slice();
	return result;
}

// =====================================================
// OUTPUT — 6 outlets directs, chacun envoie [pitch, velocity]
// Le patch câble chaque outlet → unpack i i → noteout
// =====================================================

function sendNoteOff() {
	if (activeNotes.length === 0) return;
	outlet(0, 0);  // velocity=0 arrive en PREMIER dans tous les noteout
	for (var i = 0; i < activeNotes.length && i < 6; i++) {
		outlet(i + 1, activeNotes[i]);  // pitches, déclenchent noteout avec vel=0
	}
	activeNotes = [];
	outlet(7, "clearnotes");  // efface le clavier moniteur
}

function sendChord(name, notes) {
	notes = applyVoicing(notes);
	notes = applyVoiceLeading(notes);
	sendNoteOff();
	activeNotes = notes.slice();
	outlet(0, currentVelocity);
	for (var i = 0; i < notes.length && i < 6; i++) {
		outlet(i + 1, notes[i]);
	}
	outlet(7, "active", lastFn, lastDegree);   // highlight grille
	outlet(7, ["notes"].concat(activeNotes));  // → clavier moniteur
}

// =====================================================
// TYPES D'ACCORDS
// =====================================================

function triad(d) {
	d = parseInt(d); lastFn = "triad"; lastDegree = d;
	var notes = buildNotes(d, [0,2,4]);
	var iv = getIntervals(d);
	var q = (iv[2]===3 && iv[4]===6) ? "dim"
	      : (iv[2]===4 && iv[4]===8) ? "aug"
	      : (iv[2]===3) ? "m" : "";
	sendChord(noteName(notes[0]) + q, notes);
}

function seven(d) {
	d = parseInt(d); lastFn = "seven"; lastDegree = d;
	if (!isValid(d, "seven")) { post("seven " + d + " : invalid\n"); return; }
	var notes = buildNotes(d, [0,2,4,6]);
	var iv = getIntervals(d);
	var q = iv[6]===11 ? "maj7"
	      : (iv[2]===3 && iv[4]===6 && iv[6]===10) ? "ø7"
	      : (iv[2]===3 && iv[4]===6 && iv[6]===9)  ? "dim7"
	      : (iv[2]===3) ? "m7" : "7";
	sendChord(noteName(notes[0]) + q, notes);
}

function nine(d) {
	d = parseInt(d); lastFn = "nine"; lastDegree = d;
	if (!isValid(d,"nine") && !isValid(d,"maj9") && !isValid(d,"min9")) {
		post("nine " + d + " : invalid\n"); return;
	}
	var notes = buildNotes(d, [0,2,4,6,8]);
	var iv = getIntervals(d);
	var q = iv[6]===11 ? "maj9" : (iv[2]===3) ? "m9" : "9";
	sendChord(noteName(notes[0]) + q, notes);
}

function add9(d) {
	d = parseInt(d); lastFn = "add9"; lastDegree = d;
	if (!isValid(d, "add9")) { post("add9 " + d + " : invalid\n"); return; }
	var notes = buildNotes(d, [0,2,4,8]);
	var iv = getIntervals(d);
	var q = (iv[2]===3) ? "m" : "";
	sendChord(noteName(notes[0]) + q + "add9", notes);
}

function sus2(d) {
	d = parseInt(d); lastFn = "sus2"; lastDegree = d;
	if (!isValid(d, "sus2")) { post("sus2 " + d + " : invalid\n"); return; }
	var notes = buildNotes(d, [0,1,4]);
	sendChord(noteName(notes[0]) + "sus2", notes);
}

function sus4(d) {
	d = parseInt(d); lastFn = "sus4"; lastDegree = d;
	if (!isValid(d, "sus4")) { post("sus4 " + d + " : invalid\n"); return; }
	var notes = buildNotes(d, [0,3,4]);
	sendChord(noteName(notes[0]) + "sus4", notes);
}

// ----- Nouveaux types -----

function six(d) {
	d = parseInt(d); lastFn = "six"; lastDegree = d;
	if (!gridTypeValid(d, "six")) return;
	var notes = buildNotes(d, [0,2,4,5]);        // root, 3ce, 5te, 6te
	var iv = getIntervals(d);
	sendChord(noteName(notes[0]) + (iv[2]===3 ? "m6" : "6"), notes);
}

function sixnine(d) {
	d = parseInt(d); lastFn = "sixnine"; lastDegree = d;
	if (!gridTypeValid(d, "sixnine")) return;
	var notes = buildNotes(d, [0,2,4,5,8]);      // + 9e
	var iv = getIntervals(d);
	sendChord(noteName(notes[0]) + (iv[2]===3 ? "m6/9" : "6/9"), notes);
}

function sevensus4(d) {
	d = parseInt(d); lastFn = "sevensus4"; lastDegree = d;
	if (!gridTypeValid(d, "sevensus4")) return;
	var notes = buildNotes(d, [0,3,4,6]);        // root, 4te, 5te, 7e
	sendChord(noteName(notes[0]) + "7sus4", notes);
}

function mmaj7(d) {
	d = parseInt(d); lastFn = "mmaj7"; lastDegree = d;
	if (!gridTypeValid(d, "mmaj7")) return;
	var notes = buildNotes(d, [0,2,4,6]);        // root, 3ce min, 5te, 7e maj
	sendChord(noteName(notes[0]) + "mMaj7", notes);
}

function sevenflat9(d) {
	d = parseInt(d); lastFn = "sevenflat9"; lastDegree = d;
	if (!gridTypeValid(d, "sevenflat9")) return;
	var notes = buildNotes(d, [0,2,4,6,8]);      // + b9
	sendChord(noteName(notes[0]) + "7b9", notes);
}

function sevensharp9(d) {
	d = parseInt(d); lastFn = "sevensharp9"; lastDegree = d;
	if (!gridTypeValid(d, "sevensharp9")) return;
	var notes = buildNotes(d, [0,2,4,6,8]);      // + #9
	sendChord(noteName(notes[0]) + "7#9", notes);
}

function m7s5(d) {
	d = parseInt(d); lastFn = "m7s5"; lastDegree = d;
	if (!gridTypeValid(d, "m7s5")) return;
	var notes = buildNotes(d, [0,2,4,6]);
	// Augmenter la quinte (index 2) d'un demi-ton
	if (notes.length > 2) notes[2]++;
	sendChord(noteName(notes[0]) + "m7#5", notes);
}

function release() {
	sendNoteOff();
}

// =====================================================
// ACCORDS EMPRUNTÉS (borrowed / modal interchange)
// Construit un accord à partir d'un décalage en demi-tons depuis
// la tonique + un type explicite. Passe par le pipeline normal
// (voicing, voice leading, sortie, moniteur).
// =====================================================

function colorchord(semis, type) {
	semis = parseInt(semis);
	type  = String(type);

	var ivs;
	switch(type) {
		case "min":   ivs = [0,3,7];    break;
		case "dim7":  ivs = [0,3,6,9];  break;
		case "maj7":  ivs = [0,4,7,11]; break;
		case "dom7":  ivs = [0,4,7,10]; break;
		default:      ivs = [0,4,7];    break;  // maj
	}

	var base  = root + semis + (4 + currentOctave) * 12;
	var notes = [];
	for (var i = 0; i < ivs.length; i++) {
		var m = base + ivs[i];
		if (m >= 0 && m <= 127) notes.push(m);
	}

	lastFn = "color"; lastDegree = semis;
	var suffix = (type === "min") ? "m" : (type === "dim7") ? "dim7"
	           : (type === "maj7") ? "maj7" : (type === "dom7") ? "7" : "";
	sendChord(noteName(notes[0]) + suffix, notes);
}

// Diffusion initiale de la grille (différée le temps que l'UI charge)
var gridInitTask = new Task(broadcastGrid, this);
gridInitTask.schedule(700);

