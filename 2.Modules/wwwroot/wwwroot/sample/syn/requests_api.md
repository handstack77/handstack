# $request (syn.$r) API 참조

> 이 문서는 [`request_api.md`](./request_api.md)와 동일한 `$request` 모듈을 다루는 독립된 참조
> 문서입니다. `requests.html`/`requests.js` 예제(현행 등록 방식)와 짝을 이루며, 그 자체로 완결된
> API 목록을 제공합니다.

## 모듈 정보

- 이름: `$request`
- 별칭: `syn.$r`
- 위치: `2.Modules/wwwroot/wwwroot/js/syn.js` (약 5556~6054번째 줄)
- 설명: URL/queryString 조작, http 요청(fetch/XHR), Cookie 조작 기능을 제공하는 모듈입니다.
- 등록 예제: `requests.js`는 `let $requests = { extends: ['parsehtml'], hook, method, event }` 형태의
  현행 방식으로 이 모듈의 API를 시연합니다.

## 속성

| 속성 | 타입 | 설명 |
| --- | --- | --- |
| `params` | `object` | 조회된 queryString 값을 담는 객체(`query()` 호출 시 채워짐, 초기값 `{}`) |
| `path` | `string` | 현재 페이지의 `location.pathname` 값 (Node 환경에서는 빈 문자열) |
| `createBlobUrl` | `function` | `URL.createObjectURL` 바인딩 함수 |
| `revokeBlobUrl` | `function` | `URL.revokeObjectURL` 바인딩 함수 |

## 메서드

| 메서드 | 반환 | 설명 |
| --- | --- | --- |
| `query(param, url)` | `string \| undefined` | url의 queryString에서 `param` 값을 조회 |
| `url()` | `string` | `params` 값으로 현재 경로의 queryString url 생성 |
| `toQueryString(jsonObject, isQuestion)` | `string` | json 객체를 queryString 문자열로 변환 |
| `toUrlObject(url)` | `object` | url의 queryString을 json 객체로 변환 |
| `resolveUrl(relativePath, baseUrl)` | `string` | 상대 경로를 절대 url로 변환 |
| `addQueryParam(param, value, urlStr)` | `string` | queryString 파라미터 추가 |
| `removeQueryParam(paramName, urlStr)` | `string` | queryString 파라미터 제거 |
| `setQueryParam(param, value, urlStr)` | `string` | queryString 파라미터 설정(대체) |
| `isCorsEnabled(url)` | `Promise<boolean>` | 대상 url의 CORS 접근 가능 여부 확인 |
| `httpFetch(url)` | `Proxy` (`.send()`) | fetch 기반 http 요청 |
| `httpRequest(method, url, data, callback, options)` | `Promise \| void` | XHR 기반 http 요청 |
| `httpSubmit(url, formID, method)` | `boolean \| void` | form 설정 후 submit |
| `httpDataSubmit(formData, url, callback, options)` | `Promise \| void` | FormData POST 전송 |
| `getCookie(id)` | `string \| undefined` | 쿠키 값 조회 |
| `setCookie(id, val, expires, path, domain, secure)` | `$request` | 쿠키 값 설정(체이닝 가능) |
| `deleteCookie(id, path, domain)` | `$request` | 쿠키 값 삭제(체이닝 가능) |

## 상세 설명

### query(param, url)

url(생략 시 `location.href`)의 queryString을 파싱해 `syn.$r.params`를 채우고, `param` 키의 값을
반환합니다. `%XX` 인코딩 문자가 포함된 값은 자동으로 `decodeURIComponent`로 복원합니다.

```js
syn.$r.query('page');
syn.$r.query('page', '/list.html?page=2&size=10');
```

### url()

`syn.$r.path`와 `syn.$r.params`를 조합해 queryString url을 생성합니다. `syn.Config.IsClientCaching`이
`false`이면 `noCache` 파라미터가 자동으로 붙습니다.

```js
syn.$r.params.page = '2';
syn.$r.url();
```

### toQueryString(jsonObject, isQuestion) / toUrlObject(url)

json 객체 ↔ queryString 문자열 상호 변환 메서드입니다. `toQueryString`의 `isQuestion=true`이면
`?`로 시작하는 문자열을 반환합니다.

```js
syn.$r.toQueryString({ page: '1' }, true);   // ?page=1
syn.$r.toUrlObject('/list.html?page=1');      // { page: '1' }
```

### resolveUrl(relativePath, baseUrl)

`URL` 생성자를 이용한 상대→절대 경로 변환입니다.

```js
syn.$r.resolveUrl('users', 'https://example.com/api/v1/groups');
// https://example.com/api/v1/users
```

### addQueryParam / removeQueryParam / setQueryParam

url의 queryString 파라미터를 각각 추가/제거/설정합니다. `param`(또는 `paramName`)에 객체나 배열을
넘기면 여러 항목을 한 번에 처리할 수 있습니다. 잘못된 인자 형식은 `syn.$l.eventLog`로 경고를 남깁니다.

```js
syn.$r.addQueryParam('page', '2', url);
syn.$r.removeQueryParam(['page', 'size'], url);
syn.$r.setQueryParam({ page: '3' }, undefined, url);
```

### isCorsEnabled(url)

`HEAD` 요청으로 대상 url이 CORS로 접근 가능한지 비동기 확인합니다.

```js
if (await syn.$r.isCorsEnabled('https://example.com/api')) { /* ... */ }
```

### httpFetch(url)

fetch 기반 요청 객체(Proxy)를 반환하며 `.send(raw, options)`만 지원합니다. 본문(`raw`)이 문자열이
아니고 존재하면 POST로, 그 외에는 GET으로 요청합니다. 응답의 `Content-Type`에 따라 json/text/blob으로
자동 파싱합니다. `options.timeout` 지정 시 `AbortController`로 타임아웃을 적용합니다.

```js
const list = await syn.$r.httpFetch('/api/users').send();
const created = await syn.$r.httpFetch('/api/users').send({ name: 'hong' }, { method: 'POST' });
```

### httpRequest(method, url, data, callback, options)

`XMLHttpRequest` 기반 요청입니다. `data.body`가 있으면 `GET`은 queryString으로 붙이고, 그 외에는
`FormData`로 전송합니다. `callback`을 생략하면 `Promise`를 반환합니다.

```js
const result = await syn.$r.httpRequest('GET', '/api/users');
```

### httpSubmit(url, formID, method)

지정 form(`formID` 생략 시 첫 번째 form)의 `action`/`method`를 설정한 뒤 `submit()`을 호출합니다.

```js
syn.$r.httpSubmit('/upload', 'form1', 'POST');
```

### httpDataSubmit(formData, url, callback, options)

`FormData`를 `XMLHttpRequest`로 `POST` 전송합니다. `callback` 생략 시 `Promise`를 반환합니다.

```js
const result = await syn.$r.httpDataSubmit(formData, '/upload');
```

### getCookie(id) / setCookie(id, val, expires, path, domain, secure) / deleteCookie(id, path, domain)

쿠키 조회/설정/삭제 메서드입니다. `setCookie`는 `expires` 생략 시 24시간, `path` 생략 시 `/`가
기본값으로 적용됩니다. `setCookie`, `deleteCookie` 모두 `$request` 인스턴스를 반환하여 체이닝이
가능합니다.

```js
syn.$r.setCookie('Cookie', 'hello world');
syn.$r.getCookie('Cookie');
syn.$r.deleteCookie('Cookie');
```
