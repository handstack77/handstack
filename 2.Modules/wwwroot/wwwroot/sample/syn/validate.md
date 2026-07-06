# 유효성 검사(validate) 사용법 (syn.$v)

## 개요
`syn.$v`는 폼 컨트롤(input 등)에 대한 클라이언트 사이드 유효성 검사 기능을 제공합니다. 필수 입력(required), 정규식 패턴(pattern), 숫자 범위(range), 사용자 정의 함수(custom) 규칙을 노드 단위로 등록한 뒤, 단일 노드/여러 노드/폼 전체 단위로 검증을 실행하고 실패 메시지를 모아서 보여줄 수 있습니다.

## 로드 방법
`syn.js`가 로드되면 전역에 `syn.$v`(원본 이름: `syn.$validation`)로 즉시 사용할 수 있습니다.

## 빠른 시작
```js
syn.$v.required('txt_userName', true, '이름을 입력해 주세요.');
const isValid = syn.$v.validateControl('txt_userName');
if (isValid == false) {
    alert(syn.$v.toMessages());
}
```

## 주요 시나리오

### 1. 필수 입력 검사
`required(el, isRequired, message)`로 노드에 필수 입력 규칙을 등록하고, `validateControl()`로 검사합니다.
```js
syn.$v.required('txt_userName', true, '이름은 필수 입력입니다.');

if (syn.$v.validateControl('txt_userName') == false) {
    alert(syn.$v.toMessages());
}
```

### 2. 정규식 패턴 검사
`syn.$v.regexs`에 미리 정의된 정규식(numeric, email, juminNo, url, mobilePhone 등)을 활용하거나 직접 정규식을 전달할 수 있습니다.
```js
syn.$v.pattern('txt_email', 'email', {
    expr: syn.$v.regexs.email,
    message: '올바른 이메일 형식이 아닙니다.'
});
```

### 3. 숫자 범위 검사
`range(el, validID, options)`은 `minOperator`/`maxOperator` 비교 연산자를 조합해 다양한 범위 조건을 표현할 수 있습니다.
```js
syn.$v.pattern('txt_age', 'numeric', { expr: syn.$v.regexs.numeric, message: '숫자를 입력해 주세요.' });
syn.$v.range('txt_age', 'ageRange', {
    min: 0, max: 100,
    minOperator: '<', maxOperator: '>',
    message: '1 ~ 100 사이의 값을 입력해 주세요.'
});
```

### 4. 사용자 정의 검증 함수
`custom()`은 페이지 스크립트의 `$this.method` 아래 정의된 함수(또는 전역 함수)를 호출해 검증합니다.
```js
// syn.loader.js 페이지 스크립트의 method 블록
method: {
    customValidation(options) {
        return syn.$l.get('txt_custom').value.trim() != '';
    }
}

// 검증 규칙 등록
syn.$v.custom('txt_custom', 'notEmpty', {
    functionName: 'customValidation',
    message: '사용자 지정 검사에 실패했습니다.'
});
```

### 5. 여러 노드 / 폼 전체 검증
`validateControls(els)`는 지정한 노드 목록을, `validateForm()`은 지금까지 규칙이 등록된 모든 노드를 한 번에 검사합니다.
```js
const isValid = syn.$v.validateForm();
if (isValid == false) {
    alert(syn.$v.toMessages());
}
```

## 실전 예제 페이지
`/sample/syn/validate.html` 예제에서 다음 항목을 실습할 수 있습니다.
- 속성: isContinue, messages, elements, targetEL, regexs, roles, valueType/validType
- 메서드: setElement, required, pattern, range, custom, removeValidate/remove, clear, validateControl, validateControls, validateForm, toMessages, getRoleValue/getRoleName

## 주의 사항
- `required()`, `pattern()`, `range()`, `custom()`은 등록 시 `message`(그리고 `pattern`/`range`는 `expr`/`min`,`max`,`minOperator`,`maxOperator`)가 없으면 경고 로그만 남기고 아무 규칙도 등록하지 않습니다.
- `isContinue`가 `true`(기본값)이면 검증 중 실패가 있어도 모든 규칙을 계속 검사하며, `false`이면 첫 실패에서 즉시 중단합니다.
- `toMessages()`를 호출하면 내부 `messages` 배열이 비워지므로, 여러 번 메시지를 참조해야 한다면 호출 전에 값을 복사해 두어야 합니다.
- `custom()` 검증은 `$this.method[functionName]`을 우선 찾고, 없으면 전역(`context[functionName]`)에서 함수를 찾습니다. 두 곳 모두 없으면 검증이 실패로 처리됩니다.
- `validateForm()`은 `elements`에 등록된 노드만 검사하므로, `setElement()`/`pattern()`/`range()`/`custom()`으로 최소 한 번 등록된 노드만 대상이 됩니다.

## 관련 모듈
- API 상세: [`validate_api.md`](./validate_api.md)
