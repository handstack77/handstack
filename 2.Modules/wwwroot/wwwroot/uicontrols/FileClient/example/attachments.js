'use strict';
let $attachments = {
    prop: {
        maxUploadFileCount: 5,
        // 실무 코드의 $this.store.StoreGrid1과 같은 역할. 그리드 컨트롤 없이 이 배열만 화면에 직접 렌더링한다.
        attachFiles: []
    },

    method: {
        render() {
            var rows = $this.prop.attachFiles.filter(function (row) { return row.Flag != 'D'; });

            syn.$l.get('divAttachList').innerHTML = rows.map(function (row) {
                return '<div>{0} <button type="button" data-fileid="{1}" class="btnRemoveFile">삭제</button></div>'.format(row.FileName, row.FileID);
            }).join('') || '<div>첨부된 파일이 없습니다.</div>';

            syn.$l.get('lblAttachCount').textContent = rows.length;

            syn.$l.querySelectorAll('.btnRemoveFile').forEach(function (button) {
                button.onclick = function () {
                    $this.method.removeFile(button.getAttribute('data-fileid'));
                };
            });
        },

        // 실무 코드에서는 file.sendTo(uploadUrl) 업로드가 끝난 뒤 getFileAction({action:'GetItem', ...})으로
        // 서버가 부여한 FileID/FileName을 받아 이 자리에서 배열에 push한다. 여기서는 서버 없이 그 결과만 흉내 낸다.
        addFile(fileName) {
            $this.prop.attachFiles.push({
                Flag: 'C',
                FileID: 'sim-' + Date.now() + '-' + $this.prop.attachFiles.length,
                FileName: fileName
            });
        },

        removeFile(fileID) {
            // 이미 서버에 저장된(R) 파일은 즉시 배열에서 지우지 않고 Flag만 'D'로 바꿔 저장 시점에 삭제 대상으로 넘긴다.
            // 방금 추가한(C) 파일은 아직 서버에 없으므로 배열에서 바로 제거해도 된다.
            var row = $this.prop.attachFiles.find(function (row) { return row.FileID == fileID; });
            if (row) {
                if (row.Flag == 'C') {
                    $this.prop.attachFiles.splice($this.prop.attachFiles.indexOf(row), 1);
                }
                else {
                    row.Flag = 'D';
                }
            }

            $this.method.render();
        }
    },

    event: {
        filAttach_change(evt) {
            var files = evt.target.files;

            // 실무 코드의 "문서 번호(업무 키)가 있어야 첨부 가능" 가드.
            var documentNo = syn.$l.get('txtDocumentNo').value.trim();
            if (documentNo == '') {
                syn.$w.alert('문서 번호를 먼저 입력하세요.');
                evt.target.value = '';
                return;
            }

            var currentCount = $this.prop.attachFiles.filter(function (row) { return row.Flag != 'D'; }).length;
            if (files.length > $this.prop.maxUploadFileCount - currentCount) {
                syn.$w.alert('첨부 가능한 파일은 {0}개 입니다'.format($this.prop.maxUploadFileCount));
                evt.target.value = '';
                return;
            }

            for (var i = 0; i < files.length; i++) {
                $this.method.addFile(files[i].name);
            }

            evt.target.value = '';
            $this.method.render();
        },

        btnGetValue_click() {
            // 실무 코드는 이 배열을 transaction.MD01.inputs의 { type: 'List', dataFieldID: 'StoreGrid1' }로
            // 본문 Row와 함께 그대로 서버에 전송한다.
            syn.$l.eventLog('btnGetValue_click', JSON.stringify($this.prop.attachFiles));
        }
    }
}
