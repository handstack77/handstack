'use strict';

whenGridReady('grdPagination', function () {
    var $opengrid = syn.uicontrols.$opengrid;
    var id = 'grdPagination';

    var all = sampleProducts(97);
    var pageSize = 20;
    var page = 0;
    function renderPage() {
        var start = page * pageSize;
        $opengrid.setValue(id, all.slice(start, start + pageSize));
        log('페이지 ' + (page + 1) + ' / ' + Math.ceil(all.length / pageSize));
    }
    renderPage();
    on(id + '_prev', 'click', function () { if (page > 0) { page--; renderPage(); } });
    on(id + '_next', 'click', function () { if ((page + 1) * pageSize < all.length) { page++; renderPage(); } });
});
