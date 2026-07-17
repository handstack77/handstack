'use strict';

(function () {
    function box(node) {
        return '<div style="display:inline-flex; flex-direction:column; align-items:center; margin:0 10px; vertical-align:top;">' +
            '<div style="padding:8px 14px; border:1px solid #2563eb; border-radius:6px; background:#eff6ff; color:#1e3a8a; font-size:12px; white-space:nowrap;"><b>' + node.name + '</b><br/>' + node.title + '</div>' +
            (node.children && node.children.length ? '<div style="width:1px; height:14px; background:#9ca3af;"></div><div style="display:flex;">' + node.children.map(box).join('') + '</div>' : '') +
            '</div>';
    }
    var flat = sampleOrgTree(3);
    var byId2 = {};
    flat.forEach(function (n) { byId2[n.id] = Object.assign({}, n, { children: [] }); });
    var root = null;
    flat.forEach(function (n) {
        if (n.parentId == null) { root = byId2[n.id]; }
        else if (byId2[n.parentId]) { byId2[n.parentId].children.push(byId2[n.id]); }
    });
    byId('orgChartHost').innerHTML = '<div style="text-align:center; min-width:900px;">' + box(root) + '</div>';
})();
