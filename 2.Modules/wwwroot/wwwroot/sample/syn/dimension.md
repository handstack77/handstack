# 크기/위치 계산 사용법 (syn.$d)

## 개요
`syn.$d`는 HTML Element와 브라우저 화면/문서의 크기, 스크롤 위치, 오프셋(위치), 텍스트 렌더링 크기를 계산하는 기능을 제공합니다. 레이아웃 계산, 툴팁/팝업 위치 지정, 동적 텍스트 크기 측정 등에 사용됩니다.

## 로드 방법
`syn.js`가 로드되면 전역에 `syn.$d`(별칭: `$dimension`)로 즉시 사용할 수 있습니다.

## 빠른 시작
```js
const size = syn.$d.getSize('myElement');
console.log(size.width, size.height);
```

## 주요 시나리오
### 문서/윈도우 최대 크기 조회
`getDocumentSize()`와 `getWindowSize()`로 스크롤을 포함한 문서 전체 크기와 현재 보이는 브라우저 창 크기를 각각 조회합니다.
```js
const docSize = syn.$d.getDocumentSize();
const winSize = syn.$d.getWindowSize();
```

### 노드 위치/오프셋 계산
`offset(el)`은 문서 기준 절대 좌표를, `offsetLeft(el)`/`offsetTop(el)`은 최상위 노드까지의 누적 거리를, `parentOffsetLeft(el)`/`parentOffsetTop(el)`은 직속 부모와의 거리를 계산합니다.
```js
const pos = syn.$d.offset('myElement');
console.log(pos.top, pos.left);
```

### 마우스 위치, 스크롤 위치 추적
`getMousePosition(evt)`로 이벤트 발생 시점의 마우스 좌표를, `getScrollPosition(el)`로 특정 노드 또는 문서의 스크롤 거리를 조회합니다.
```js
document.addEventListener('click', (evt) => {
    const mouse = syn.$d.getMousePosition(evt);
    console.log(mouse.x, mouse.y);
});
```

### 텍스트 렌더링 크기 측정
`measureWidth`, `measureHeight`, `measureSize`로 실제 렌더링되었을 때의 텍스트 크기를 fontSize 기준으로 측정합니다. 동적으로 생성되는 라벨/툴팁의 크기를 미리 계산할 때 유용합니다.
```js
const { width, height } = syn.$d.measureSize('안녕하세요', '14px', '400px');
```

## 실전 예제 페이지
`/sample/syn/dimension.html` 예제에서 다음 항목을 실습할 수 있습니다.
- getDocumentSize(), getWindowSize(), getScrollPosition(), getMousePosition(), offset(), offsetLeft(), parentOffsetLeft(), offsetTop(), parentOffsetTop(), getSize(), measureWidth(), measureHeight(), measureSize() 메서드 실습

## 주의 사항
- `getDocumentSize(true)`, `getWindowSize(true)`처럼 `isTopWindow`를 `true`로 넘기면 최상위(top) 프레임 기준으로 계산하므로, iframe 내부에서 호출할 때 교차 출처(cross-origin) 제약이 있으면 실패할 수 있습니다.
- `measureHeight(text, width, fontSize)`는 세 번째 인자가 `fontSize`이며 두 번째 인자(`width`)를 생략하면 `'auto'`로 처리되어 줄바꿈이 발생하지 않을 수 있습니다. 인자 순서에 주의하십시오.
- `syn.$d`는 별도의 공개 속성이 없고 전부 메서드로만 구성되어 있습니다.

## 관련 모듈
- API 상세: [`dimension_api.md`](./dimension_api.md)
