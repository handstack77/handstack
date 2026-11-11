'use strict';

whenGridReady('grdSubtotal', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdSubtotal';

    $opengrid.setValue(id, sampleMembers(30));
    $opengrid.groupBy(id, ['Department']);
    on(id + '_footer', 'click', function () {
        $opengrid.setFooter(id, [{ field: 'Point', op: 'SUM' }]);
        log('Point 합계 Footer 적용');
    });
});
