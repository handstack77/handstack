'use strict';

whenGridReady('grdFindSearch', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdFindSearch';

    $opengrid.setValue(id, sampleMembers(30));
    on(id + '_term', 'keyup', function (e) { $opengrid.search(id, 'MemberName', e.target.value); });
    on(id + '_clear', 'click', function () { byId(id + '_term').value = ''; $opengrid.search(id, 'MemberName', ''); });
});
