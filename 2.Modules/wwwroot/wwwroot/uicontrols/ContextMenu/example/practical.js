'use strict';
let $practical = {
    prop: {
        statusNames: { DRAFT: '작성 중', REQUEST: '결재 요청', APPROVED: '승인', REJECTED: '반려' },
        docs: [
            { DocNo: 'DOC-001', Title: '2026년 3분기 영업 보고서', Status: 'DRAFT', UpdatedAt: '2026-09-28' },
            { DocNo: 'DOC-002', Title: '신규 거래처 계약서', Status: 'REQUEST', UpdatedAt: '2026-09-30' },
            { DocNo: 'DOC-003', Title: '서비스 점검 안내문', Status: 'APPROVED', UpdatedAt: '2026-10-01' },
            { DocNo: 'DOC-004', Title: '연말 행사 기획안', Status: 'REJECTED', UpdatedAt: '2026-10-05' }
        ],
        activeDocNo: null,
        sequence: 4
    },

    hook: {
        pageLoad() {
            $this.method.render();
        }
    },

    method: {
        find(docNo) {
            return $this.prop.docs.find((doc) => { return doc.DocNo == docNo; });
        },

        log(text) {
            syn.$l.get('preLog').textContent = `${new Date().toLocaleTimeString()} ${text}\n` + (syn.$l.get('preLog').textContent.startsWith('처리 내역') ? '' : syn.$l.get('preLog').textContent);
            syn.$l.eventLog('practical', text);
        },

        render() {
            syn.$l.get('tbodyDocs').innerHTML = $this.prop.docs.map((doc) => {
                return `<tr class="doc-row" data-docno="${doc.DocNo}" style="cursor: context-menu;"><td>${doc.DocNo}</td><td>${doc.Title}</td><td>${$this.prop.statusNames[doc.Status]}</td><td>${doc.UpdatedAt}</td></tr>`;
            }).join('');
        },

        changeStatus(doc, status, message) {
            doc.Status = status;
            doc.UpdatedAt = new Date().toISOString().slice(0, 10);
            $this.method.render();
            $this.method.log(`${doc.DocNo} ${message}`);
        }
    },

    event: {
        // 우클릭한 문서의 상태에 따라 사용할 수 있는 메뉴만 켠다(작성 중/반려 문서만 결재 요청, 결재 요청 문서만 승인/반려, 승인 문서는 삭제 불가).
        ctxDoc_beforeOpen(evt, ui) {
            let row = $(ui.target).closest('tr.doc-row');
            $this.prop.activeDocNo = row.attr('data-docno');
            let doc = $this.method.find($this.prop.activeDocNo);
            let status = doc ? doc.Status : '';
            let menu = syn.uicontrols.$contextmenu;
            menu.enableEntry('ctxDoc', 'request', status == 'DRAFT' || status == 'REJECTED');
            menu.enableEntry('ctxDoc', 'approve', status == 'REQUEST');
            menu.enableEntry('ctxDoc', 'reject', status == 'REQUEST');
            menu.enableEntry('ctxDoc', 'remove', status != 'APPROVED');
        },

        ctxDoc_select(evt, ui) {
            let doc = $this.method.find($this.prop.activeDocNo);
            if (doc == null) {
                return;
            }

            switch (ui.cmd) {
                case 'open':
                    $this.method.log(`${doc.DocNo} '${doc.Title}' 문서를 열었습니다.`);
                    break;
                case 'copy':
                    $this.prop.sequence++;
                    $this.prop.docs.push({ DocNo: 'DOC-' + String($this.prop.sequence).padStart(3, '0'), Title: `${doc.Title} (복사본)`, Status: 'DRAFT', UpdatedAt: new Date().toISOString().slice(0, 10) });
                    $this.method.render();
                    $this.method.log(`${doc.DocNo} 문서의 복사본을 만들었습니다.`);
                    break;
                case 'request':
                    $this.method.changeStatus(doc, 'REQUEST', '결재를 요청했습니다.');
                    break;
                case 'approve':
                    $this.method.changeStatus(doc, 'APPROVED', '문서를 승인했습니다.');
                    break;
                case 'reject':
                    $this.method.changeStatus(doc, 'REJECTED', '문서를 반려했습니다.');
                    break;
                case 'remove': {
                    let alertOptions = $object.clone(syn.$w.alertOptions);
                    alertOptions.icon = 'question';
                    alertOptions.buttonType = '3';
                    syn.$w.alert(`${doc.DocNo} 문서를 삭제 하시겠습니까?`, '삭제 확인', alertOptions, (result) => {
                        if (result == 'Yes') {
                            $this.prop.docs = $this.prop.docs.filter((item) => { return item.DocNo != doc.DocNo; });
                            $this.method.render();
                            $this.method.log(`${doc.DocNo} 문서를 삭제했습니다.`);
                        }
                    });
                    break;
                }
            }
        }
    }
}
