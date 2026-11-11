'use strict';
let $navermapselection = {
    hook: {
        pageLoad() {
            syn.uicontrols.$navermap.setValue('mapSelection', [{
                ID: 'S1',
                latitude: 37.5665,
                longitude: 126.9780,
                name: '서울'
            },
            {
                ID: 'S2',
                latitude: 36.3504,
                longitude: 127.3845,
                name: '대전'
            },
            {
                ID: 'S3',
                latitude: 35.1796,
                longitude: 129.0756,
                name: '부산'
            },
            {
                ID: 'S4',
                latitude: 35.1595,
                longitude: 126.8526,
                name: '광주'
            }]);
        }
    },
    event: {
        mapSelection_selectionChange(elID, detail, selection) {
            $this.method.print({
                detail,
                selection
            });
        },
        mapSelection_error(elID, error) {
            $this.method.print(error);
        },
        btnSelect_click() {
            syn.uicontrols.$navermap.setSelection('mapSelection', ['S1',
                'S3'
            ]);
        },
        btnClear_click() {
            syn.uicontrols.$navermap.clearSelection('mapSelection');
        },
        btnRow_click() {
            $this.method.print(syn.uicontrols.$navermap.getValue('mapSelection', 'Row'));
        },
        btnList_click() {
            $this.method.print(syn.uicontrols.$navermap.getValue('mapSelection', 'List'));
        }
    },
    method: {
        print(value) {
            syn.$l.get('preResult').textContent = JSON.stringify(value, null, 2);
        }
    }
};
