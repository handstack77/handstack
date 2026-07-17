'use strict';

(function () {
    var f = sampleSankeyFlow();
    initChart('grdFlowSankey', { tooltip: { trigger: 'item' }, series: [{ type: 'sankey', data: f.nodes, links: f.links, emphasis: { focus: 'adjacency' } }] });
})();
