'use strict';

var id = 'grdExtendedEvents';
window.$extendedEvents = { hook: { controlInit: function (cid, setting) { return setting; } }, event: {} };
window.$extendedEvents.event[id + '_sortChange'] = function (cid, field, dir) { log('sortChange: ' + field + ' ' + dir); };
window.$extendedEvents.event[id + '_filterChange'] = function (cid, field) { log('filterChange: ' + field); };
window.$extendedEvents.event[id + '_dataChange'] = function (cid, data) { log('dataChange: ' + (data ? data.length : 0) + '건'); };
syn.$w.pageScript = '$extendedEvents';
document.getElementById(id).setAttribute('syn-events', "['sortChange', 'filterChange', 'dataChange']");

whenGridReady(id, function () {
    var $opengrid = syn.uicontrols.$opengrid;
    $opengrid.setValue(id, sampleMembers(15));
});
