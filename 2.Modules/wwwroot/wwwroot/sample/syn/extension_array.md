# $array 사용법 ($array)

## 개요
`$array`는 자바스크립트 `Array` 객체를 대상으로 하는 확장 함수 모음입니다. 배열 정렬, 그룹화, 집합 연산(합집합/차집합/교집합), 값 검색, 순위 계산 등 목록 데이터를 다룰 때 자주 필요한 기능을 제공합니다. `syn.js`가 로드되면 전역 객체로 즉시 사용할 수 있으며, `syn.$array`와 같은 별도의 `syn.` 접두 별칭은 없습니다.

## 로드 방법
`syn.js`가 로드되면 전역에 `$array`로 즉시 사용할 수 있습니다. 별도의 초기화나 `new` 호출이 필요하지 않습니다.

## 빠른 시작
```js
const unique = $array.distinct(['Apple', 'Banana', 'Banana', 'Mango']);
// ["Apple", "Banana", "Mango"]

const sorted = $array.sort(['Banana', 'Apple', 'Mango'], true);
// ["Apple", "Banana", "Mango"]
```

## 주요 시나리오

### 중복 제거와 정렬
목록성 데이터를 화면에 표시하기 전에 중복을 제거하고 정렬해야 하는 경우가 많습니다.
```js
const items = ['Apple', 'Banana', 'Banana', 'Mango', 'Cherry'];
const result = $array.sort($array.distinct(items), true);
```

### 객체 배열 정렬과 그룹화
그리드나 목록 화면에서 특정 속성 기준으로 정렬하거나 그룹화할 때 사용합니다.
```js
const rows = [{ name: 'Apple', price: 10 }, { name: 'Banana', price: 5 }];
const sortedByPrice = $array.objectSort(rows, 'price', true);
const grouped = $array.groupBy(rows, ({ price }) => price <= 5 ? 'buy' : 'not buy');
```

### 두 배열의 집합 연산
서버에서 받은 목록과 화면에 있는 목록을 비교할 때 합집합/차집합/교집합/대칭차집합을 활용할 수 있습니다.
```js
const server = ['Apple', 'Banana', 'Mango'];
const local = ['Grape', 'Banana', 'BlueBerry'];

$array.union(server, local);              // 합집합
$array.difference(server, local);         // server 기준 차집합
$array.intersect(server, local);          // 교집합
$array.symmetryDifference(server, local); // 대칭차집합
```

### 파라미터 배열에서 값 찾기
서버 응답이 `[{ ParameterName, Value }]` 형태의 파라미터 배열로 오는 경우, `getValue`로 값을 안전하게 조회할 수 있습니다.
```js
const items = [{ ParameterName: 'MaxCount', Value: '100' }];
$array.getValue(items, 'MaxCount', '0'); // "100"
$array.getValue(items, 'NotExists', '0'); // "0" (기본값)
```

### 순위 계산
동점 처리가 포함된 순위를 계산할 때 `ranks`를 사용합니다.
```js
$array.ranks([79, 5, 18, 5, 32], false); // 내림차순 기준 순위 배열
```

## 실전 예제 페이지
`/sample/syn/extension_array.html` 예제에서 다음 항목을 실습할 수 있습니다.
- `$array.distinct()` - 중복 제거
- `$array.sort()` - 정렬
- `$array.objectSort()` - 객체 배열 속성 기준 정렬
- `$array.groupBy()` - 그룹화(문자열 키, 배열 length, 함수 predicate 지원)
- `$array.shuffle()` - 무작위 섞기
- `$array.addAt()` / `$array.removeAt()` - 지정 위치 추가/삭제
- `$array.contains()` - 포함 여부 확인
- `$array.merge()` - predicate 기반 병합
- `$array.union()` / `$array.difference()` / `$array.intersect()` / `$array.symmetryDifference()` - 집합 연산
- `$array.getValue()` - 파라미터 배열에서 값 조회
- `$array.ranks()` - 순위 계산
- `$array.split()` - 구분자 문자열을 배열로 변환

## 주의 사항
- `$array`의 대부분의 메서드는 원본 배열을 변경하지 않고 새 배열을 반환합니다(불변성 유지).
- `$array.split()`은 배열이 아니라 문자열을 입력으로 받아 배열로 변환하는 메서드입니다. 이미 배열인 값에는 사용하지 마세요.
- `groupBy`의 두 번째 인자는 속성명(문자열) 또는 `(item) => key` 형태의 함수 모두 사용할 수 있습니다.
- `merge`의 predicate 기본값은 `(a, b) => a === b`이며, 객체 배열을 병합할 때는 적절한 predicate를 지정해야 중복 판정이 올바르게 동작합니다.
- 예제 페이지의 "속성" 카드에 있는 `$array.version` 값은 다른 syn.js 샘플 페이지와 동일하게 `syn.$m.version`(라이브러리 공용 버전 표시 관례)을 그대로 사용합니다.

## 관련 모듈
- API 상세: [`extension_array_api.md`](./extension_array_api.md)
