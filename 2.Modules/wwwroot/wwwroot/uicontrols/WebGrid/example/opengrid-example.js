'use strict';

(function (window) {
    var $opengrid = syn.uicontrols.$opengrid;
    var elID = 'grdMember';

    function log(message) {
        var el = document.getElementById('divLog');
        el.textContent = '[' + new Date().toLocaleTimeString() + '] ' + message + '\n' + el.textContent;
    }

    function sampleData(count) {
        var roles = [
            { CodeID: 'Admin', CodeValue: '관리자' },
            { CodeID: 'Manager', CodeValue: '매니저' },
            { CodeID: 'Member', CodeValue: '회원' }
        ];
        var departments = ['D001', 'D002', 'D003'];
        var result = [];
        for (var i = 1; i <= count; i++) {
            var role = roles[i % roles.length];
            result.push({
                MemberNo: i,
                MemberName: '사용자 ' + i,
                Email: 'user' + i + '@handstack.kr',
                RoleID: role.CodeID,
                RoleName: role.CodeValue,
                DepartmentID: departments[i % departments.length],
                DepartmentName: '',
                Point: Math.floor(Math.random() * 10000),
                UseYN: i % 4 !== 0 ? '1' : '0',
                CreatedAt: '2026-0' + ((i % 6) + 1) + '-1' + (i % 9)
            });
        }
        return result;
    }

    // 화면 페이지 스크립트 모듈 (HandStack 화면의 $this 역할)
    window.$openGridExample = {
        config: {
            dataSource: {
                ROLE: {
                    CodeColumnID: 'CodeID',
                    ValueColumnID: 'CodeValue',
                    DataSource: [
                        { CodeID: 'Admin', CodeValue: '관리자' },
                        { CodeID: 'Manager', CodeValue: '매니저' },
                        { CodeID: 'Member', CodeValue: '회원' }
                    ]
                }
            }
        },
        hook: {
            controlInit: function (controlID, setting) {
                log('controlInit: ' + controlID);
                return setting;
            }
        },
        event: {
            grdMember_rowClick: function (controlID, rowIndex, item, field) {
                log('rowClick: rowIndex=' + rowIndex + ', field=' + field + ', MemberName=' + item.MemberName);
            },
            grdMember_selectionChange: function (controlID, rowIndex, item) {
                log('selectionChange: rowIndex=' + rowIndex + (item ? ', MemberNo=' + item.MemberNo : ''));
            },
            grdMember_cellEditEnd: function (controlID, rowIndex, field, oldValue, newValue, item) {
                log('cellEditEnd: [' + field + '] "' + oldValue + '" → "' + newValue + '", Flag=' + item.Flag);
            },
            grdMember_codeButtonClick: function (controlID, rowIndex, columnIndex, dataField, item) {
                log('codeButtonClick: rowIndex=' + rowIndex + ', field=' + dataField + ', value=' + item[dataField]);
                return {
                    dataSourceID: 'Department',
                    storeSourceID: 'DEPARTMENT',
                    codeColumnID: 'DepartmentID',
                    textColumnID: 'DepartmentName',
                    controlText: '부서'
                };
            },
            grdMember_codeChange: function (controlID, rowIndex, columnIndex, dataField, result) {
                log('codeChange: rowIndex=' + rowIndex + ', field=' + dataField + ', result=' + JSON.stringify(result || []));
            }
        }
    };
    syn.$w.pageScript = '$openGridExample';

    // columns 축약 정의: [columnID, columnText, width, isHidden, columnType, readOnly, alignConstants, belongID, options]
    $opengrid.controlLoad(elID, {
        height: '420px',
        editable: true,
        columns: [
            ['MemberNo', '번호', 70, false, 'number', true, 'center'],
            ['MemberName', '이름', 140, false, 'text', false],
            ['Email', '이메일', null, false, 'text', false],
            ['RoleID', '역할', 120, false, 'dropdown', false, 'center', null, { storeSourceID: 'ROLE', nameColumnID: 'RoleName' }],
            ['RoleName', '역할명', 120, false, 'text', true],
            ['DepartmentID', '부서', 120, false, 'codehelp', false, 'center', null, { dataSourceID: 'Department', storeSourceID: 'DEPARTMENT', textColumnID: 'DepartmentName', controlText: '부서' }],
            ['DepartmentName', '부서명', 140, false, 'text', true],
            ['Point', '포인트', 100, false, 'number', false],
            ['UseYN', '사용', 70, false, 'checkbox', false, 'center', null, { checkValue: '1', unCheckValue: '0' }],
            ['CreatedAt', '등록일', 110, false, 'text', true, 'center']
        ]
    });

    syn.$l.get('btnLoad').addEventListener('click', function () {
        $opengrid.setValue(elID, sampleData(1000));
        log('setValue: 1,000건 조회 완료');
    });

    syn.$l.get('btnInsert').addEventListener('click', function () {
        var item = $opengrid.insertRow(elID, {
            MemberNo: $opengrid.countRows(elID) + 1,
            MemberName: '신규 사용자',
            Email: '',
            RoleID: 'Member',
            RoleName: '회원',
            DepartmentID: '',
            DepartmentName: '',
            Point: 0,
            UseYN: '1',
            CreatedAt: new Date().toISOString().substring(0, 10)
        });
        log('insertRow: id=' + item.id + ', Flag=' + item.Flag);
    });

    syn.$l.get('btnRemove').addEventListener('click', function () {
        var item = $opengrid.removeRow(elID);
        log(item ? 'removeRow: MemberNo=' + item.MemberNo : 'removeRow: 선택된 행 없음');
    });

    syn.$l.get('btnUpdateItems').addEventListener('click', function () {
        var items = $opengrid.getUpdateItems(elID);
        log('변경 데이터 ' + items.length + '건\n' + JSON.stringify(items.map(function (item) {
            return { Flag: item.Flag, MemberNo: item.MemberNo, MemberName: item.MemberName };
        }), null, 2));
    });

    syn.$l.get('btnExport').addEventListener('click', function () {
        $opengrid.exportFile(elID, { fileName: 'member.csv' });
    });

    syn.$l.get('btnClearFilter').addEventListener('click', function () {
        $opengrid.clearFilter(elID);
        document.getElementById('txtSearch').value = '';
        log('필터 초기화');
    });

    syn.$l.get('txtSearch').addEventListener('keyup', function (e) {
        $opengrid.searchAll(elID, e.target.value);
    });

    $opengrid.setValue(elID, sampleData(100));
    log('초기 데이터 100건 조회 완료');
})(window);
