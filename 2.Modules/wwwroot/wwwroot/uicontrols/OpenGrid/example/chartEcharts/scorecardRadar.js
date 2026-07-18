'use strict';

(function () {
    var r = sampleRadarScore();
    initChart('grdScorecardRadar', { tooltip: {}, radar: { indicator: r.indicator }, series: [{ type: 'radar', data: [{ value: r.values, name: '점수' }] }] });
})();
