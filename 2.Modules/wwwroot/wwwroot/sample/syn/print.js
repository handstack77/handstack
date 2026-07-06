'use strict';
let $print = {
    prop: {
        demoWorkItems: [
            { document: 0, worksheet: 'Sheet1', datafield: 'CompanyName', bind: 'cell', row: 1, col: 1, type: 'text', data: null },
            { document: 0, worksheet: 'Sheet1', datafield: 'ReportDate', bind: 'cell', row: 1, col: 2, type: 'text', data: null }
        ],
        demoDataSource: {
            header: { CompanyName: 'HandStack Inc.', ReportDate: '2026-07-06' },
            details: [
                { ProductName: 'Widget A', Qty: 10 },
                { ProductName: 'Widget B', Qty: 5 }
            ]
        },
        demoFormData: [
            { ProductName: 'Widget A', Qty: 10 },
            { ProductName: 'Widget B', Qty: 5 },
            { ProductName: 'Widget C', Qty: 3 }
        ]
    },

    hook: {
        pageLoad() {
            syn.$l.get('txt_config').value = `reportifyPath: ${syn.$p.reportifyPath}, reportifyTemplateUrl: ${syn.$p.reportifyTemplateUrl}`;
            $print.method.renderWorkItems();
        }
    },

    method: {
        renderWorkItems() {
            syn.$l.get('txt_workItems').value = JSON.stringify($print.prop.demoWorkItems, null, 2);
        }
    },

    event: {
        btn_getReportifyUrl_click() {
            var actionName = syn.$l.get('txt_actionName').value;
            syn.$l.get('txt_getReportifyUrl').value = syn.$p.getReportifyUrl(actionName);
        },

        btn_getDocumentTemplateUrl_click() {
            var reportFileID = syn.$l.get('txt_reportFileID').value;
            syn.$l.get('txt_getDocumentTemplateUrl').value = syn.$p.getDocumentTemplateUrl(reportFileID);
        },

        btn_addWorkItem_click() {
            syn.$p.addWorkItem($print.prop.demoWorkItems, {
                document: 0,
                worksheet: 'Sheet1',
                datafield: ['ProductName', 'Qty'],
                bind: 'list',
                row: 3,
                col: 1,
                type: 'text'
            });
            $print.method.renderWorkItems();
        },

        btn_addAtWorkItem_click() {
            // target.datafield는 workItems 내에 이미 존재하는(같은 document/worksheet) 항목의 datafield와 일치해야
            // 그 항목을 기준으로 삽입 위치를 찾는다. 여기서는 'CompanyName'을 다른 셀(row 1, col 3)에도 반복 출력하는 예시.
            syn.$p.addAtWorkItem($print.prop.demoWorkItems, 0, 'Sheet1', 'CompanyName', {
                document: 0,
                worksheet: 'Sheet1',
                datafield: 'CompanyName',
                bind: 'cell',
                row: 1,
                col: 3,
                type: 'text'
            }, true);
            $print.method.renderWorkItems();
        },

        btn_updateWorkItem_click() {
            syn.$p.updateWorkItem($print.prop.demoWorkItems, 0, 'Sheet1', 'ReportDate', { data: '2026-07-07', type: 'date' });
            $print.method.renderWorkItems();
        },

        btn_removeWorkItem_click() {
            syn.$p.removeWorkItem($print.prop.demoWorkItems, 0, 'Sheet1', 'ReportDate');
            $print.method.renderWorkItems();
        },

        btn_calculateOffsets_click() {
            syn.$l.get('txt_calculateOffsets').value = JSON.stringify(syn.$p.calculateOffsets(10, 3));
        },

        btn_bindingWorkItems_click() {
            var result = syn.$p.bindingWorkItems($print.prop.demoWorkItems, $print.prop.demoDataSource, 1);
            syn.$l.get('txt_bindingWorkItems').value = JSON.stringify(result, null, 2);
        },

        btn_transformWorkData_click() {
            var result = syn.$p.transformWorkData($print.prop.demoFormData, ['ProductName', 'Qty']);
            syn.$l.get('txt_transformWorkData').value = JSON.stringify(result);
        },

        btn_transformFormData_click() {
            var result = syn.$p.transformFormData($print.prop.demoFormData, 1, 5, 'ProductName,Qty:0');
            syn.$l.get('txt_transformFormData').value = JSON.stringify(result, null, 2);
        },

        btn_splitDataChunks_click() {
            var result = syn.$p.splitDataChunks([1, 2, 3, 4, 5, 6, 7], 2, 3);
            syn.$l.get('txt_splitDataChunks').value = JSON.stringify(result);
        }
    }
};
