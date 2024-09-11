'use strict';
let $chartjs = {
	prop: {
		metaColumns: {
			"YEAR": {
				"FieldID": "YEAR", "DataType": "int"
			},
			"4Y020": {
				"FieldID": "4Y020", "DataType": "int"
			},
			"4Y030": {
				"FieldID": "4Y030", "DataType": "int"
			},
			"4Y050": {
				"FieldID": "4Y050", "DataType": "int"
			},
			"4Y060": {
				"FieldID": "4Y060", "DataType": "int"
			},
			"4Y070": {
				"FieldID": "4Y070", "DataType": "int"
			}
		},

		dataSource: [
			{ "YEAR": 2014, "4Y020": 0, "4Y030": 70, "4Y050": 40, "4Y060": 20, "4Y070": 80 },
			{ "YEAR": 2015, "4Y020": 30, "4Y030": 40, "4Y050": 10, "4Y060": 10, "4Y070": 20 },
			{ "YEAR": 2016, "4Y020": 90, "4Y030": 10, "4Y050": 80, "4Y060": 50, "4Y070": 30 },
			{ "YEAR": 2017, "4Y020": 80, "4Y030": 40, "4Y050": 70, "4Y060": 10, "4Y070": 70 },
			{ "YEAR": 2018, "4Y020": 20, "4Y030": 0, "4Y050": 50, "4Y060": 50, "4Y070": 90 },
			{ "YEAR": 2019, "4Y020": 90, "4Y030": 20, "4Y050": 30, "4Y060": 90, "4Y070": 50 },
			{ "YEAR": 2020, "4Y020": 70, "4Y030": 30, "4Y050": 50, "4Y060": 70, "4Y070": 90 }
		],
	},

	event: {
		btnGetValue_click() {
			syn.$l.eventLog('btnGetValue_click', JSON.stringify(syn.uicontrols.$chartjs.getValue('chtChart')));
		},

		btnSetValue_click() {
			syn.uicontrols.$chartjs.setValue('chtChart', $this.prop.dataSource, $this.prop.metaColumns);
		},

		btnClear_click() {
			syn.uicontrols.$chartjs.clear('chtChart');
		}
	}
}
