'use strict';

initChart('grdParallelMulti', {
    parallelAxis: [{ dim: 0, name: '속도' }, { dim: 1, name: '정확도' }, { dim: 2, name: '가격' }, { dim: 3, name: '등급' }],
    parallel: { left: '8%', right: '10%' },
    series: [{ type: 'parallel', lineStyle: { width: 1 }, data: sampleParallelData(25) }]
});
