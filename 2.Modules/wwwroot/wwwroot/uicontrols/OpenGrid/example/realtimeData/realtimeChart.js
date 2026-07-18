'use strict';

(function () {
    var id = 'grdRealtimeChart';
    var xs = [], ys = [];
    for (var i = 0; i < 20; i++) { xs.push(i); ys.push(500 + Math.round(Math.random() * 200)); }
    var chart = initChart(id, {
        title: { text: '실시간 지표' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: xs },
        yAxis: { type: 'value' },
        series: [{ type: 'line', data: ys, smooth: true, areaStyle: {} }]
    });
    var timer = null;
    var tick = xs.length;
    on(id + '_toggle', 'click', function () {
        if (timer) {
            clearInterval(timer); timer = null; log('실시간 차트 중지');
            return;
        }
        timer = setInterval(function () {
            if (!chart) { return; }
            xs.push(tick++);
            ys.push(500 + Math.round(Math.random() * 200));
            if (xs.length > 30) { xs.shift(); ys.shift(); }
            chart.setOption({ xAxis: { data: xs }, series: [{ data: ys }] });
        }, 1000);
        log('실시간 차트 시작');
    });
})();
