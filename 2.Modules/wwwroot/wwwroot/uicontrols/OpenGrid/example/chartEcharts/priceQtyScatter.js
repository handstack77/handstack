'use strict';

(function () {
    var points = samplePriceQty(60);
    var n = points.length, sx = 0, sy = 0, sxy = 0, sxx = 0;
    points.forEach(function (p) { sx += p[0]; sy += p[1]; sxy += p[0] * p[1]; sxx += p[0] * p[0]; });
    var slope = (n * sxy - sx * sy) / (n * sxx - sx * sx || 1);
    var intercept = (sy - slope * sx) / n;
    var xs = points.map(function (p) { return p[0]; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    initChart('grdPriceQtyScatter', {
        tooltip: { trigger: 'item' },
        xAxis: { type: 'value', name: '단가' }, yAxis: { type: 'value', name: '물량' },
        series: [
            { type: 'scatter', data: points, symbolSize: 8 },
            { type: 'line', data: [[minX, slope * minX + intercept], [maxX, slope * maxX + intercept]], showSymbol: false, lineStyle: { color: '#dc2626', type: 'dashed' } }
        ]
    });
})();
