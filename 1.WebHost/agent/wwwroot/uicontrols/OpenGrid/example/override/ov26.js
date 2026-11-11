'use strict';

whenGridReady('grdOv26', function (grid) {
    var $opengrid = syn.uicontrols.$opengrid;
    $opengrid.setValue('grdOv26', sampleMembers(21));
    grid.override.strategy('summaryOp', function (op, nums) {
        if (op !== 'MEDIAN') { return null; }
        var sorted = nums.slice().sort(function (a, b) { return a - b; });
        var mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    });
    on('grdOv26_footer', 'click', function () { $opengrid.setFooter('grdOv26', [{ field: 'Point', op: 'MEDIAN' }]); log('OV-26: MEDIAN 집계 전략 등록 및 Footer 적용'); });
});
