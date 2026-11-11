'use strict';
let $practical = {
    prop: {
        teams: {
            SALES: { name: '영업팀', color: '#206bc4', checkID: 'chkTeamSales' },
            DEV: { name: '개발팀', color: '#2fb344', checkID: 'chkTeamDev' },
            DESIGN: { name: '디자인팀', color: '#ae3ec9', checkID: 'chkTeamDesign' }
        },
        activeID: null
    },

    hook: {
        pageLoad() {
            // 예제용 일정은 오늘 기준 상대 날짜로 만든다(실제 화면에서는 datesSet 에서 서버 조회 후 setValue 로 채운다).
            let day = (offset) => { return $this.method.toText($this.method.addDays(new Date(), offset)); };
            syn.uicontrols.$calendar.setValue('calTeam', [
                { ScheduleID: 'S1', Title: '고객사 제안 발표', StartDate: day(1), EndDate: day(1), BackgroundColor: $this.prop.teams.SALES.color, AllDay: true, Team: 'SALES', Memo: '10시 본사' },
                { ScheduleID: 'S2', Title: '스프린트 리뷰', StartDate: day(2), EndDate: day(2), BackgroundColor: $this.prop.teams.DEV.color, AllDay: true, Team: 'DEV', Memo: '' },
                { ScheduleID: 'S3', Title: '디자인 시스템 개편', StartDate: day(3), EndDate: day(6), BackgroundColor: $this.prop.teams.DESIGN.color, AllDay: true, Team: 'DESIGN', Memo: '컴포넌트 정리' },
                { ScheduleID: 'S4', Title: '월간 영업 회의', StartDate: day(5), EndDate: day(5), BackgroundColor: $this.prop.teams.SALES.color, AllDay: true, Team: 'SALES', Memo: '' }
            ]);
            $this.method.refreshChanged();
        }
    },

    method: {
        addDays(date, offset) {
            let result = new Date(date.getTime());
            result.setDate(result.getDate() + offset);
            return result;
        },

        toText(date) {
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        },

        // FullCalendar 의 종일 일정 end 는 종료일 '다음 날' 0시이므로, 화면용 종료일은 하루를 뺀다.
        endText(event) {
            if (event.end == null) {
                return $this.method.toText(event.start);
            }

            return event.allDay == true ? $this.method.toText($this.method.addDays(event.end, -1)) : $this.method.toText(event.end);
        },

        // 변경분(Flag C/U/D)만 모아 저장 대상 영역에 표시한다.
        refreshChanged() {
            let changed = syn.uicontrols.$calendar.getterValue('calTeam');
            syn.$l.get('spnChanged').innerText = `${changed.length}건`;
            syn.$l.get('preChanged').textContent = changed.length == 0
                ? '변경된 일정이 없습니다.'
                : changed.map((item) => { return `[${item.Flag}] ${item.title} (${String(item.start).slice(0, 10)})`; }).join('\n');
        },

        setMode(id) {
            $this.prop.activeID = id;
            syn.$l.get('btnDelete').disabled = id == null;
            syn.$l.get('spnMode').innerText = id == null ? '신규' : '수정';
        },

        fill(title, team, startText, endText, memo) {
            syn.uicontrols.$textbox.setValue('txtTitle', title);
            syn.$l.get('ddlTeam').value = team;
            syn.uicontrols.$datepicker.getControl('dtpStart').picker.setMaxDate(null);
            syn.uicontrols.$datepicker.getControl('dtpEnd').picker.setMinDate(null);
            syn.uicontrols.$datepicker.setValue('dtpStart', startText);
            syn.uicontrols.$datepicker.setValue('dtpEnd', endText);
            syn.uicontrols.$textbox.setValue('txtMemo', memo);
        },

        newSchedule(startText) {
            $this.method.setMode(null);
            let today = startText || $this.method.toText(new Date());
            $this.method.fill('', 'SALES', today, today, '');
        },

        validate() {
            if (syn.uicontrols.$textbox.getValue('txtTitle').trim() == '') {
                syn.$w.alert('제목 항목은 반드시 입력 해야합니다.');
                return false;
            }

            let startText = syn.uicontrols.$datepicker.getValue('dtpStart');
            let endText = syn.uicontrols.$datepicker.getValue('dtpEnd');
            if (startText == '' || endText == '') {
                syn.$w.alert('시작일과 종료일을 선택 해야합니다.');
                return false;
            }

            if (startText > endText) {
                syn.$w.alert('종료일은 시작일보다 빠를 수 없습니다.');
                return false;
            }

            return true;
        },

        // 새 일정이면 addEvent, 선택된 일정이면 updateEvent 를 호출한다. 종일 일정의 end 는 종료일 다음 날로 넘긴다.
        apply() {
            if ($this.method.validate() == false) {
                return;
            }

            let team = syn.$l.get('ddlTeam').value;
            let endDate = $this.method.toText($this.method.addDays(new Date(syn.uicontrols.$datepicker.getValue('dtpEnd')), 1));
            let data = {
                ScheduleID: $this.prop.activeID == null ? 'N' + Date.now() : $this.prop.activeID,
                Title: syn.uicontrols.$textbox.getValue('txtTitle').trim(),
                StartDate: syn.uicontrols.$datepicker.getValue('dtpStart'),
                EndDate: endDate,
                BackgroundColor: $this.prop.teams[team].color,
                AllDay: true,
                Team: team,
                Memo: syn.uicontrols.$textbox.getValue('txtMemo')
            };

            if ($this.prop.activeID == null) {
                syn.uicontrols.$calendar.addEvent('calTeam', data);
            }
            else {
                syn.uicontrols.$calendar.updateEvent('calTeam', data);
            }

            $this.method.refreshChanged();
            $this.method.applyTeamFilter();
            $this.method.newSchedule();
        },

        remove() {
            if ($this.prop.activeID == null) {
                return;
            }

            syn.uicontrols.$calendar.removeEvent('calTeam', $this.prop.activeID);
            $this.method.refreshChanged();
            $this.method.newSchedule();
        },

        // 팀 체크 상태에 맞춰 일정을 보이거나 숨긴다(데이터와 Flag 는 그대로 유지된다).
        applyTeamFilter() {
            let visibleTeams = Object.keys($this.prop.teams).filter((team) => {
                return syn.$l.get($this.prop.teams[team].checkID).checked == true;
            });

            syn.uicontrols.$calendar.getCalendar('calTeam').getEvents().forEach((event) => {
                if (event.extendedProps.Flag == 'D') {
                    return;
                }

                event.setProp('display', visibleTeams.includes(event.extendedProps.Team) == true ? 'auto' : 'none');
            });
        },

        saveAll() {
            let changed = syn.uicontrols.$calendar.getterValue('calTeam');
            if (changed.length == 0) {
                syn.$w.alert('저장할 변경분이 없습니다.');
                return;
            }

            syn.$l.eventLog('saveAll', `${changed.length}건 저장 요청: ` + JSON.stringify(changed.map((item) => { return { id: item.id, flag: item.Flag }; })));
        }
    },

    event: {
        calTeam_dateClick(info) {
            $this.method.newSchedule(info.dateStr.slice(0, 10));
        },

        calTeam_select(info) {
            let endText = $this.method.toText($this.method.addDays(new Date(info.endStr), -1));
            $this.method.setMode(null);
            $this.method.fill('', 'SALES', info.startStr.slice(0, 10), endText, '');
        },

        calTeam_eventClick(info) {
            let event = info.event;
            $this.method.setMode(event.id);
            $this.method.fill(event.title, event.extendedProps.Team || 'SALES', $this.method.toText(event.start), $this.method.endText(event), event.extendedProps.Memo || '');
        },

        // 드래그로 옮기거나 기간을 조정하면 컨트롤이 Flag 를 'U' 로 바꾼다.
        calTeam_eventDrop(info) {
            $this.method.refreshChanged();
        },

        calTeam_eventResize(info) {
            $this.method.refreshChanged();
        },

        calTeam_datesSet(dateInfo) {
            syn.$l.eventLog('calTeam_datesSet', `${dateInfo.startStr.slice(0, 10)} ~ ${dateInfo.endStr.slice(0, 10)} 조회 범위 변경`);
        },

        btnNew_click() { $this.method.newSchedule(); },
        btnSave_click() { $this.method.apply(); },
        btnDelete_click() { $this.method.remove(); },
        btnSaveAll_click() { $this.method.saveAll(); },
        chkTeamSales_change() { $this.method.applyTeamFilter(); },
        chkTeamDev_change() { $this.method.applyTeamFilter(); },
        chkTeamDesign_change() { $this.method.applyTeamFilter(); }
    }
}
