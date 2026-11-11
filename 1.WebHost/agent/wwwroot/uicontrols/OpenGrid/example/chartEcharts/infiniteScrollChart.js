'use strict';

(function () {
    var id = 'grdInfiniteScrollChart';
    var data = sampleTimeSeries(20);
    var chart = initChart(id, {
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: data.map(function (d) { return d.date; }) },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: data.map(function (d) { return d.value; }) }]
    });
    on(id + '_more', 'click', function () {
        var more = sampleTimeSeries(10);
        data = more.concat(data);
        chart.setOption({ xAxis: { data: data.map(function (d) { return d.date; }) }, series: [{ data: data.map(function (d) { return d.value; }) }] });
        log('무한 스크롤: 과거 10건 추가 로드(총 ' + data.length + '건)');
    });
})();
