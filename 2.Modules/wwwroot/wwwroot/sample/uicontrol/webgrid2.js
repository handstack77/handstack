'use strict';
let $webgrid2 = {
	prop: {
		metaColumns: {
			"Flag": {
				"fieldID": "Flag",
				"dataType": "string"
			},
			"PersonID": {
				"fieldID": "PersonID",
				"dataType": "int"
			},
			"UserName": {
				"fieldID": "UserName",
				"dataType": "string"
			},
			"MaritalStatus": {
				"fieldID": "MaritalStatus",
				"dataType": "bool"
			},
			"ReligionYN": {
				"fieldID": "ReligionYN",
				"dataType": "bool"
			},
			"GenderType": {
				"fieldID": "GenderType",
				"dataType": "string"
			},
			"GenderTypeName": {
				"fieldID": "GenderType",
				"dataType": "string"
			},
			"CreateDateTime": {
				"fieldID": "CreateDateTime",
				"dataType": "string"
			}
		},

		grid_setValue: null,

		dataSource: [
			{ Flag: 'R', PersonID: '1235571', UserName: 'hello world: <a href="http://www.naver.com" target="_blank">Ted Right</a> <img src="https://raw.githubusercontent.com/dotnet/machinelearning-samples/master/images/app-type-e2e-black.png" style="vertical-align:middle;height: 22px;"/>', MaritalStatus: 0, ReligionYN: 1, GenderType: '1', GenderTypeName: '남성', CreateDateTime: '2020-02-01' },
			{ Flag: 'R', PersonID: '1235572', UserName: '<a href="http://www.naver.com" target="_blank">Frank Honest</a>', MaritalStatus: 0, ReligionYN: 0, GenderType: '1', GenderTypeName: '남성', CreateDateTime: '2020-03-01' },
			{ Flag: 'R', PersonID: '1235573', UserName: '<a href="http://www.naver.com" target="_blank">Joan Well</a>', MaritalStatus: 1, ReligionYN: 0, GenderType: '2', GenderTypeName: '여성', CreateDateTime: '2020-02-11' },
			{ Flag: 'R', PersonID: '1235574', UserName: '<a href="http://www.naver.com" target="_blank">Gail Polite</a>', MaritalStatus: 1, ReligionYN: 0, GenderType: '2', GenderTypeName: '여성', CreateDateTime: '2020-02-21' },
			{ Flag: 'R', PersonID: '1235575', UserName: '<a href="http://www.naver.com" target="_blank">Michael Fair</a>', MaritalStatus: 0, ReligionYN: 1, GenderType: '3', GenderTypeName: '중성', CreateDateTime: '2020-04-01' },
			{ Flag: 'R', PersonID: '235576', UserName: '<a href="http://www.naver.com" target="_blank">Michael Fair</a>', MaritalStatus: 0, ReligionYN: 1, GenderType: '3', GenderTypeName: '중성', CreateDateTime: '2020-04-01' },
			{ Flag: 'R', PersonID: '235577', UserName: '<a href="http://www.naver.com" target="_blank">Michael Fair</a>', MaritalStatus: 0, ReligionYN: 1, GenderType: '3', GenderTypeName: '중성', CreateDateTime: '2020-04-01' },
			{ Flag: 'R', PersonID: '235578', UserName: '<a href="http://www.naver.com" target="_blank">Michael Fair</a>', MaritalStatus: 0, ReligionYN: 1, GenderType: '3', GenderTypeName: '중성', CreateDateTime: '2020-04-01' },
			{ Flag: 'R', PersonID: '235579', UserName: '<a href="http://www.naver.com" target="_blank">Michael Fair</a>', MaritalStatus: 0, ReligionYN: 1, GenderType: '3', GenderTypeName: '중성', CreateDateTime: '2020-04-01' },
			{ Flag: 'R', PersonID: '2355710', UserName: '<a href="http://www.naver.com" target="_blank">Michael Fair</a>', MaritalStatus: 0, ReligionYN: 1, GenderType: '3', GenderTypeName: '중성', CreateDateTime: '2020-04-01' },
			{ Flag: 'R', PersonID: '3355711', UserName: '<a href="http://www.naver.com" target="_blank">Michael Fair</a>', MaritalStatus: 0, ReligionYN: 1, GenderType: '3', GenderTypeName: '중성', CreateDateTime: '2020-04-01' },
			{ Flag: 'R', PersonID: '3355712', UserName: '<a href="http://www.naver.com" target="_blank">Michael Fair</a>', MaritalStatus: 0, ReligionYN: 1, GenderType: '3', GenderTypeName: '중성', CreateDateTime: '2020-04-01' },
			{ Flag: 'R', PersonID: '3355713', UserName: '<a href="http://www.naver.com" target="_blank">Michael Fair</a>', MaritalStatus: 0, ReligionYN: 1, GenderType: '3', GenderTypeName: '중성', CreateDateTime: '2020-04-01' },
			{ Flag: 'R', PersonID: '3355714', UserName: '<a href="http://www.naver.com" target="_blank">Michael Fair</a>', MaritalStatus: 0, ReligionYN: 1, GenderType: '3', GenderTypeName: '중성', CreateDateTime: '2020-04-01' },
			{ Flag: 'R', PersonID: '3355715', UserName: '<a href="http://www.naver.com" target="_blank">Michael Fair</a>', MaritalStatus: 0, ReligionYN: 1, GenderType: '3', GenderTypeName: '중성', CreateDateTime: '2020-04-01' },
			{ Flag: 'R', PersonID: '3355716', UserName: '<a href="http://www.naver.com" target="_blank">Michael Fair</a>', MaritalStatus: 0, ReligionYN: 1, GenderType: '3', GenderTypeName: '중성', CreateDateTime: '2020-04-01' },
			{ Flag: 'R', PersonID: '2355717', UserName: '<a href="http://www.naver.com" target="_blank">Michael Fair</a>', MaritalStatus: 0, ReligionYN: 1, GenderType: '3', GenderTypeName: '중성', CreateDateTime: '2020-04-01' },
			{ Flag: 'R', PersonID: '2355718', UserName: '<a href="http://www.naver.com" target="_blank">Michael Fair</a>', MaritalStatus: 0, ReligionYN: 1, GenderType: '3', GenderTypeName: '중성', CreateDateTime: '2020-04-01' },
			{ Flag: 'R', PersonID: '2355719', UserName: '<a href="http://www.naver.com" target="_blank">Michael Fair</a>', MaritalStatus: 0, ReligionYN: 1, GenderType: '3', GenderTypeName: '중성', CreateDateTime: '2020-04-01' }
		],
	},

	hook: {
		pageLoad() {
			$this.grid_setValue = syn.uicontrols.$auigrid.setValue;
			syn.uicontrols.$auigrid.setValue = function (elID, value, metaColumns) {
				$this.grid_setValue(elID, value, metaColumns);
			};
		},
	},

    event: {
        btnDynamicData_click() {
            var dataSource = $object.clone($this.prop.dataSource);
            var container1 = document.getElementById('example1');

            var headers = [];
            if (dataSource.length > 0) {
                var item = dataSource[0];
                for (var key in item) {
                    headers.push(key);
                }
            }

            var hot1 = new Handsontable(container1, {
                readOnly: true,
                data: dataSource,
                colHeaders: headers
            });
        },

		btnPseudoStyle_click() {
			var gridPseudo = '.handsontable tbody tr td:nth-of-type({0}) {' +
				'            background-color: #f0f0f0;' +
				'            text-decoration: underline;' +
				'            color: black;' +
				'            font-weight: 900;' +
				'            cursor: pointer;' +
				'        }';

			var head = document.head || document.getElementsByTagName('head')[0];
			var sheet = document.getElementById('cssWeekendPseudoStyle');
			sheet.innerHTML = '';

			var styles = [];
			for (var i = 0; i < 10; i++) {
				styles.push(gridPseudo.format(i.toString()));
			}

			sheet.innerHTML = styles.join('\n\n');
			head.appendChild(sheet);
		},

		grdGrid_afterSelectionEnd(row, column, row2, column2, selectionLayerLevel) {
		},

		grdGrid_beforeKeyDown() {
		},

		grdGrid_afterCreateRow() {
			// syn.uicontrols.$auigrid.setDataAtCell('grdGrid', arguments[0], "MaritalStatus", true);
		},

		btnGetValueRow_click() {
			syn.$l.eventLog('btnGetValue_click Row', JSON.stringify(syn.uicontrols.$auigrid.getValue('grdGrid', 'Row', $this.prop.metaColumns)));
		},

		btnGetValueList_click() {
			syn.$l.eventLog('btnGetValue_click List', JSON.stringify(syn.uicontrols.$auigrid.getValue('grdGrid', 'List', $this.prop.metaColumns)));
		},

		btnSetValue_click() {
			syn.uicontrols.$auigrid.setValue('grdGrid', $object.clone($this.prop.dataSource), $this.prop.metaColumns);
		},

		btnClear_click() {
			syn.uicontrols.$auigrid.clear('grdGrid');
		},

		btnGetInitializeColumns_click() {
			var columns = [
				['PersonID', '사용자ID', 200, false, 'numeric', false, 'left'],
				['UserName', '사용자', 200, false, 'text', false, 'left'],
				['GenderType', '성별ID', 200, false, 'text', false, 'left'],
				['GenderTypeName', '성별', 200, false, 'text', false, 'left']
			];

			var settings = syn.uicontrols.$auigrid.getInitializeColumns({ columns: columns });
			syn.$l.eventLog('btnGetInitializeColumns_click Row', JSON.stringify(settings));
		},

		btnGetSettings_click() {
			var settings = syn.uicontrols.$auigrid.getSettings('grdGrid');

			if (settings.data && settings.data.length > 0) {
				var length = settings.data.length;
				for (var i = 0; i < length; i++) {
					settings.data[i].MaritalStatus = false;
				}

				var hot = syn.uicontrols.$auigrid.getGridControl('grdGrid');
				hot.render();

				// syn.uicontrols.$auigrid.updateSettings('grdGrid', settings);
			}
		},

		btnUpdateSettings_click() {
			var settings = syn.uicontrols.$auigrid.getSettings('grdGrid');
			settings.cells = function (row, col, prop) {
				if (prop == 'ReligionYN') {
					var cellProperties = {};
					cellProperties.readOnly = true;
					return cellProperties;
				}
				else if (settings.keyLockedColumns.length > 0) {
					var cellProperties = {};
					var hot = this.instance;
					var rowData = hot.getSourceDataAtRow(row);

					if (rowData) {
						if (rowData.Flag && rowData.Flag != 'C' && settings.keyLockedColumns.indexOf(prop) > -1) {
							cellProperties.readOnly = true;
						}
					}

					return cellProperties;
				}
			};

			syn.uicontrols.$auigrid.updateSettings('grdGrid', settings);
		},

		btnUpdateSettings1_click() {
			var settings = syn.uicontrols.$auigrid.getSettings('grdGrid');
			settings.cells = function (row, col, prop) {
				if (settings.keyLockedColumns.length > 0) {
					var cellProperties = {};
					var hot = this.instance;
					var rowData = hot.getSourceDataAtRow(row);

					if (rowData) {
						if (rowData.Flag && rowData.Flag != 'C' && settings.keyLockedColumns.indexOf(prop) > -1) {
							cellProperties.readOnly = true;
						}
					}

					return cellProperties;
				}
			};

			syn.uicontrols.$auigrid.updateSettings('grdGrid', settings);
		},

		btnUpdateSettings2_click() {
			var settings = syn.uicontrols.$auigrid.getSettings('grdGrid');
			settings.nestedHeaders = [
				['A', { label: 'B', colspan: 8 }, 'C'],
				['블라', '블라', '블라', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
			];

			var hot = syn.uicontrols.$auigrid.getGridControl('grdGrid');
			var plugin = hot.getPlugin('autoColumnSize');

			if (plugin.isEnabled() == false) {
				plugin.enablePlugin();
			}

			setTimeout(function () {
				plugin.recalculateAllColumnsWidth();
				settings.colWidths = plugin.widths;
				syn.uicontrols.$auigrid.updateSettings('grdGrid', settings);
			}, 100);
		},


		btnLoadData_click() {
			syn.uicontrols.$auigrid.loadData('grdGrid', $object.clone($this.prop.dataSource));
		},

		btnCountRows_click() {
			syn.$l.eventLog('btnCountRows_click', JSON.stringify(syn.uicontrols.$auigrid.countRows('grdGrid', true)));
		},

		rowCount: 0,
		btnInsertRow_click() {
			syn.uicontrols.$auigrid.insertRow('grdGrid', {
				amount: 1
			}, function (row) {
				syn.uicontrols.$auigrid.setDataAtCell('grdGrid', row, 2, $this.rowCount++);
				syn.uicontrols.$auigrid.selectCell('grdGrid', row, 2);
			});
		},

		btnRemoveRow_click() {
			syn.uicontrols.$auigrid.removeRow('grdGrid');
		},

		btnIsUpdateData_click() {
			syn.$l.eventLog('btnIsUpdateData_click', JSON.stringify(syn.uicontrols.$auigrid.isUpdateData('grdGrid')));
		},

		btnGetFlag_click() {
			syn.$l.eventLog('btnGetFlag_click', JSON.stringify(syn.uicontrols.$auigrid.getFlag('grdGrid', 0)));
		},

		btnSetFlag_click() {
			syn.uicontrols.$auigrid.setFlag('grdGrid', 0, 'U');
			syn.$l.eventLog('btnGetFlag_click', JSON.stringify(syn.uicontrols.$auigrid.getFlag('grdGrid', 0)));
		},

		btnGetDataAtCell_click() {
			syn.$l.eventLog('btnGetDataAtCell_click', JSON.stringify(syn.uicontrols.$auigrid.getDataAtCell('grdGrid', 0, 2)));
		},

		btnSetDataAtCell_click() {
			syn.uicontrols.$auigrid.setDataAtCell('grdGrid', 0, 2, 'HELLO WORLD');
			syn.$l.eventLog('btnGetFlag_click', JSON.stringify(syn.uicontrols.$auigrid.getDataAtCell('grdGrid', 0, 2)));
		},

		btnGetCellMeta_click() {
			syn.$l.eventLog('btnGetCellMeta_click', JSON.stringify(syn.uicontrols.$auigrid.getCellMeta('grdGrid', 0, 2)));
		},

		btnSetCellMeta_click() {
			syn.uicontrols.$auigrid.setCellMeta('grdGrid', 0, 2, 'key', 'value');
		},

		btnGetUpdateData_click() {
			syn.$l.eventLog('btnGetUpdateData_click Row', JSON.stringify(syn.uicontrols.$auigrid.getUpdateData('grdGrid', 'Row', $this.prop.metaColumns)));
			syn.$l.eventLog('btnGetUpdateData_click List', JSON.stringify(syn.uicontrols.$auigrid.getUpdateData('grdGrid', 'List', $this.prop.metaColumns)));
		},

		btnGetPhysicalRowIndex_click() {
			syn.$l.eventLog('btnGetPhysicalRowIndex_click', JSON.stringify(syn.uicontrols.$auigrid.getPhysicalRowIndex('grdGrid', 0)));
		},

		btnGetPhysicalColIndex_click() {
			syn.$l.eventLog('btnGetPhysicalColIndex_click', JSON.stringify(syn.uicontrols.$auigrid.getPhysicalColIndex('grdGrid', 2)));
		},

		btnGetSourceDataAtRow_click() {
			syn.$l.eventLog('btnGetSourceDataAtRow_click', JSON.stringify(syn.uicontrols.$auigrid.getSourceDataAtRow('grdGrid', 0)));
		},

		btnVisibleColumns_click() {
			syn.uicontrols.$auigrid.visibleColumns('grdGrid', [7], false);

			// setTimeout(function () {
			//     alert('click to show !!!');
			// 
			//     syn.uicontrols.$auigrid.visibleColumns('grdGrid', [1, 2], true);
			// }, 25);
		},

		btnVisibleRows_click() {
			syn.uicontrols.$auigrid.visibleRows('grdGrid', [1, 2], false);

			// setTimeout(function () {
			//     alert('click to show !!!');
			// 
			//     syn.uicontrols.$auigrid.visibleRows('grdGrid', [1, 2], true);
			// }, 25);
		},

		btnUnHiddenRows_click() {
			syn.uicontrols.$auigrid.unHiddenRows('grdGrid');
		},

		btnUnHiddenColumns_click() {
			syn.uicontrols.$auigrid.unHiddenColumns('grdGrid');
		},

		btnPropToCol_click() {
			syn.$l.eventLog('btnPropToCol_click', JSON.stringify(syn.uicontrols.$auigrid.propToCol('grdGrid', 'GenderType')));
		},

		btnColToProp_click() {
			syn.$l.eventLog('btnColToProp_click', JSON.stringify(syn.uicontrols.$auigrid.colToProp('grdGrid', 2)));
		},

		btnGetColHeader_click() {
			syn.$l.eventLog('btnGetColHeader_click', JSON.stringify(syn.uicontrols.$auigrid.getColHeader('grdGrid', 2)));
		},

		btnCountCols_click() {
			syn.$l.eventLog('btnCountCols_click', JSON.stringify(syn.uicontrols.$auigrid.countCols('grdGrid')));
		},

		btnGetSelected_click() {
			syn.$l.eventLog('btnGetSelected_click', JSON.stringify(syn.uicontrols.$auigrid.getSelected('grdGrid')));
		},

		btnGetActiveRowIndex_click() {
			syn.$l.eventLog('btnGetActiveRowIndex_click', JSON.stringify(syn.uicontrols.$auigrid.getActiveRowIndex('grdGrid')));
		},

		btnGetActiveColIndex_click() {
			syn.$l.eventLog('btnGetActiveColIndex_click', JSON.stringify(syn.uicontrols.$auigrid.getActiveColIndex('grdGrid')));
		},

		btnSelectCell_click() {
			syn.uicontrols.$auigrid.selectCell('grdGrid', 0, 2)
		},

		btnExportFile_click() {
			syn.uicontrols.$auigrid.exportFile('grdGrid', { filename: 'grid' });
		},

		btnExportAsString_click() {
			var value = syn.uicontrols.$auigrid.exportAsString('grdGrid');
			syn.$l.eventLog('btnExportAsString_click', value);
		},

		btnImportFile_click() {
			syn.uicontrols.$auigrid.importFile('grdGrid');
		},

		btnGetGridControl_click() {
			var hot = syn.uicontrols.$auigrid.getGridControl('grdGrid');
		},

		btnGetGridSetting_click() {
			var gridSettings = syn.uicontrols.$auigrid.getGridSetting('grdGrid');
		},

		btnGetColumnWidths_click() {
			syn.$l.eventLog('btnGetColumnWidths_click', JSON.stringify(syn.uicontrols.$auigrid.getColumnWidths('grdGrid')));
		},

		btnScrollViewportTo_click() {
			syn.uicontrols.$auigrid.scrollViewportTo('grdGrid', 0, 2);
		},

		btnIsEmptyRow_click() {
			syn.$l.eventLog('btnIsEmptyRow_click', JSON.stringify(syn.uicontrols.$auigrid.isEmptyRow('grdGrid', 0)));
		},

		btnIsEmptyCol_click() {
			syn.$l.eventLog('btnIsEmptyCol_click', JSON.stringify(syn.uicontrols.$auigrid.isEmptyCol('grdGrid', 2)));
		},

		btnGetDataAtRow_click() {
			syn.$l.eventLog('btnGetDataAtRow_click', JSON.stringify(syn.uicontrols.$auigrid.getDataAtRow('grdGrid', 0)));
		},

		btnGetDataAtCol_click() {
			syn.$l.eventLog('btnGetDataAtCol_click', JSON.stringify(syn.uicontrols.$auigrid.getDataAtCol('grdGrid', 2)));
		},

		btnGetSourceDataAtCol_click() {
			syn.$l.eventLog('btnGetSourceDataAtCol_click', JSON.stringify(syn.uicontrols.$auigrid.getSourceDataAtCol('grdGrid', 2)));
		},

		btnSetDataAtRow_click() {
			syn.uicontrols.$auigrid.setDataAtRow('grdGrid', [[0, 0, 'U'], [0, 1, '7'], [0, 2, 'HELLO WORLD'], [0, 3, '2'], [0, 4, '여성']]);
		},

		btnValidateColumns_click() {
			syn.$l.eventLog('btnValidateColumns_click', JSON.stringify(syn.uicontrols.$auigrid.validateColumns('grdGrid', [0, 1, 2])));
		},

		btnValidateRows_click() {
			syn.$l.eventLog('btnValidateRows_click', JSON.stringify(syn.uicontrols.$auigrid.validateRows('grdGrid', [0, 1, 2])));
		},

		btnGetLogicalRowIndex_click() {
			syn.$l.eventLog('btnGetFlag_click', JSON.stringify(syn.uicontrols.$auigrid.getLogicalRowIndex('grdGrid', 0)));
		},

		btnGetLogicalColIndex_click() {
			syn.$l.eventLog('btnGetLogicalColIndex_click', JSON.stringify(syn.uicontrols.$auigrid.getLogicalColIndex('grdGrid', 2)));
		},

		btnGetFirstShowColIndex_click() {
			syn.$l.eventLog('btnGetFirstShowColIndex_click', JSON.stringify(syn.uicontrols.$auigrid.getFirstShowColIndex('grdGrid')));
		},

		btnGetLastShowColIndex_click() {
			syn.$l.eventLog('btnGetLastShowColIndex_click', JSON.stringify(syn.uicontrols.$auigrid.getLastShowColIndex('grdGrid')));
		},

		btnAddCondition_click() {
			syn.uicontrols.$auigrid.addCondition('grdGrid', 'GenderType', 'by_value', '1');
			syn.uicontrols.$auigrid.addCondition('grdGrid', 'CreateDateTime', 'lt', '2020-03-01');
		},

		btnRemoveCondition_click() {
			syn.uicontrols.$auigrid.removeCondition('grdGrid', 'GenderType');
		},

		btnClearConditions_click() {
			syn.uicontrols.$auigrid.clearConditions('grdGrid');
		},

		grdGrid_cellButtonClick(elID, row, column, prop, value) {
			syn.$l.eventLog('grdGrid_cellButtonClick', '{0}, {1}, {2}, {3}, {4}'.format(elID, row, column, prop, value));
		},

		grdGrid_cellRadioClick(elID, row, column, prop, value) {
			syn.$l.eventLog('grdGrid_cellRadioClick', '{0}, {1}, {2}, {3}, {4}'.format(elID, row, column, prop, value));
		},

		btnMerge_click() {
			syn.uicontrols.$auigrid.merge('grdGrid', 1, 1, 3, 1);

			syn.uicontrols.$auigrid.scrollViewportTo('grdGrid', 1, 1);
			setTimeout(function () {
				syn.uicontrols.$auigrid.scrollViewportTo('grdGrid', 0, 1);
			}, 25);
		},

		btnUnMerge_click() {
			var rowCount = syn.uicontrols.$auigrid.countRows('grdGrid');
			syn.uicontrols.$auigrid.unmerge('grdGrid', 1, 1, rowCount, 1);
		},

		isAlert: true,
		btnIsCellClassName_click() {
			alert(syn.uicontrols.$auigrid.isCellClassName('grdGrid', 0, 3, 'my-class'));
		},

		btnSetCellClassName_click() {
			syn.uicontrols.$auigrid.setCellClassName('grdGrid', -1, -1, 'my-class', $this.isAlert);
			$this.isAlert = !$this.isAlert;
		},

		grdGrid_applyCells(elID, row, column, prop) {

		},

		grdGrid_customSummary(elID, columnID, col, columnData) {
			return '합계: 12345';
		},

		grdGrid_selectAllCheck(elID, col, checked) {
			var hot = syn.uicontrols.$auigrid.getGridControl(elID);
			var gridSettings = syn.uicontrols.$auigrid.getSettings(elID);

			if (gridSettings.data && gridSettings.data.length > 0) {
				var visiblePersonIDs = syn.uicontrols.$auigrid.getDataAtCol(elID, 'PersonID');
				var data = gridSettings.data;
				var filterdData = data.filter(function (item) {
					var result = false;
					if (visiblePersonIDs.indexOf(item.PersonID) > -1) {
						result = true;
					}

					return result;
				});

				var length = filterdData.length;
				var colProp = hot.colToProp(col);
				for (var i = 0; i < length; i++) {
					var flag = filterdData[i]['Flag'];
					if (flag == 'R') {
						filterdData[i]['Flag'] = 'U';
					}

					if (flag != 'S') {
						filterdData[i][colProp] = checked == true ? '1' : '0';
					}
				}
			}
		},

		btnRefreshSummary_click() {
			syn.uicontrols.$auigrid.refreshSummary('grdGrid');
		}
	},
}
