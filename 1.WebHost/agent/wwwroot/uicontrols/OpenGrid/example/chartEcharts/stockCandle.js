'use strict';

(function () {
    var s = sampleStocks(40);
    initChart('grdStockCandle', {
        tooltip: { trigger: 'axis' },
        grid: [{ left: 50, right: 20, height: '55%' }, { left: 50, right: 20, top: '68%', height: '20%' }],
        xAxis: [
            { type: 'category', data: s.map(function (d) { return d.date; }), boundaryGap: true },
            { type: 'category', gridIndex: 1, data: s.map(function (d) { return d.date; }), boundaryGap: true, axisLabel: { show: false } }
        ],
        yAxis: [{ scale: true }, { gridIndex: 1 }],
        series: [
            { type: 'candlestick', data: s.map(function (d) { return [d.open, d.close, d.low, d.high]; }) },
            { type: 'bar', xAxisIndex: 1, yAxisIndex: 1, data: s.map(function (d) { return d.volume; }), itemStyle: { color: '#94a3b8' } }
        ]
    });
})();
