'use strict';

// echarts CDN 기본 번들에는 dataTool 확장(prepareBoxplotData)이 포함되지 않아,
// 5개 요약값(최소·Q1·중앙값·Q3·최대)을 직접 계산한다.
function quartile(sorted, q) {
    var pos = (sorted.length - 1) * q;
    var base = Math.floor(pos);
    var rest = pos - base;
    return sorted[base + 1] !== undefined ? sorted[base] + rest * (sorted[base + 1] - sorted[base]) : sorted[base];
}

(function () {
    var groups = sampleBoxplotData();
    var names = Object.keys(groups);
    var boxData = names.map(function (n) {
        var sorted = groups[n].slice().sort(function (a, b) { return a - b; });
        return [sorted[0], quartile(sorted, 0.25), quartile(sorted, 0.5), quartile(sorted, 0.75), sorted[sorted.length - 1]];
    });
    initChart('grdResponseBoxplot', {
        tooltip: { trigger: 'item' },
        xAxis: { type: 'category', data: names },
        yAxis: { type: 'value' },
        series: [{ type: 'boxplot', data: boxData }]
    });
})();
