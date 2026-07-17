'use strict';

whenGridReady('grdXmlIntegration', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdXmlIntegration';
    var SAMPLE_XML = '<members>' +
        '<member><MemberNo>1</MemberNo><MemberName>홍길동</MemberName><Department>개발팀</Department></member>' +
        '<member><MemberNo>2</MemberNo><MemberName>김철수</MemberName><Department>영업팀</Department></member>' +
        '</members>';

    on(id + '_import', 'click', function () {
        var doc = new DOMParser().parseFromString(SAMPLE_XML, 'text/xml');
        var items = Array.prototype.slice.call(doc.getElementsByTagName('member')).map(function (el) {
            return {
                MemberNo: Number(el.getElementsByTagName('MemberNo')[0].textContent),
                MemberName: el.getElementsByTagName('MemberName')[0].textContent,
                Department: el.getElementsByTagName('Department')[0].textContent
            };
        });
        $opengrid.setValue(id, items);
        byId(id + '_out').textContent = SAMPLE_XML;
        log('XML ' + items.length + '건 가져오기 완료');
    });
    on(id + '_export', 'click', function () {
        var rows = $opengrid.getGridData(id);
        var xml = '<members>' + rows.map(function (r) {
            return '<member><MemberNo>' + r.MemberNo + '</MemberNo><MemberName>' + r.MemberName + '</MemberName><Department>' + r.Department + '</Department></member>';
        }).join('') + '</members>';
        byId(id + '_out').textContent = xml;
        log('그리드 → XML 내보내기 완료');
    });
});
