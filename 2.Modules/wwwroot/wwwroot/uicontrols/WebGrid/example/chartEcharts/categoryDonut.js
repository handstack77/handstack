'use strict';

initChart('grdCategoryDonut', {
    tooltip: { trigger: 'item' }, legend: { bottom: 0 },
    series: [{ type: 'pie', radius: ['40%', '70%'], data: sampleCategoryShare() }]
});
