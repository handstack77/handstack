'use strict';

var id = 'grdBasicEvents';
window.$basicEvents = { hook: { controlInit: function (cid, setting) { return setting; } }, event: {} };
window.$basicEvents.event[id + '_rowClick'] = function (cid, rowIndex, item) { log('rowClick: rowIndex=' + rowIndex + ', name=' + (item && item.MemberName)); };
window.$basicEvents.event[id + '_selectionChange'] = function (cid, rowIndex, item) { log('selectionChange: rowIndex=' + rowIndex); };
window.$basicEvents.event[id + '_cellEditEnd'] = function (cid, rowIndex, field, oldValue, newValue) { log('cellEditEnd: ' + field + ' ' + oldValue + '→' + newValue); };
syn.$w.pageScript = '$basicEvents';
document.getElementById(id).setAttribute('syn-events', "['rowClick', 'selectionChange', 'cellEditEnd']");

whenGridReady(id, function () {
    var $opengrid = syn.uicontrols.$opengrid;
    $opengrid.setValue(id, sampleMembers(15));
});
