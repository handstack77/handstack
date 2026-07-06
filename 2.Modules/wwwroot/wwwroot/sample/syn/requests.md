# syn.$r (request) 사용법 - 현행 예제

`$request` 모듈(별칭 `syn.$r`)은 http 요청(fetch/XHR), URL/queryString 조작, Cookie 조작 기능을 제공합니다.

이 페이지(`requests.html`/`requests.js`)는 `let $requests = { extends, hook, method, event }` 형태의
객체로 이벤트 핸들러를 등록하는 현행 방식 예제입니다. `hook.pageLoad()`에서 초기값을 세팅하고,
`event` 구획 아래에 `{요소ID}_{이벤트명}` 형태의 함수를 선언합니다.

## 개요

- 모듈: `$request` (별칭 `syn.$r`)
- 파일: `requests.html`, `requests.js`
- 등록 방식: `let $requests = { extends: ['parsehtml'], hook, method, event }` (현행)
- 범위: queryString 조회/생성, url 변환, queryString 파라미터 추가/제거/설정, CORS 확인, `httpFetch`/`httpRequest`/`httpSubmit`/`httpDataSubmit`를 통한 http 요청, Cookie 조작까지 `$request`의 전체 공개 API를 다룹니다.

## 사용법

```js
'use strict';
let $requests = {
    extends: ['parsehtml'],

    hook: {
        pageLoad() {
            syn.$l.get('txt_params').value = JSON.stringify(syn.$r.params);
            syn.$l.get('txt_path').value = syn.$r.path;
        }
    },

    event: {
        btn_query_click() {
            syn.$l.get('txt_query').value = syn.$r.query('param1');
        },
        async btn_httpFetch_click() {
            const result = await syn.$r.httpFetch('sample.json').send();
            syn.$l.get('txt_httpFetch').value = JSON.stringify(result);
        },
    }
};
```

페이지 로드 시 `hook.pageLoad()`가 `syn.$r.params`, `syn.$r.path` 값을 화면에 출력하고,
각 카드의 입력란/버튼을 조작하면 `event` 구획의 핸들러가 해당 `$request` 메서드를 호출합니다.

## 화면 구성

### 속성

| 항목 | 설명 |
| --- | --- |
| `syn.$r.params` | 현재까지 조회된 queryString 값을 담고 있는 객체입니다. |
| `syn.$r.path` | 현재 페이지의 `location.pathname` 값입니다. |

### 메서드

| 항목 | 설명 |
| --- | --- |
| `query(param, url)` | url(생략 시 현재 페이지)에서 queryString 파라미터 값을 조회합니다. |
| `url()` | `syn.$r.params` 값으로 현재 경로에 대한 queryString url을 생성합니다. |
| `toQueryString(jsonObject, isQuestion)` | json 객체를 queryString 문자열로 변환합니다. |
| `toUrlObject(url)` | url(생략 시 현재 페이지)의 queryString을 json 객체로 변환합니다. |
| `resolveUrl(relativePath, baseUrl)` | 상대 경로를 절대 url로 변환합니다. |
| `addQueryParam(param, value, urlStr)` | url에 queryString 파라미터를 추가합니다. |
| `removeQueryParam(paramName, urlStr)` | url에서 queryString 파라미터를 제거합니다. |
| `setQueryParam(param, value, urlStr)` | url의 queryString 파라미터 값을 설정(대체)합니다. |
| `isCorsEnabled(url)` | 대상 url에 CORS로 접근 가능한지 `HEAD` 요청으로 확인합니다. |
| `httpFetch(url)` | fetch API 기반 http 요청 객체를 반환합니다(`.send(raw, options)` 호출). |
| `httpRequest(method, url, data, callback, options)` | XMLHttpRequest 기반 http 요청을 수행합니다. |
| `httpSubmit(url, formID, method)` | 지정한 form을 설정 후 전송(submit)합니다. |
| `httpDataSubmit(formData, url, callback, options)` | FormData를 XMLHttpRequest로 POST 전송합니다. |
| `getCookie(id)` | 쿠키 값을 조회합니다. |
| `setCookie(id, val, expires, path, domain, secure)` | 쿠키 값을 설정합니다. |
| `deleteCookie(id, path, domain)` | 쿠키 값을 삭제합니다. |

## 관련 모듈

이 페이지는 현행 등록 방식(`let $requests = { extends, hook, method, event }`)을 사용하는 예제이며,
`$request`의 공개 API 전체(queryString 조작, 파라미터 추가/제거, CORS 확인, http 요청/제출, Cookie)를
다룹니다. `$w.initializeScript({...})` 형태의 레거시 등록 방식으로 작성된, query/url/Cookie 위주의
더 단순한 예제는 [`request.md`](./request.md)를 참고하세요.

API 상세 목록은 [`requests_api.md`](./requests_api.md)를 참고하세요.

> 참고: 과거 버전에서는 이 화면 상단 "속성" 카드에 `syn.$r.version` 항목이 있었으나, `$request` 모듈에는
> `version` 속성이 존재하지 않고(참조 코드도 `$request`가 아닌 `$keyboard`(`syn.$k`)의 값을 잘못 참조하고
> 있었음) 이번 정리에서 제거하고 실제로 존재하는 `syn.$r.path` 속성으로 대체했습니다.
