$w.initializeScript({
    btnQuery_click() {
        syn.$r.params['p1'] = 'aaa';
        syn.$r.params['p2'] = 'bbb';
        syn.$r.params['p3'] = 'ccc';
        syn.$l.get('txtQuery').value = syn.$r.query('p2');
    },
    btnUrl_click() {
        syn.$r.params['p1'] = 'aaa';
        syn.$r.params['p2'] = 'bbb';
        syn.$r.params['p3'] = 'ccc';
        syn.$l.get('txtUrl').value = syn.$r.url();
    },
    btnToQueryString_click() {
        syn.$l.get('txtToQueryString').value = syn.$r.toQueryString({
            page: '1',
            size: '2kg'
        }, true);
    },
    btnToUrlObject_click() {
        syn.$l.get('txtToUrlObject').value = JSON.stringify(syn.$r.toUrlObject());
    },
    btnSetCookie_click() {
        syn.$r.setCookie('txtSetCookie', 'hello');
    },
    btnGetCookie_click() {
        syn.$l.get('txtGetCookie').value = syn.$r.getCookie('txtSetCookie');
    },
    btnDeleteCookie_click() {
        syn.$r.deleteCookie('txtSetCookie');
    },
})
