'use strict';

whenGridReady('grdGrouping', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdGrouping';

    $opengrid.setValue(id, sampleMembers(30));
    on(id + '_group', 'click', function () { $opengrid.groupBy(id, ['Department']); });
    on(id + '_ungroup', 'click', function () { $opengrid.clearGroup(id); });
    on(id + '_expand', 'click', function () { $opengrid.expandAllGroups(id); });
    on(id + '_collapse', 'click', function () { $opengrid.collapseAllGroups(id); });
});
