# 키보드 단축키 사용법 (syn.$k)

## 개요
`syn.$k`는 특정 노드에서 발생하는 키보드 이벤트(keydown/keyup)를 키 코드 단위로 등록/해제할 수 있는 단축키 기능을 제공합니다. 폼 입력 필드나 특정 컨테이너에서 커스텀 단축키(예: Ctrl 조합, 방향키 이동 등)를 구현할 때 사용합니다.

## 로드 방법
`syn.js`가 로드되면 전역에 `syn.$k`(별칭: `$keyboard`)로 즉시 사용할 수 있습니다.

## 빠른 시작
```js
syn.$k.setElement('myInput');
syn.$k.addKeyCode('keydown', syn.$k.keyCodes.enter, (evt) => {
    console.log('엔터 입력됨');
});
```

## 주요 시나리오
### 단축키 등록 대상 노드 지정
`setElement(el)`로 키 이벤트를 수신할 노드를 지정합니다. 지정된 노드에는 내부적으로 `keydown`/`keyup` 리스너가 한 번만 등록되고, 이후 `addKeyCode`/`removeKeyCode` 호출은 이 노드를 기준으로 동작합니다.
```js
syn.$k.setElement('myInput');
```

### 단축키 콜백 등록/해제
`addKeyCode(keyType, keyCode, func)`로 `keydown`/`keyup` 이벤트에 대한 콜백을, `keyCodes` 테이블의 키 이름으로 지정합니다. 콜백이 `false`를 반환하면 기본 동작이 취소(`preventDefault`/`stopPropagation`)됩니다.
```js
syn.$k.addKeyCode('keydown', syn.$k.keyCodes.a, (evt) => {
    console.log('A 키 눌림');
    return false;
});

syn.$k.removeKeyCode('keydown', syn.$k.keyCodes.a);
```

### KeyboardEvent.code 값을 keyCode 숫자로 변환
브라우저 표준 `KeyboardEvent.code`(예: `'KeyA'`, `'Enter'`) 값을 `keyCodes` 테이블에서 사용하는 숫자 코드로 변환할 때 `getKeyCode(code)`를 사용합니다.
```js
const code = syn.$k.getKeyCode('KeyA'); // 65
```

## 실전 예제 페이지
`/sample/syn/keyboard.html` 예제에서 다음 항목을 실습할 수 있습니다.
- keyCodes, keyNames, targetEL, elements 속성 확인
- setElement(), addKeyCode(), removeKeyCode(), getKeyCode() 메서드 실습

## 주의 사항
- `addKeyCode`/`removeKeyCode`는 반드시 `setElement`로 대상 노드를 지정한 뒤에 호출해야 합니다. 대상이 없으면 등록/삭제가 조용히 무시됩니다.
- `addKeyCode`의 `keyCode` 인자는 숫자 키코드이므로 `syn.$k.keyCodes.a`처럼 `keyCodes` 테이블을 통해 조회해서 전달합니다.
- `keyCodes`, `keyNames`는 `Object.freeze`로 동결되어 있어 런타임에 변경할 수 없습니다.

## 관련 모듈
- API 상세: [`keyboard_api.md`](./keyboard_api.md)
