'use strict';
let $features = {
    prop: {
        dataSet: [
            { id: '1', name: '김민준', department: '개발팀', salary: 5200, hireDate: '2019-03-04' },
            { id: '2', name: '이서연', department: '영업팀', salary: 4800, hireDate: '2020-07-13' },
            { id: '3', name: '박지후', department: '개발팀', salary: 6100, hireDate: '2017-11-20' },
            { id: '4', name: '최하윤', department: '디자인팀', salary: 4500, hireDate: '2021-02-01' },
            { id: '5', name: '정도윤', department: '인사팀', salary: 5000, hireDate: '2018-09-17' },
            { id: '6', name: '강서아', department: '개발팀', salary: 5700, hireDate: '2019-12-02' },
            { id: '7', name: '조은우', department: '영업팀', salary: 4300, hireDate: '2022-05-23' },
            { id: '8', name: '윤지안', department: '디자인팀', salary: 4900, hireDate: '2020-01-06' },
            { id: '9', name: '장예준', department: '개발팀', salary: 6500, hireDate: '2016-04-11' },
            { id: '10', name: '임수아', department: '인사팀', salary: 4700, hireDate: '2021-10-18' },
            { id: '11', name: '한도현', department: '영업팀', salary: 5300, hireDate: '2018-06-25' },
            { id: '12', name: '오세린', department: '디자인팀', salary: 5100, hireDate: '2019-08-19' }
        ]
    },

    method: {
        show(title, data) {
            let text = typeof data == 'string' ? data : JSON.stringify(data, null, 2);
            syn.$l.get('preLog').textContent = text;
            syn.$l.eventLog(title, text.length > 140 ? text.slice(0, 140) + '...' : text);
        },

        load() {
            syn.uicontrols.$list.setValue('lstMain', $this.prop.dataSet.map((row) => { return Object.assign({}, row); }));
            syn.uicontrols.$list.setValue('lstCheck', $this.prop.dataSet.map((row) => { return Object.assign({}, row); }));
        }
    },

    hook: {
        pageComplete() {
            $this.method.load();
        }
    },

    event: {
        // 행을 선택하면 선택된 행들의 DataTables API 객체가 전달된다(toArray() 로 배열 변환).
        lstMain_select(data, e, dt, type, indexes) {
            syn.$l.eventLog('lstMain_select', JSON.stringify(data.toArray()));
        },

        lstMain_deselect(e, dt, type, indexes) {
            syn.$l.eventLog('lstMain_deselect', '선택 해제');
        },

        lstMain_dblclick(row, data) {
            syn.$l.eventLog('lstMain_dblclick', JSON.stringify(data));
        },

        btnLoad_click() {
            $this.method.load();
        },

        btnGetValue_click() {
            $this.method.show('btnGetValue_click', syn.uicontrols.$list.getValue('lstMain'));
        },

        btnClear_click() {
            syn.uicontrols.$list.clear('lstMain');
            syn.uicontrols.$list.clear('lstCheck');
        },

        // 합계는 getValue 로 받은 전체 행에서 페이지 코드가 직접 계산한다.
        btnSum_click() {
            let total = syn.uicontrols.$list.getValue('lstMain').reduce((sum, row) => { return sum + Number(row.salary); }, 0);
            $this.method.show('btnSum_click', '연봉 합계: ' + total.toLocaleString() + '만원');
        },

        btnSetCell_click() {
            let row = 0;
            let col = syn.uicontrols.$list.propToCol('lstMain', 'salary');
            let current = Number(syn.uicontrols.$list.getValue('lstMain')[row].salary);
            syn.uicontrols.$list.setCellData('lstMain', row, 'salary', current + 500);
            $this.method.show('btnSetCell_click', `첫 행 연봉: ${current} -> ${current + 500} (컬럼 인덱스 ${col})`);
        },

        btnPropToCol_click() {
            $this.method.show('btnPropToCol_click', `salary 컬럼 인덱스: ${syn.uicontrols.$list.propToCol('lstMain', 'salary')}, 없는 컬럼: ${syn.uicontrols.$list.propToCol('lstMain', 'nothing')}`);
        },

        // checkbox: true 일 때 선택된 행의 첫 번째(체크박스) 컬럼 값 목록을 가져온다.
        btnChecked_click() {
            let ids = syn.uicontrols.$list.getControl('lstCheck').table.column(0).checkboxes.selected().toArray();
            $this.method.show('btnChecked_click', ids.length == 0 ? '(선택된 행 없음)' : '선택된 ID: ' + ids.join(', '));
        },

        btnDtSearch_click() {
            syn.uicontrols.$list.getControl('lstMain').table.column(2).search('개발').draw();
        },

        btnDtPage_click() {
            syn.uicontrols.$list.getControl('lstMain').table.page('next').draw('page');
        }
    }
}
