'use strict';
let $practical = {
    prop: {
        notices: [
            { NoticeNo: 1, Title: '시스템 정기 점검 안내', Content: '매월 첫째 주 일요일 02:00~04:00 에 정기 점검이 진행됩니다.', Status: 'ON' },
            { NoticeNo: 2, Title: '신규 기능 업데이트 안내', Content: '주문 현황 화면에 기간 비교 기능이 추가되었습니다.', Status: 'ON' },
            { NoticeNo: 3, Title: '연말 휴무 안내', Content: '12월 31일은 전 직원 휴무입니다.', Status: 'OFF' }
        ],
        activeNo: null,
        filter: 'ALL',
        isSaving: false
    },

    hook: {
        pageLoad() {
            $this.method.renderList();
            $this.method.newNotice();
        }
    },

    method: {
        renderList() {
            let items = $this.prop.notices.filter((notice) => {
                return $this.prop.filter == 'ALL' || notice.Status == $this.prop.filter;
            });

            syn.$l.get('tbodyNotices').innerHTML = items.length == 0
                ? '<tr><td colspan="3" class="text-center text-muted">공지사항이 없습니다.</td></tr>'
                : items.map((notice) => {
                    return `<tr data-no="${notice.NoticeNo}" style="cursor: pointer;" class="${notice.NoticeNo == $this.prop.activeNo ? 'table-active' : ''}"><td>${notice.NoticeNo}</td><td>${notice.Title}</td><td>${notice.Status == 'ON' ? '게시 중' : '게시 종료'}</td></tr>`;
                }).join('');

            syn.$l.querySelectorAll('#tbodyNotices tr[data-no]').forEach((row) => {
                row.addEventListener('click', () => {
                    $this.method.select(Number(row.getAttribute('data-no')));
                });
            });
        },

        // 선택된 공지가 있을 때만 삭제 버튼을 활성화한다(버튼 상태를 화면 모드에 맞춘다).
        setMode(isEdit) {
            syn.$l.get('btnDelete').disabled = isEdit == false;
            syn.$l.get('spnMode').innerText = isEdit == true ? `공지 #${$this.prop.activeNo} 수정` : '신규 작성';
        },

        select(noticeNo) {
            let notice = $this.prop.notices.find((item) => { return item.NoticeNo == noticeNo; });
            if (notice == null) {
                return;
            }

            $this.prop.activeNo = notice.NoticeNo;
            syn.uicontrols.$textbox.setValue('txtNoticeNo', notice.NoticeNo);
            syn.uicontrols.$textbox.setValue('txtTitle', notice.Title);
            syn.uicontrols.$textarea.setValue('txtContent', notice.Content);
            syn.$l.get('ddlStatus').value = notice.Status;
            $this.method.setMode(true);
            $this.method.renderList();
        },

        newNotice() {
            $this.prop.activeNo = null;
            syn.uicontrols.$textbox.clear('txtNoticeNo');
            syn.uicontrols.$textbox.clear('txtTitle');
            syn.uicontrols.$textarea.clear('txtContent');
            syn.$l.get('ddlStatus').value = 'ON';
            $this.method.setMode(false);
            $this.method.renderList();
        },

        validate() {
            if (syn.uicontrols.$textbox.getValue('txtTitle').trim() == '') {
                syn.$w.alert('제목 항목은 반드시 입력 해야합니다.');
                return false;
            }

            if (syn.uicontrols.$textarea.getValue('txtContent').trim() == '') {
                syn.$w.alert('내용 항목은 반드시 입력 해야합니다.');
                return false;
            }

            return true;
        },

        // 저장 요청이 진행되는 동안 버튼을 잠가 중복 저장을 막고, 완료되면 되돌린다(서버 호출은 setTimeout 으로 흉내 낸다).
        save() {
            if ($this.prop.isSaving == true || $this.method.validate() == false) {
                return;
            }

            $this.prop.isSaving = true;
            let button = syn.$l.get('btnSave');
            let originalHtml = button.innerHTML;
            button.disabled = true;
            button.innerHTML = '<span class="spinner-border spinner-border-sm mr-1"></span> 저장 중...';

            setTimeout(() => {
                let item = {
                    NoticeNo: $this.prop.activeNo == null ? Math.max(0, ...$this.prop.notices.map((notice) => { return notice.NoticeNo; })) + 1 : $this.prop.activeNo,
                    Title: syn.uicontrols.$textbox.getValue('txtTitle').trim(),
                    Content: syn.uicontrols.$textarea.getValue('txtContent').trim(),
                    Status: syn.$l.get('ddlStatus').value
                };

                let index = $this.prop.notices.findIndex((notice) => { return notice.NoticeNo == item.NoticeNo; });
                if (index > -1) {
                    $this.prop.notices[index] = item;
                }
                else {
                    $this.prop.notices.push(item);
                }

                button.disabled = false;
                button.innerHTML = originalHtml;
                $this.prop.isSaving = false;
                syn.$l.eventLog('save', `공지 #${item.NoticeNo} 을(를) 저장했습니다.`);
                $this.method.select(item.NoticeNo);
            }, 600);
        },

        // 삭제처럼 되돌릴 수 없는 동작은 확인(Yes/No) 절차를 거친 뒤에만 실행한다.
        remove() {
            let noticeNo = $this.prop.activeNo;
            if (noticeNo == null) {
                return;
            }

            let alertOptions = $object.clone(syn.$w.alertOptions);
            alertOptions.icon = 'question';
            alertOptions.buttonType = '3';
            syn.$w.alert(`공지 #${noticeNo} 을(를) 삭제 하시겠습니까? 복구가 불가합니다.`, '삭제 확인', alertOptions, (result) => {
                if (result == 'Yes') {
                    $this.prop.notices = $this.prop.notices.filter((notice) => { return notice.NoticeNo != noticeNo; });
                    syn.$l.eventLog('remove', `공지 #${noticeNo} 을(를) 삭제했습니다.`);
                    $this.method.newNotice();
                }
            });
        },

        setFilter(filter, buttonID) {
            $this.prop.filter = filter;
            ['btnFilterAll', 'btnFilterOn', 'btnFilterOff'].forEach((id) => {
                syn.$l.get(id).classList.toggle('active', id == buttonID);
            });
            $this.method.renderList();
        }
    },

    event: {
        btnNew_click() { $this.method.newNotice(); },
        btnSave_click() { $this.method.save(); },
        btnDelete_click() { $this.method.remove(); },
        btnFilterAll_click() { $this.method.setFilter('ALL', 'btnFilterAll'); },
        btnFilterOn_click() { $this.method.setFilter('ON', 'btnFilterOn'); },
        btnFilterOff_click() { $this.method.setFilter('OFF', 'btnFilterOff'); }
    }
}
