'use strict';

initChart('grdConversionFunnel', { tooltip: { trigger: 'item' }, series: [{ type: 'funnel', data: sampleFunnel(), label: { show: true, position: 'inside' } }] });
