# syn.$r (request) 사용법 - 레거시 예제

`$request` 모듈(별칭 `syn.$r`)은 queryString 조회/생성, url 변환, Cookie 조작 기능을 제공합니다.

이 페이지(`request.html`/`request.js`)는 `$w.initializeScript({...})` 형태로 이벤트 핸들러를 등록하는
레거시 방식 예제입니다. 페이지 전체를 하나의 플랫 객체로 등록하며, `hook`/`event`/`method` 같은 구획 없이
`{요소ID}_{이벤트명}` 형태의 함수명을 그대로 키로 사용합니다.

## 개요

- 모듈: `$request` (별칭 `syn.$r`)
- 파일: `request.html`, `request.js`
- 등록 방식: `$w.initializeScript({ ... })` (레거시)
- 범위: queryString 조회(`query`, `url`), 문자열/객체 변환(`toQueryString`, `toUrlObject`), Cookie 조작(`setCookie`, `getCookie`, `deleteCookie`) 위주의 기본 기능만 다룹니다.

## 사용법

`request.js`는 다음과 같이 요소ID와 이벤트명을 조합한 키로 핸들러를 등록합니다.

```js
$w.initializeScript({
    btnQuery_click() {
        syn.$r.params['p1'] = 'aaa';
        syn.$r.params['p2'] = 'bbb';
        syn.$r.params['p3'] = 'ccc';
        syn.$l.get('txtQuery').value = syn.$r.query('p2');
    },
    btnUrl_click() {
        syn.$l.get('txtUrl').value = syn.$r.url();
    },
    btnSetCookie_click() {
        syn.$r.setCookie('txtSetCookie', 'hello');
    },
})
```

`syn.$r.params`는 `$request` 모듈이 내부적으로 들고 있는 queryString 저장소이며, `query()`와 `url()`은
이 값을 읽고 씁니다. 화면에서 각 입력란과 버튼을 눌러 값을 채운 뒤 결과를 확인할 수 있습니다.

## 화면 구성

| 항목 | 설명 |
| --- | --- |
| `$request.query` | `syn.$r.params`에 값을 채운 뒤 `query('p2')`로 조회합니다. |
| `$request.url` | `syn.$r.params`의 값으로 queryString이 포함된 url을 생성합니다. |
| `$request.toQueryString` | 간단한 json 값을 queryString 문자열로 변환합니다(`isQuestion=true`로 `?` 접두 포함). |
| `$request.toUrlObject` | 현재 페이지 url의 queryString을 객체로 변환합니다. |
| `$request.setCookie` | `'txtSetCookie'`라는 이름으로 쿠키 값을 설정합니다. |
| `$request.getCookie` | 설정된 쿠키 값을 조회합니다. |
| `$request.deleteCookie` | 설정된 쿠키 값을 삭제합니다. |

## 관련 모듈

이 페이지는 레거시 등록 방식(`$w.initializeScript`)을 사용하는 예제입니다. `httpFetch`, `httpRequest`,
`httpSubmit`, `httpDataSubmit`, `resolveUrl`, `addQueryParam`/`removeQueryParam`/`setQueryParam`,
`isCorsEnabled` 등 현재(`let $requests = { extends, hook, event, method }`) 방식으로 등록하는
더 폭넓은 `$request` API 예제는 [`requests.md`](./requests.md)를 참고하세요.

API 상세 목록은 [`request_api.md`](./request_api.md)를 참고하세요.
