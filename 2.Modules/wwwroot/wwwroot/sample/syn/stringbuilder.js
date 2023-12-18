$w.initializeScript({
    btnAppend_click() {
        syn.$sb.append('Hello World, ');
    },
    btnAppendFormat_click() {
        syn.$sb.appendFormat('Hello {0}!!! {1}', 'World', 'Bye');
    },
    btnConvertToArray_click() {
        syn.$l.get('txtConvertToArray').value = syn.$sb.convertToArray('Apple');
    },
    btnClear_click() {
        syn.$sb.clear();
    },
    btnToString_click() {
        syn.$l.get('txtToString').value = syn.$sb.toString();
    }
})
