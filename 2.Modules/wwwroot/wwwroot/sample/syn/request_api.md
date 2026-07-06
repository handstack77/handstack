# $request (syn.$r) API 참조

## 모듈 정보

- 이름: `$request`
- 별칭: `syn.$r`
- 위치: `2.Modules/wwwroot/wwwroot/js/syn.js` (약 5556~6054번째 줄)
- 설명: http 요청, URL/queryString 조작, Cookie 조작 기능을 제공하는 모듈입니다.

## 속성

| 속성 | 타입 | 설명 |
| --- | --- | --- |
| `params` | `object` | 조회된 queryString 값을 담는 객체입니다. 초기값은 `{}`이며 `query()` 호출 시 채워집니다. |
| `path` | `string` | 현재 페이지의 `location.pathname` 값입니다(Node 환경에서는 빈 문자열). |
| `createBlobUrl` | `function` | `URL.createObjectURL`(또는 `webkitURL.createObjectURL`)에 바인딩된 함수입니다. |
| `revokeBlobUrl` | `function` | `URL.revokeObjectURL`(또는 `webkitURL.revokeObjectURL`)에 바인딩된 함수입니다. |

## 메서드 요약

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

## 메서드 상세

### query(param, url)

url(생략 시 `location.href`)의 queryString을 파싱하여 `syn.$r.params`에 채운 뒤, `param` 키에 해당하는
값을 반환합니다. 값에 `%XX` 형식의 인코딩 문자가 포함되어 있으면 자동으로 `decodeURIComponent`로 복원합니다.

```js
syn.$r.query('page');                                    // 현재 페이지 url 기준 조회
syn.$r.query('page', '/list.html?page=2&size=10');        // 지정 url 기준 조회
```

### url()

`syn.$r.path`와 `syn.$r.params`의 문자열 값들을 조합해 queryString이 포함된 url을 생성합니다.
`syn.Config.IsClientCaching`이 `false`이면 캐시 무효화를 위한 `noCache` 파라미터가 자동으로 추가됩니다.

```js
syn.$r.params.page = '2';
const url = syn.$r.url(); // 예: /list.html?page=2
```

### toQueryString(jsonObject, isQuestion)

json 객체를 `key=value&key=value` 형태의 queryString 문자열로 변환합니다. `isQuestion`이 `true`이면
문자열 맨 앞에 `?`를 붙입니다.

```js
syn.$r.toQueryString({ page: '1', size: '2kg' });        // page=1&size=2kg
syn.$r.toQueryString({ page: '1' }, true);                // ?page=1
```

### toUrlObject(url)

url(생략 시 `location.href`)의 queryString 부분을 파싱하여 json 객체로 변환합니다.

```js
syn.$r.toUrlObject('/list.html?page=1&size=10');
// { page: '1', size: '10' }
```

### resolveUrl(relativePath, baseUrl)

`URL` 생성자를 이용해 상대 경로(`relativePath`)를 기준 url(`baseUrl`, 생략 시 `location.href`)에 대한
절대 url로 변환합니다.

```js
syn.$r.resolveUrl('/api/v1/users', 'https://example.com');
// https://example.com/api/v1/users
syn.$r.resolveUrl('../v1/users/', 'https://example.com/api/v2');
// https://example.com/api/v1/users
```

### addQueryParam(param, value, urlStr)

url(`urlStr`, 생략 시 `location.href`)에 queryString 파라미터를 추가합니다. `param`이 객체이면
`{key: value, ...}` 형태로 여러 개를 한 번에 추가할 수 있고, 문자열이면 `value`와 함께 단일 파라미터를
추가합니다. 잘못된 형식이면 경고 로그를 남기고 원본 url을 반환합니다.

```js
syn.$r.addQueryParam('page', '2', 'https://example.com/list?size=10');
// https://example.com/list?size=10&page=2
```

### removeQueryParam(paramName, urlStr)

url에서 지정한 queryString 파라미터를 제거합니다. `paramName`은 문자열 또는 문자열 배열입니다.

```js
syn.$r.removeQueryParam('size', 'https://example.com/list?page=2&size=10');
// https://example.com/list?page=2
```

### setQueryParam(param, value, urlStr)

url의 queryString 파라미터 값을 설정(이미 있으면 대체)합니다. `param`이 객체이면 여러 개를 한 번에
설정할 수 있습니다.

```js
syn.$r.setQueryParam('size', '20', 'https://example.com/list?page=2&size=10');
// https://example.com/list?page=2&size=20
```

### isCorsEnabled(url)

`fetch(url, { method: 'HEAD' })` 요청으로 대상 url에 CORS로 접근 가능한지 확인하는 비동기 메서드입니다.
응답 상태 코드가 200~299이면 `true`를 반환합니다.

```js
const enabled = await syn.$r.isCorsEnabled('https://example.com/api/data');
```

### httpFetch(url)

`fetch` API 기반의 요청 객체(Proxy)를 반환합니다. 반환된 객체는 `send` 액션만 지원하며, `send(raw, options)`
호출 시 실제 요청이 수행됩니다. `raw`가 문자열이 아니고 null/undefined도 아니면 POST 방식 본문으로
전송하고, 그 외에는 GET 방식으로 요청합니다. 응답의 `Content-Type`에 따라 json/text/blob 중 알맞은
형태로 자동 파싱하여 반환합니다.

```js
const result = await syn.$r.httpFetch('/api/users').send();
const created = await syn.$r.httpFetch('/api/users').send({ name: 'hong' }, { method: 'POST' });
```

### httpRequest(method, url, data, callback, options)

`XMLHttpRequest` 기반으로 http 요청을 수행합니다. `data.body`가 있으면 `GET`은 queryString으로,
그 외 메서드는 `FormData`로 전송합니다. `callback`을 생략하면 `Promise`를 반환합니다.

```js
const result = await syn.$r.httpRequest('GET', '/api/users');
syn.$r.httpRequest('POST', '/api/users', { body: { name: 'hong' } }, (result) => {
    console.log(result.status, result.response);
});
```

### httpSubmit(url, formID, method)

`document.forms`에서 `formID`(생략 시 첫 번째 form)를 찾아 `action`/`method`를 설정한 뒤 `submit()`을
호출합니다. form이 없으면 `false`를 반환합니다.

```js
syn.$r.httpSubmit('/upload', 'form1', 'POST');
```

### httpDataSubmit(formData, url, callback, options)

`FormData` 객체를 `XMLHttpRequest`로 `POST` 전송합니다. `callback`을 생략하면 `Promise`를 반환합니다.

```js
const formData = new FormData();
formData.append('file', fileInput.files[0]);
const result = await syn.$r.httpDataSubmit(formData, '/upload');
```

### getCookie(id)

`document.cookie`에서 `id`에 해당하는 쿠키 값을 조회하여 `decodeURIComponent`로 복원해 반환합니다.
없으면 `undefined`를 반환합니다.

```js
const value = syn.$r.getCookie('Cookie');
```

### setCookie(id, val, expires, path, domain, secure)

쿠키 값을 설정합니다. `expires`를 생략하면 24시간 뒤 만료되며, `path`를 생략하면 `/`가 사용됩니다.
`$request` 인스턴스(`$request` 자기 자신)를 반환하여 체이닝이 가능합니다.

```js
syn.$r.setCookie('Cookie', 'hello world');
syn.$r.setCookie('Cookie', 'hello world', new Date(Date.now() + 1000 * 60 * 60), '/', undefined, true);
```

### deleteCookie(id, path, domain)

지정한 쿠키가 존재하면 만료 시각을 과거로 설정해 삭제합니다. `$request` 인스턴스를 반환합니다.

```js
syn.$r.deleteCookie('Cookie');
```
