# BarCalender · 한 줄 달력

`<syn_barcalender>`는 한 줄에서 날짜 또는 월 하나를 선택하는 HandStack 컨트롤입니다. `syn.uicontrols.$barcalender`로 제어하며 새 외부 라이브러리 없이 기존 Tabler 스타일을 사용합니다. 이름은 디렉터리와 동일하게 **BarCalender**입니다.

```html
<syn_barcalender id="calDate" syn-datafield="SelectedDate"
    syn-events="['change','viewChange']"
    syn-options="{mode:'day'}"></syn_barcalender>
<syn_barcalender id="calMonth" syn-datafield="SelectedMonth"
    syn-options="{mode:'month'}"></syn_barcalender>
```

```javascript
syn.uicontrols.$barcalender.setValue('calDate', '2024-02-29');
syn.uicontrols.$barcalender.getValue('calDate'); // '2024-02-29'
syn.uicontrols.$barcalender.clear('calDate'); // 선택만 해제, 표시 월 유지
```

- `day`: `YYYY-MM-DD`, `month`: `YYYY-MM` 문자열을 사용하며, 선택이 없으면 `''`입니다.
- 초기 선택은 없습니다. 현재 연도·월만 표시합니다. 오늘·이번 달은 밑줄, 선택값은 테두리로 구분합니다.
- 일별 이전·다음 이동과 연도·월 변경은 표시 기간만 바꿉니다. 다른 달에 선택한 날짜도 값으로 유지됩니다.
- 월별 이전·다음 이동은 이전·다음 월을 선택합니다. 연도 변경은 기존 선택 월을 유지하며 선택이 없으면 값도 비어 있습니다.
- 좁은 화면에서는 버튼 영역만 가로 스크롤됩니다. Tab으로 이동하고 Enter·Space로 버튼을 선택할 수 있습니다.
- `syn-datafield`, `belongID`와 기존 거래의 Form/Row 매핑으로 읽기·쓰기를 지원합니다. 별도 서버 API는 필요 없습니다.
- 초기화·프로그램을 통한 값 설정·초기화는 이벤트를 발생시키지 않습니다.

[API](API.md) · [실행 예제](example/basic.html) · [통합 샘플](/sample/uicontrol/barcalender.html)

## 개발 검증

`2.Modules/wwwroot`에서 Gulp `loader`, `controls`, `styles` 작업을 실행한 뒤 `bundle`을 실행합니다. `bundle`은 `controls`가 완료된 후 실행해야 합니다.
