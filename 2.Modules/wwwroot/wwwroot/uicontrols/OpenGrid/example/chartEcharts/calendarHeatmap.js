'use strict';

(function () {
    var data = sampleCalendarData(2026);
    initChart('grdCalendarHeatmap', {
        tooltip: {},
        visualMap: { min: 0, max: 8, calculable: true, orient: 'horizontal', bottom: 0 },
        calendar: { range: '2026', cellSize: ['auto', 14] },
        series: [{ type: 'heatmap', coordinateSystem: 'calendar', data: data }]
    });
})();
