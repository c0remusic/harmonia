{
	"patcher" : 	{
		"fileversion" : 1,
		"appversion" : 		{
			"major" : 9,
			"minor" : 0,
			"revision" : 7,
			"architecture" : "x64",
			"modernui" : 1
		}
,
		"classnamespace" : "box",
		"rect" : [ 100.0, 100.0, 900.0, 700.0 ],
		"openinpresentation" : 1,
		"default_fontsize" : 11.0,
		"gridsize" : [ 15.0, 15.0 ],
		"boxes" : [ 			{
				"box" : 				{
					"id" : "obj-CE",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 8,
					"outlettype" : [ "", "", "", "", "", "", "", "" ],
					"patching_rect" : [ 30.0, 250.0, 160.0, 21.0 ],
					"saved_object_attributes" : 					{
						"filename" : "chord_engine.js",
						"parameter_enable" : 0
					}
,
					"text" : "js chord_engine.js"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-NO0",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 0,
					"patching_rect" : [ 30.0, 300.0, 55.0, 21.0 ],
					"text" : "noteout"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-NO1",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 0,
					"patching_rect" : [ 100.0, 300.0, 55.0, 21.0 ],
					"text" : "noteout"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-NO2",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 0,
					"patching_rect" : [ 170.0, 300.0, 55.0, 21.0 ],
					"text" : "noteout"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-NO3",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 0,
					"patching_rect" : [ 240.0, 300.0, 55.0, 21.0 ],
					"text" : "noteout"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-NO4",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 0,
					"patching_rect" : [ 310.0, 300.0, 55.0, 21.0 ],
					"text" : "noteout"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-NO5",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 0,
					"patching_rect" : [ 380.0, 300.0, 55.0, 21.0 ],
					"text" : "noteout"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-TQ",
					"items" : [ "C", ",", "C#", ",", "D", ",", "D#", ",", "E", ",", "F", ",", "F#", ",", "G", ",", "G#", ",", "A", ",", "A#", ",", "B" ],
					"maxclass" : "umenu",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "int", "", "" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 30.0, 60.0, 82.0, 21.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 5.0, 18.0, 82.0, 21.0 ],
					"varname" : "root_menu"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-SC",
					"items" : [ "major", ",", "minor", ",", "dorian", ",", "phrygian", ",", "lydian", ",", "mixolydian", ",", "harmminor" ],
					"maxclass" : "umenu",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "int", "", "" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 125.0, 60.0, 130.0, 21.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 95.0, 18.0, 130.0, 21.0 ],
					"varname" : "scale_menu"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-VC",
					"items" : [ "classic", ",", "piano", ",", "open", ",", "spread", ",", "house", ",", "proghouse" ],
					"maxclass" : "umenu",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "int", "", "" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 328.0, 60.0, 115.0, 21.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 290.0, 18.0, 115.0, 21.0 ],
					"varname" : "voicing_menu"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-VL",
					"maxclass" : "toggle",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 458.0, 60.0, 22.0, 22.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 418.0, 18.0, 22.0, 22.0 ]
				}

			}
, 			{
				"box" : 				{
					"fontsize" : 9.0,
					"id" : "obj-LBL-KEY",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 30.0, 44.0, 82.0, 17.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 5.0, 3.0, 82.0, 17.0 ],
					"text" : "KEY"
				}

			}
, 			{
				"box" : 				{
					"fontsize" : 9.0,
					"id" : "obj-LBL-SC",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 125.0, 44.0, 130.0, 17.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 95.0, 3.0, 130.0, 17.0 ],
					"text" : "SCALE"
				}

			}
, 			{
				"box" : 				{
					"fontsize" : 9.0,
					"id" : "obj-LBL-VC",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 328.0, 44.0, 115.0, 17.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 290.0, 3.0, 115.0, 17.0 ],
					"text" : "VOICING"
				}

			}
, 			{
				"box" : 				{
					"fontsize" : 9.0,
					"id" : "obj-LBL-VL",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 458.0, 44.0, 50.0, 17.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 418.0, 3.0, 50.0, 17.0 ],
					"text" : "V.LEAD"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-SEL",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 3,
					"outlettype" : [ "bang", "bang", "" ],
					"patching_rect" : [ 458.0, 90.0, 50.0, 21.0 ],
					"text" : "sel 0 1"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-VL-OFF",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 458.0, 120.0, 120.0, 21.0 ],
					"text" : "voiceleading off"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-VL-ON",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 588.0, 120.0, 115.0, 21.0 ],
					"text" : "voiceleading on"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-PRE-RIDX",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 30.0, 90.0, 120.0, 21.0 ],
					"text" : "prepend rootidx"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-S-RT",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 30.0, 120.0, 75.0, 21.0 ],
					"text" : "s root_idx"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-PRE-RT",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 115.0, 120.0, 95.0, 21.0 ],
					"text" : "prepend root"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-PRE-SIDX",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 125.0, 90.0, 125.0, 21.0 ],
					"text" : "prepend scaleidx"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-S-SC",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 125.0, 120.0, 80.0, 21.0 ],
					"text" : "s scale_idx"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-PRE-SC",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 215.0, 120.0, 100.0, 21.0 ],
					"text" : "prepend scale"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-PRE-VIDX",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 328.0, 90.0, 130.0, 21.0 ],
					"text" : "prepend voicingidx"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-LKO",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"patching_rect" : [ 30.0, 165.0, 175.0, 21.0 ],
					"saved_object_attributes" : 					{
						"filename" : "live_key_observer.js",
						"parameter_enable" : 0
					}
,
					"text" : "js live_key_observer.js"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-INIT",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "" ],
					"patching_rect" : [ 220.0, 165.0, 120.0, 21.0 ],
					"saved_object_attributes" : 					{
						"filename" : "init_menus.js",
						"parameter_enable" : 0
					}
,
					"text" : "js init_menus.js"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-LB",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 30.0, 205.0, 65.0, 21.0 ],
					"text" : "loadbang"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-THISDEV",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "bang", "" ],
					"patching_rect" : [ 250.0, 205.0, 110.0, 21.0 ],
					"text" : "live.thisdevice"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-MSG-READ",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 110.0, 205.0, 120.0, 21.0 ],
					"text" : "read chord_ui.js"
				}

			}
, 			{
				"box" : 				{
					"filename" : "C:/Users/LEETJ/Desktop/CHORD SELECTOR/chord_ui.js",
					"id" : "obj-UI",
					"maxclass" : "jsui",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 30.0, 370.0, 570.0, 200.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 5.0, 44.0, 570.0, 200.0 ]
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-NI",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "int", "int", "int" ],
					"patching_rect" : [ 500.0, 250.0, 55.0, 21.0 ],
					"text" : "notein"
				}

			}
, 			{
				"box" : {
					"id" : "obj-CI",
					"maxclass" : "newobj",
					"text" : "ctlin",
					"patching_rect" : [ 500.0, 340.0, 55.0, 21.0 ],
					"numinlets" : 0,
					"numoutlets" : 3,
					"outlettype" : [ "int", "int", "int" ]
				}
			}
, 			{
				"box" : {
					"id" : "obj-ROUTE64",
					"maxclass" : "newobj",
					"text" : "route 64",
					"patching_rect" : [ 500.0, 370.0, 65.0, 21.0 ],
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ]
				}
			}
, 			{
				"box" : {
					"id" : "obj-PRE-SP",
					"maxclass" : "newobj",
					"text" : "prepend sustainpedal",
					"patching_rect" : [ 500.0, 400.0, 145.0, 21.0 ],
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ]
				}
			}
, 			{
				"box" : 				{
					"id" : "obj-PK",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 500.0, 280.0, 60.0, 21.0 ],
					"text" : "pack i i"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-MM",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 3,
					"outlettype" : [ "", "", "" ],
					"patching_rect" : [ 500.0, 310.0, 120.0, 21.0 ],
					"saved_object_attributes" : 					{
						"filename" : "midi_map.js",
						"parameter_enable" : 0
					}
,
					"text" : "js midi_map.js"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-R-SC",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 640.0, 280.0, 80.0, 21.0 ],
					"text" : "r scale_idx"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-R-RT",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 730.0, 280.0, 75.0, 21.0 ],
					"text" : "r root_idx"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-P2",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 640.0, 370.0, 140.0, 21.0 ],
					"saved_object_attributes" : 					{
						"filename" : "push2_map.js",
						"parameter_enable" : 0
					}
,
					"text" : "js push2_map.js"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-R-SC2P",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 640.0, 400.0, 80.0, 21.0 ],
					"text" : "r scale_idx"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-R-RT2P",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 730.0, 400.0, 75.0, 21.0 ],
					"text" : "r root_idx"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-P2UP",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "int", "int" ],
					"patching_rect" : [ 640.0, 430.0, 75.0, 21.0 ],
					"text" : "unpack i i"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-P2NO",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 0,
					"patching_rect" : [ 640.0, 460.0, 55.0, 21.0 ],
					"text" : "noteout"
				}

			}
 ],
		"lines" : [ 			{
				"patchline" : 				{
					"destination" : [ "obj-NO0", 0 ],
					"source" : [ "obj-CE", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-NO0", 1 ],
					"order" : 5,
					"source" : [ "obj-CE", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-NO1", 0 ],
					"source" : [ "obj-CE", 2 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-NO1", 1 ],
					"order" : 4,
					"source" : [ "obj-CE", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-NO2", 0 ],
					"source" : [ "obj-CE", 3 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-NO2", 1 ],
					"order" : 3,
					"source" : [ "obj-CE", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-NO3", 0 ],
					"source" : [ "obj-CE", 4 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-NO3", 1 ],
					"order" : 2,
					"source" : [ "obj-CE", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-NO4", 0 ],
					"source" : [ "obj-CE", 5 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-NO4", 1 ],
					"order" : 1,
					"source" : [ "obj-CE", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-NO5", 0 ],
					"source" : [ "obj-CE", 6 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-NO5", 1 ],
					"order" : 0,
					"source" : [ "obj-CE", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-UI", 0 ],
					"source" : [ "obj-CE", 7 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-SC", 0 ],
					"source" : [ "obj-INIT", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-TQ", 0 ],
					"source" : [ "obj-INIT", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-VC", 0 ],
					"source" : [ "obj-INIT", 2 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-INIT", 0 ],
					"order" : 0,
					"source" : [ "obj-LB", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-LKO", 0 ],
					"source" : [ "obj-THISDEV", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-MSG-READ", 0 ],
					"order" : 1,
					"source" : [ "obj-LB", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-PRE-RIDX", 0 ],
					"order" : 2,
					"source" : [ "obj-LKO", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-PRE-RT", 0 ],
					"order" : 0,
					"source" : [ "obj-LKO", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-PRE-SC", 0 ],
					"order" : 0,
					"source" : [ "obj-LKO", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-PRE-SIDX", 0 ],
					"order" : 2,
					"source" : [ "obj-LKO", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-S-RT", 0 ],
					"order" : 1,
					"source" : [ "obj-LKO", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-S-SC", 0 ],
					"order" : 1,
					"source" : [ "obj-LKO", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-CE", 0 ],
					"source" : [ "obj-MM", 2 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-CE", 1 ],
					"source" : [ "obj-MM", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-CE", 0 ],
					"source" : [ "obj-MM", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-UI", 0 ],
					"source" : [ "obj-MSG-READ", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-PK", 1 ],
					"source" : [ "obj-NI", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-PK", 0 ],
					"source" : [ "obj-NI", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-P2UP", 0 ],
					"source" : [ "obj-P2", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-P2NO", 0 ],
					"source" : [ "obj-P2UP", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-P2NO", 1 ],
					"source" : [ "obj-P2UP", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-MM", 0 ],
					"source" : [ "obj-PK", 0 ]
				}

			}
, 			{
				"patchline" : {
					"destination" : [ "obj-ROUTE64", 0 ],
					"source" : [ "obj-CI", 0 ]
				}
			}
, 			{
				"patchline" : {
					"destination" : [ "obj-ROUTE64", 0 ],
					"source" : [ "obj-CI", 1 ]
				}
			}
, 			{
				"patchline" : {
					"destination" : [ "obj-PRE-SP", 0 ],
					"source" : [ "obj-ROUTE64", 0 ]
				}
			}
, 			{
				"patchline" : {
					"destination" : [ "obj-CE", 0 ],
					"source" : [ "obj-PRE-SP", 0 ]
				}
			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-CE", 0 ],
					"source" : [ "obj-PRE-RIDX", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-UI", 0 ],
					"source" : [ "obj-PRE-RT", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-UI", 0 ],
					"source" : [ "obj-PRE-SC", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-CE", 0 ],
					"source" : [ "obj-PRE-SIDX", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-CE", 0 ],
					"source" : [ "obj-PRE-VIDX", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-MM", 2 ],
					"source" : [ "obj-R-RT", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-P2", 2 ],
					"source" : [ "obj-R-RT2P", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-MM", 1 ],
					"source" : [ "obj-R-SC", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-P2", 1 ],
					"source" : [ "obj-R-SC2P", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-PRE-SC", 0 ],
					"order" : 0,
					"source" : [ "obj-SC", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-PRE-SIDX", 0 ],
					"order" : 2,
					"source" : [ "obj-SC", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-S-SC", 0 ],
					"order" : 1,
					"source" : [ "obj-SC", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-VL-OFF", 0 ],
					"source" : [ "obj-SEL", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-VL-ON", 0 ],
					"source" : [ "obj-SEL", 1 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-PRE-RIDX", 0 ],
					"order" : 2,
					"source" : [ "obj-TQ", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-PRE-RT", 0 ],
					"order" : 0,
					"source" : [ "obj-TQ", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-S-RT", 0 ],
					"order" : 1,
					"source" : [ "obj-TQ", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-CE", 0 ],
					"source" : [ "obj-UI", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-PRE-VIDX", 0 ],
					"source" : [ "obj-VC", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-SEL", 0 ],
					"source" : [ "obj-VL", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-CE", 0 ],
					"source" : [ "obj-VL-OFF", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-CE", 0 ],
					"source" : [ "obj-VL-ON", 0 ]
				}

			}
 ],
		"dependency_cache" : [ 			{
				"name" : "chord_engine.js",
				"bootpath" : "~/Desktop/CHORD SELECTOR",
				"patcherrelativepath" : ".",
				"type" : "TEXT",
				"implicit" : 1
			}
, 			{
				"name" : "chord_ui.js",
				"bootpath" : "~/Desktop/CHORD SELECTOR",
				"patcherrelativepath" : ".",
				"type" : "TEXT",
				"implicit" : 1
			}
, 			{
				"name" : "init_menus.js",
				"bootpath" : "~/Desktop/CHORD SELECTOR",
				"patcherrelativepath" : ".",
				"type" : "TEXT",
				"implicit" : 1
			}
, 			{
				"name" : "live_key_observer.js",
				"bootpath" : "~/Desktop/CHORD SELECTOR",
				"patcherrelativepath" : ".",
				"type" : "TEXT",
				"implicit" : 1
			}
, 			{
				"name" : "midi_map.js",
				"bootpath" : "~/Desktop/CHORD SELECTOR",
				"patcherrelativepath" : ".",
				"type" : "TEXT",
				"implicit" : 1
			}
, 			{
				"name" : "push2_map.js",
				"bootpath" : "~/Desktop/CHORD SELECTOR",
				"patcherrelativepath" : ".",
				"type" : "TEXT",
				"implicit" : 1
			}
 ],
		"autosave" : 0,
		"oscreceiveudpport" : 0
	}

}
