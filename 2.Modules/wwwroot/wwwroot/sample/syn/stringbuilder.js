// [사용 중단 안내] syn.$sb(StringBuilder)는 현재 syn.js에 구현되어 있지 않습니다.
// 아래 핸들러는 예외 없이 안내 메시지만 표시하도록 처리되어 있으며, 문자열 조합이 필요하면
// $string.interpolate() 등 extension_string.html 예제를 참고하세요.
const stringbuilderDeprecatedNotice = 'syn.$sb는 더 이상 지원되지 않습니다. $string.interpolate() 등을 사용하세요.';

$w.initializeScript({
    btnAppend_click() {
        alert(stringbuilderDeprecatedNotice);
    },
    btnAppendFormat_click() {
        alert(stringbuilderDeprecatedNotice);
    },
    btnConvertToArray_click() {
        syn.$l.get('txtConvertToArray').value = stringbuilderDeprecatedNotice;
    },
    btnClear_click() {
        alert(stringbuilderDeprecatedNotice);
    },
    btnToString_click() {
        syn.$l.get('txtToString').value = stringbuilderDeprecatedNotice;
    }
})
