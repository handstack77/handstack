# syn.$r (request) 사용법

`$request` 모듈(별칭 `syn.$r`)은 queryString 조회/생성, url 변환, http 요청(fetch/XHR), Cookie 조작 기능을 제공합니다.

이 모듈의 예제는 두 개의 페이지로 나뉘어 있으며, 이 문서는 두 예제를 함께 다룹니다.

- `request.html`/`request.js` — `$w.initializeScript({ ... })` 형태로 이벤트 핸들러를 등록하는 레거시 방식 예제입니다. 페이지 전체를 하나의 플랫 객체로 등록하며, `hook`/`event`/`method` 같은 구획 없이 `{요소ID}_{이벤트명}` 형태의 함수명을 그대로 키로 사용합니다. `query`/`url`/`toQueryString`/`toUrlObject`/Cookie 조작 등 기본 기능만 다룹니다.
- `requests.html`/`requests.js` — `let $requests = { extends, hook, method, event }` 형태의 객체로 이벤트 핸들러를 등록하는 현행 방식 예제입니다. `hook.pageLoad()`에서 초기값을 세팅하고, `event` 구획 아래에 `{요소ID}_{이벤트명}` 형태의 함수를 선언합니다. `resolveUrl`, `addQueryParam`/`removeQueryParam`/`setQueryParam`, `isCorsEnabled`, `httpFetch`/`httpRequest`/`httpSubmit`/`httpDataSubmit`를 포함한 `$request`의 전체 공개 API를 다룹니다.

## 개요

- 모듈: `$request` (별칭 `syn.$r`)
- 파일: `request.html`/`request.js` (레거시 등록 방식), `requests.html`/`requests.js` (현행 등록 방식)
- 범위: queryString 조회/생성, url 변환, queryString 파라미터 추가/제거/설정, CORS 확인, `httpFetch`/`httpRequest`/`httpSubmit`/`httpDataSubmit`를 통한 http 요청, Cookie 조작까지 `$request`의 전체 공개 API

## 사용법 - 레거시 방식 (request.js)

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

### 화면 구성 (request.html)

| 항목 | 설명 |
| --- | --- |
| `$request.query` | `syn.$r.params`에 값을 채운 뒤 `query('p2')`로 조회합니다. |
| `$request.url` | `syn.$r.params`의 값으로 queryString이 포함된 url을 생성합니다. |
| `$request.toQueryString` | 간단한 json 값을 queryString 문자열로 변환합니다(`isQuestion=true`로 `?` 접두 포함). |
| `$request.toUrlObject` | 현재 페이지 url의 queryString을 객체로 변환합니다. |
| `$request.setCookie` | `'txtSetCookie'`라는 이름으로 쿠키 값을 설정합니다. |
| `$request.getCookie` | 설정된 쿠키 값을 조회합니다. |
| `$request.deleteCookie` | 설정된 쿠키 값을 삭제합니다. |

## 사용법 - 현행 방식 (requests.js)

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

### 화면 구성 (requests.html)

#### 속성

| 항목 | 설명 |
| --- | --- |
| `syn.$r.params` | 현재까지 조회된 queryString 값을 담고 있는 객체입니다. |
| `syn.$r.path` | 현재 페이지의 `location.pathname` 값입니다. |

#### 메서드

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
| `httpRequest(method, url, data, callback, options)` | XMLHttpRequest 기반으로 http 요청을 수행합니다. |
| `httpSubmit(url, formID, method)` | 지정한 form을 method, url 값으로 설정 후 submit()합니다. |
| `httpDataSubmit(formData, url, callback, options)` | FormData 객체를 XMLHttpRequest로 POST 전송합니다. |
| `getCookie(id)` | 현재 웹 사이트의 쿠키 데이터를 조회합니다. |
| `setCookie(id, val, expires, path, domain, secure)` | 현재 웹 사이트에 쿠키 데이터를 설정합니다. |
| `deleteCookie(id, path, domain)` | 현재 웹 사이트의 쿠키 데이터를 삭제합니다. |

## 주의 사항

> 과거 버전에서는 `requests.html` 상단 "속성" 카드에 `syn.$r.version` 항목이 있었으나, `$request` 모듈에는
> `version` 속성이 존재하지 않고(참조 코드도 `$request`가 아닌 `$keyboard`(`syn.$k`)의 값을 잘못 참조하고
> 있었음) 정리 과정에서 제거하고 실제로 존재하는 `syn.$r.path` 속성으로 대체했습니다.

## 관련 모듈

API 상세 목록은 [`request_api.md`](./request_api.md)를 참고하세요.
