# BarCalender API

## 옵션

| 옵션 | 기본값 | 설명 |
|---|---|---|
| `mode` | `'day'` | `'day'` 또는 `'month'`. 초기화 시 지정하며 실행 중 모드 변경은 지원하지 않음 |
| `value` | `''` | 일별 `YYYY-MM-DD`, 월별 `YYYY-MM`. 값이 있으면 해당 기간으로 이동 |
| `width` | `'100%'` | CSS 너비 문자열 |
| `disabled` | `false` | 전체 사용자 조작 차단 |
| `readOnly` | `false` | 전체 사용자 조작 차단, 읽기 전용 표시 |
| `yearRange` | `10` | 현재 연도 기준 ±범위. 0 이상의 정수. 범위 밖으로 이동하거나 값을 설정하면 해당 연도까지 확장 |
| `highlights` | `{}` | 날짜/월 값별 CSS 클래스. 예: `{'2024-02-29':'bg-orange-lt'}` |
| `controlText` | `null` | 접근성 그룹 이름 |
| 공통 바인딩 옵션 | 기존 규약 | `dataType: 'string'`, `belongID`, `getter`, `setter`, `validators`, `transactConfig`, `triggerConfig` |

모든 날짜는 로컬 달력의 연·월·일로 해석하며 UTC 변환을 하지 않습니다. 연도는 0001~9999입니다. 기본 연도 목록과 확장 범위도 이 경계 안에서 생성합니다. 다른 컨트롤의 설정과 상태는 공유하지 않습니다.

## 메서드

| 메서드 | 반환 / 동작 |
|---|---|
| `controlLoad(elID, setting)` | 초기화된 컨트롤 반환. 같은 ID는 중복 초기화하지 않음 |
| `getControl(elID)` | 컨트롤 정보 또는 `null` |
| `getValue(elID, meta)` | 값 문자열. 미등록 ID는 `null` |
| `setValue(elID, value, meta)` | 성공 `true`, 잘못된 값·미등록 ID는 `false`. 잘못된 값은 경고 기록 후 기존 상태 유지 |
| `clear(elID, isControlLoad)` | `setValue(elID, '')`와 동일. 표시 연·월은 유지 |
| `setDisabled(elID, disabled)` | `false`로 해제. 생략 시 활성화 |
| `setReadOnly(elID, readOnly)` | `false`로 해제. 생략 시 활성화 |

`setValue`는 정확한 모드별 형식과 실제 존재하는 날짜만 허용합니다. 예를 들어 `2023-02-29`, `2024-2-01`, 월 모드의 `2024-02-01`은 거부합니다. `null`, `undefined`, `''`는 빈 선택으로 처리합니다. 비활성화·읽기 전용 상태에서도 프로그램으로 값을 설정할 수 있습니다.

## 이벤트

`syn-events="['change','viewChange']"`를 지정하고 페이지 모듈의 `event`에 `컨트롤ID_이벤트명(evt)`를 작성합니다.

| 이벤트 | `evt.detail` | 발생 시점 |
|---|---|---|
| `change` | `{ value, previousValue, mode }` | 사용자 조작으로 선택값이 실제 변경될 때 |
| `viewChange` | `{ year, month, mode }` | 사용자 조작으로 표시 연·월이 바뀔 때. `month`는 1~12 |

한 번의 조작으로 두 이벤트가 필요하면 `viewChange` 후 `change`가 발생합니다. 같은 값을 다시 클릭하면 발생하지 않습니다. 연도·월 select의 원래 DOM `change` 이벤트는 중복 전달하지 않습니다. 초기화·`setValue`·`clear`는 두 이벤트 모두 발생시키지 않습니다.

```javascript
let $mypage = {
    event: {
        calDate_change(evt) {
            console.log(evt.detail.value, evt.detail.previousValue);
        }
    }
};
```

월별 모드에서 선택을 지운 뒤 이전·다음을 누르면 현재 표시 중인 월을 기준으로 이전·다음 월이 선택됩니다. 연도·월 경계에서 이동 버튼은 비활성화됩니다.
