'use strict';

whenGridReady('grdMasterDetailIndent_detail', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var detailID = 'grdMasterDetailIndent_detail';
    var regions = sampleRegionSales();
    var chart = initChart('grdMasterDetailIndent', {
        tooltip: {}, xAxis: { type: 'category', data: regions.map(function (r) { return r.name; }) }, yAxis: { type: 'value' },
        series: [{ type: 'bar', data: regions.map(function (r) { return r.value; }) }]
    });

    function showDetail(regionName, total) {
        var shares = [0.5, 0.3, 0.2];
        var labels = ['오프라인', '온라인', '제휴'];
        var rows = [{ Label: regionName, Amount: total }];
        labels.forEach(function (l, i) { rows.push({ Label: '　- ' + l, Amount: Math.round(total * shares[i]) }); });
        $opengrid.setValue(detailID, rows);
    }
    if (chart) {
        chart.on('click', function (p) { showDetail(p.name, p.value); });
    }
    showDetail(regions[0].name, regions[0].value);
});
