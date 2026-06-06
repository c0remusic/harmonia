// push2_api.js — Intégration Push 2 via l'API Control Surface (LOM)
// Remplace l'approche MIDI (push2_map.js) qui ne pouvait pas viser le Push.
//
// inlet 0  → broadcast grille du moteur (gridclear/gridcell/gridbor/griddone)
//            + "init" (bang depuis live.thisdevice) pour (re)trouver le Push
//            + "test" pour allumer un pad de test
// outlet 0 → jeu vers le moteur : "padvel v", "playcell col row", "release"
//
// IMPORTANT : LiveAPI interdit en code global → tout dans des fonctions.

autowatch = 1;
inlets  = 1;
outlets = 1;

// =====================================================
// ÉTAT
// =====================================================
var matrix  = null;     // LiveAPI vers Button_Matrix du Push
var grabbed = false;

// Couleurs (index palette Push 2 — à affiner)
var COLOR_OFF = 0;
var COLOR_BOR = 9;      // orange
function colorForFn(fn) {
	switch(fn) {
		case "triad":            return 21;
		case "sus2": case "sus4":return 37;
		case "seven":            return 45;
		case "nine":             return 49;
		case "add9":             return 57;
		default:                 return 21;
	}
}

// Grille reçue du moteur (types seulement, pour couleurs)
var gCols = [[],[],[],[],[],[],[]];
var gBor  = [];
var gColsTmp, gBorTmp;

// =====================================================
// RÉCEPTION GRILLE
// =====================================================
function gridclear() { gColsTmp = [[],[],[],[],[],[],[]]; gBorTmp = []; }
function gridcell(col, fn, label) { if (!gColsTmp) gridclear(); gColsTmp[parseInt(col)].push({ fn:String(fn) }); }
function gridbor(i, label, semis, type, roman) { if (!gBorTmp) gBorTmp = []; gBorTmp[parseInt(i)] = { fn:"borrowed" }; }
function griddone() {
	if (gColsTmp) gCols = gColsTmp;
	if (gBorTmp)  gBor  = gBorTmp;
	gColsTmp = null; gBorTmp = null;
	refreshPads();
}
// messages non-grille ignorés
function root() {} function scale() {} function notes() {} function clearnotes() {}
function active() {}   // (plus tard : flash du pad joué)

// =====================================================
// RECHERCHE & PRISE DU PUSH 2
// =====================================================
var matrixCS = null;    // le control surface qui possède la matrice

function init() {
	matrix = null; matrixCS = null; grabbed = false;
	post("--- PUSH2 API : recherche du Push ---\n");

	for (var i = 0; i < 10; i++) {
		var cs = new LiveAPI("control_surfaces " + i);
		var cid = parseInt(cs.id);
		if (isNaN(cid) || cid == 0) { post("  CS " + i + " : vide\n"); continue; }  // slot vraiment vide

		// Liste des contrôles : seul le vrai Push a "Button_Matrix"
		var names = [];
		try { names = cs.call("get_control_names"); } catch(eC) {}
		var nNames = (names instanceof Array) ? names.length : 0;

		var hasMatrix = false;
		if (names instanceof Array) {
			for (var k = 0; k < names.length; k++) { if (String(names[k]) === "Button_Matrix") { hasMatrix = true; break; } }
		}
		post("  CS " + i + " : id=" + cs.id + "  contrôles=" + nNames + "  Button_Matrix=" + hasMatrix + "\n");

		if (!hasMatrix) continue;

		var ret = cs.call("get_control_by_name", "Button_Matrix");
		var mid = (ret instanceof Array) ? ret[ret.length - 1] : ret;
		matrixCS = cs;
		// id négatif → on le pose directement (le chemin "id -3" peut mal se parser)
		matrix = new LiveAPI(onMatrix);
		matrix.id = mid;
		post("    ✓ Push CS " + i + " — Button_Matrix id=" + mid + " matrix.id=" + matrix.id +
		     " path=" + matrix.path + "\n");
		break;
	}

	if (!matrix) {
		post("PUSH2 : aucune matrice valide trouvée.\n");
		post(">> Vérifie que Push 2 est sélectionné comme Control Surface dans Live (Préférences MIDI).\n");
		return;
	}

	// grab : grab_control attend l'OBJET contrôle (id), pas le nom.
	// En LiveAPI on passe une référence d'objet via "id", <num>.
	var bid = matrix.id;
	try { matrixCS.call("grab_control", "id", bid); grabbed = true; post("PUSH2 : grab_control(id " + bid + ") envoyé\n"); }
	catch(e3) { post("PUSH2 : grab_control échec : " + e3 + "\n"); }

	// observe les pressions
	try { matrix.property = "value"; post("PUSH2 : observation 'value' activée\n"); }
	catch(e4) { post("PUSH2 : observe échec : " + e4 + "\n"); }

	refreshPads();
}

// Callback des pressions de pad — format à découvrir (on dump tout)
function onMatrix(args) {
	post("PUSH2 onMatrix args = " + args + "\n");
	// hypothèse : args = [ "value", col, row, velocity ]
	if (!args) return;
	var a = (args.length !== undefined) ? args : [args];
	// on tente d'extraire col,row,vel selon différents formats
	var col, row, vel;
	if (a[0] === "value") { col = a[1]; row = a[2]; vel = a[3]; }
	else                  { col = a[0]; row = a[1]; vel = a[2]; }
	if (col === undefined) return;
	handlePad(parseInt(col), parseInt(row), parseInt(vel));
}

function handlePad(col, row, vel) {
	// Push : (col, row) — on convertira selon ce que renvoie l'observer
	if (vel === 0) { outlet(0, "release"); return; }
	outlet(0, "padvel", vel);
	outlet(0, "playcell", col, row);
}

// =====================================================
// LEDS
// =====================================================
function setPad(col, row, color) {
	if (!matrix) return;
	try { matrix.call("send_value", col, row, color); }
	catch(e) { post("send_value échec : " + e + "\n"); }
}

function refreshPads() {
	if (!matrix || !matrix.id || matrix.id == 0) return;   // pas de matrice valide → on n'envoie rien
	for (var r = 0; r < 8; r++) {
		for (var c = 0; c < 8; c++) setPad(c, r, COLOR_OFF);
	}
	for (var col = 0; col < 7; col++) {
		for (var row = 0; row < gCols[col].length; row++) {
			setPad(col, row, colorForFn(gCols[col][row].fn));
		}
	}
	for (var i = 0; i < gBor.length; i++) setPad(7, i, COLOR_BOR);
}

// TEST multi-méthodes : on essaie plusieurs façons d'allumer un pad.
// Regarde quel pad (s'il y en a un) s'allume sur le Push.
function test() {
	post("=== PUSH2 TEST multi-méthodes ===\n");

	// Méthode A : matrix.send_value(col, row, color)
	if (matrix) {
		try { matrix.call("send_value", 0, 0, 122); post("A: matrix send_value(0,0,122) [pad coin]\n"); }
		catch(e){ post("A err " + e + "\n"); }
	}

	// Méthode B : matrix.send_value(color, col, row) — valeur en premier
	if (matrix) {
		try { matrix.call("send_value", 21, 2, 0); post("B: matrix send_value(21,2,0)\n"); }
		catch(e){ post("B err " + e + "\n"); }
	}

	// Méthode C : bouton individuel "0_Clip_0_Button" send_value(color)
	lightButton("0_Clip_0_Button", 122, "C");

	// Méthode D : bouton individuel "7_Clip_7_Button" send_value(color)
	lightButton("7_Clip_7_Button", 45, "D");

	post("=== fin test — regarde quel pad s'est allumé ===\n");
}

function lightButton(name, color, lbl) {
	try {
		var cs = new LiveAPI("control_surfaces 0");
		var ret = cs.call("get_control_by_name", name);
		var bid = (ret instanceof Array) ? ret[ret.length - 1] : ret;
		var btn = new LiveAPI();
		btn.id = bid;
		btn.call("send_value", color);
		post(lbl + ": " + name + " send_value(" + color + ") id=" + bid + " path=" + btn.path + "\n");
	} catch(e) { post(lbl + " err " + e + "\n"); }
}

function update() { refreshPads(); }

// Diagnostic : liste les noms de contrôles contenant matrix/pad/button/rgb
function names() {
	var cs = new LiveAPI("control_surfaces 0");
	var list = [];
	try { list = cs.call("get_control_names"); } catch(e) { post("err: " + e + "\n"); return; }
	post("--- contrôles pertinents (sur " + (list.length||0) + ") ---\n");
	if (!(list instanceof Array)) { post("pas de liste\n"); return; }
	for (var i = 0; i < list.length; i++) {
		var n = String(list[i]).toLowerCase();
		if (n.indexOf("matrix") >= 0 || n.indexOf("pad") >= 0 ||
		    n.indexOf("button") >= 0 || n.indexOf("rgb") >= 0 || n.indexOf("note") >= 0) {
			post("  " + list[i] + "\n");
		}
	}
	post("--- fin ---\n");
}

post("PUSH2 API LOADED\n");
