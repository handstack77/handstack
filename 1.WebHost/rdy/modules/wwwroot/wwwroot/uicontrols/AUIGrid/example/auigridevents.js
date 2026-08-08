'use strict';
let $auigridevents = {
    config: {
        dataSource: {
            CategoryID: {
                CodeColumnID: 'CodeID',
                ValueColumnID: 'CodeValue',
                DataSource: [
                    { CodeID: 'A', CodeValue: '기본값' },
                    { CodeID: 'B', CodeValue: '옵션값' },
                    { CodeID: 'C', CodeValue: '수식값' }
                ]
            }
        }
    },

    prop: {
        dataSet: {
            group: [
                { GroupCode: 'LD01', GroupName: '휴가 종류' },
                { GroupCode: 'MD01', GroupName: '결재 상태' }
            ],
            // 실무에서는 이 상세 목록을 그룹코드 선택 시점에 서버에서 조회(LD02 트랜잭션 등)해 오지만,
            // 이 예제는 서버 없이 동작을 보여주기 위해 클라이언트 배열에서 그룹코드로 필터링한다.
            detail: [
                { GroupCode: 'LD01', CodeID: '01', CodeValue: '연차', CategoryID: 'A', SortingNo: 1 },
                { GroupCode: 'LD01', CodeID: '02', CodeValue: '반차', CategoryID: 'A', SortingNo: 2 },
                { GroupCode: 'MD01', CodeID: '01', CodeValue: '기안', CategoryID: 'B', SortingNo: 1 },
                { GroupCode: 'MD01', CodeID: '02', CodeValue: '결재완료', CategoryID: 'B', SortingNo: 2 }
            ]
        }
    },

    hook: {
        pageLoad() {
            syn.uicontrols.$auigrid.setValue('grdGroup', $this.prop.dataSet.group);
        }
    },

    event: {
        grdGroup_afterSelectionEnd(elID, rowIndex, columnIndex, dataField, value) {
            var groupCode = syn.uicontrols.$auigrid.getDataAtCell('grdGroup', rowIndex, 'GroupCode');
            var rows = $this.prop.dataSet.detail.filter(function (row) { return row.GroupCode == groupCode; });
            syn.uicontrols.$auigrid.setValue('grdDetail', rows);
            syn.$l.eventLog('grdGroup_afterSelectionEnd', '{0} 상세코드 {1}건 표시'.format(groupCode, rows.length));
        },

        grdGroup_filtering(evt) {
            syn.uicontrols.$auigrid.clear('grdDetail');
        },

        grdDetail_afterSelectionEnd(elID, rowIndex, columnIndex, dataField, value) {
            syn.$l.eventLog('grdDetail_afterSelectionEnd', '{0},{1}'.format(rowIndex, dataField));
        },

        grdDetail_afterChange(elID, rowIndex, columnIndex, dataField, oldValue, newValue, item) {
            syn.$l.eventLog('grdDetail_afterChange', '{0}: {1} -> {2}'.format(dataField, oldValue, newValue));
        },

        btnGetFlag_click() {
            var rowIndex = syn.uicontrols.$auigrid.getActiveRowIndex('grdDetail');
            if (rowIndex > -1) {
                var flag = syn.uicontrols.$auigrid.getFlag('grdDetail', rowIndex);
                syn.$l.eventLog('btnGetFlag_click', 'rowIndex ' + rowIndex + ' Flag: ' + flag);
            }
        },

        btnGetValue_click() {
            var rows = syn.uicontrols.$auigrid.getValue('grdDetail', 'List');
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(rows));
        }
    }
}
