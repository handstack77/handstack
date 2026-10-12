'use strict';
let $practical = {
    prop: {
        tempDependencyID: null
    },

    hook: {
        pageLoad() {
            $this.method.newPost();
        }
    },

    method: {
        // 아직 글 번호가 없는 신규 작성 화면에서는 임시 dependencyID 로 파일을 올려 두고, 등록할 때 실제 키로 바꾼다.
        newPost() {
            $this.prop.tempDependencyID = syn.uicontrols.$fileclient.getTemporaryDependencyID('BOARD_');
            syn.$l.get('spnTempID').innerText = $this.prop.tempDependencyID;
            syn.uicontrols.$textbox.clear('txtTitle');
            syn.uicontrols.$textarea.clear('txtContent');
            syn.uicontrols.$fileclient.clear('sfcAttach');
            syn.$l.get('divAttachList').innerHTML = '첨부된 파일이 없습니다.';
            syn.$l.get('preResult').innerText = '등록 버튼을 누르면 글 정보와 첨부 키 변경 결과가 표시됩니다.';
        },

        // 임시 키에 속한 파일 목록을 서버에서 다시 조회해 화면에 그린다.
        async refreshAttachList() {
            let result = null;
            try {
                result = await syn.uicontrols.$fileclient.getItems('sfcAttach', $this.prop.tempDependencyID);
            }
            catch (error) {
                syn.$l.eventLog('refreshAttachList', '첨부 목록 조회 실패(repository 모듈 확인 필요)', 'Warning');
            }

            let list = syn.$l.get('divAttachList');

            let items = result && (result.Items || result.items || (Array.isArray(result) ? result : null));
            if (items == null || items.length == 0) {
                list.innerHTML = '첨부된 파일이 없습니다.';
                return;
            }

            list.innerHTML = items.map((item) => {
                let itemID = item.ItemID || item.itemID;
                let fileName = item.FileName || item.fileName || itemID;
                let size = item.SizeLength || item.sizeLength;
                return `<div class="d-flex align-items-center mb-1"><span class="flex-fill">${fileName}${size ? ' (' + syn.uicontrols.$fileclient.toFileLengthString(size) + ')' : ''}</span>`
                    + `<button type="button" class="btn btn-sm btn-icon btnDownload" data-itemid="${itemID}"><i class="ti ti-download"></i></button> `
                    + `<button type="button" class="btn btn-sm btn-icon btn-danger btnRemove" data-itemid="${itemID}"><i class="ti ti-trash"></i></button></div>`;
            }).join('');

            syn.$l.querySelectorAll('.btnDownload').forEach((button) => {
                button.addEventListener('click', () => {
                    syn.uicontrols.$fileclient.fileDownload({ repositoryID: 'TSTLM01', itemID: button.getAttribute('data-itemid') });
                });
            });

            syn.$l.querySelectorAll('.btnRemove').forEach((button) => {
                button.addEventListener('click', async () => {
                    await syn.uicontrols.$fileclient.deleteItem('sfcAttach', button.getAttribute('data-itemid'));
                    $this.method.refreshAttachList();
                });
            });
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

        // 글을 저장해 실제 글 번호를 받은 뒤(서버 저장은 흉내), 임시 키로 올려 둔 첨부파일의 소속 키를 실제 글 번호로 바꾼다.
        async save() {
            if ($this.method.validate() == false) {
                return;
            }

            let postNo = 'B' + new Date().getTime().toString().slice(-6);
            let changed = null;
            try {
                changed = await syn.uicontrols.$fileclient.updateDependencyID('sfcAttach', $this.prop.tempDependencyID, postNo);
            }
            catch (error) {
                syn.$l.eventLog('save', '첨부 키 변경 실패(repository 모듈 확인 필요)', 'Warning');
            }


            syn.$l.get('preResult').innerText = JSON.stringify({
                PostNo: postNo,
                Title: syn.uicontrols.$textbox.getValue('txtTitle').trim(),
                Content: syn.uicontrols.$textarea.getValue('txtContent').trim(),
                AttachItemIDs: syn.$l.get('sfcAttach') ? syn.uicontrols.$fileclient.getValue('sfcAttach') : '',
                TempDependencyID: $this.prop.tempDependencyID,
                AttachKeyChanged: changed != null
            }, null, 2);

            syn.$l.eventLog('save', `글 ${postNo} 을(를) 등록했습니다 (첨부 키 변경: ${changed != null ? '성공' : '서버 없음/실패'})`);
        }
    },

    event: {
        // 업로드 팝업에서 작업이 끝나면 호출된다.
        attachUpdated(action, result) {
            syn.$l.eventLog('attachUpdated', `${action}`);
            $this.method.refreshAttachList();
        },

        btnUpload_click() {
            let uploadOptions = syn.uicontrols.$fileclient.getFileSetting('sfcAttach');
            if (uploadOptions == null) {
                syn.$w.alert('저장소 정보를 가져오지 못했습니다. repository 모듈과 TSTLM01 저장소를 확인하세요.');
                return;
            }

            uploadOptions.dependencyID = $this.prop.tempDependencyID;
            syn.uicontrols.$fileclient.uploadUI(uploadOptions);
        },

        btnRefresh_click() {
            $this.method.refreshAttachList();
        },

        btnNew_click() {
            $this.method.newPost();
        },

        btnSave_click() {
            $this.method.save();
        }
    }
}
