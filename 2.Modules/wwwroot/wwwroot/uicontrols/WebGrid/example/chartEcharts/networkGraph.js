'use strict';

(function () {
    var g = sampleNetworkGraph();
    initChart('grdNetworkGraph', {
        tooltip: {}, legend: [{ data: g.categories.map(function (c) { return c.name; }) }],
        series: [{ type: 'graph', layout: 'force', roam: true, categories: g.categories, data: g.nodes, links: g.links, force: { repulsion: 120 }, label: { show: true } }]
    });
})();
