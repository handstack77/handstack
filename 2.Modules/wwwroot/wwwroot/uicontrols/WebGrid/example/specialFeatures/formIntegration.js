'use strict';

whenGridReady('grdFormIntegration', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdFormIntegration';

    $opengrid.setValue(id, sampleMembers(15));
    byId(id).addEventListener('click', function () {
        var item = $opengrid.getSelectedItem(id);
        if (item) {
            byId(id + '_name').value = item.MemberName || '';
            byId(id + '_email').value = item.Email || '';
        }
    });
    on(id + '_save', 'click', function () {
        var idx = $opengrid.getSelectedIndex(id);
        if (idx == null || idx < 0) {
            log('폼 연동: 선택된 행이 없습니다');
            return;
        }
        $opengrid.setCellValue(id, idx, 'MemberName', byId(id + '_name').value);
        $opengrid.setCellValue(id, idx, 'Email', byId(id + '_email').value);
        log('폼 → 그리드 저장 완료');
    });
});
