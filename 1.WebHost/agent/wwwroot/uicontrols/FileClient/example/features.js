'use strict';
let $features = {
    event: {
        // fileUpdateCallback 옵션에 지정한 이름의 함수로, 업로드 팝업에서 작업이 끝나면 호출된다.
        singleUpdated(action, result) {
            syn.$l.eventLog('singleUpdated', `${action}: ${JSON.stringify(result)}`);
        },

        // 표준 패턴: 컨트롤이 조회해 둔 저장소 정책(getFileSetting)을 복제한 뒤 필요한 값만 덮어쓰고 uploadUI 로 팝업을 연다.
        btnUploadUI_click() {
            let uploadOptions = syn.uicontrols.$fileclient.getFileSetting('sfcSingle');
            if (uploadOptions == null) {
                syn.$w.alert('저장소 정보를 가져오지 못했습니다. repository 모듈과 TSTLS01 저장소를 확인하세요.');
                return;
            }

            uploadOptions.dependencyID = 'FEATURES-DOC-001';
            uploadOptions.minHeight = 420;
            syn.uicontrols.$fileclient.uploadUI(uploadOptions);
        },

        btnUploadMulti_click() {
            let uploadOptions = syn.uicontrols.$fileclient.getFileSetting('sfcMulti');
            if (uploadOptions == null) {
                syn.$w.alert('저장소 정보를 가져오지 못했습니다. repository 모듈과 TSTLM01 저장소를 확인하세요.');
                return;
            }

            uploadOptions.dependencyID = 'FEATURES-DOC-001';
            syn.uicontrols.$fileclient.uploadUI(uploadOptions);
        },

        btnGetFileSetting_click() {
            let setting = syn.uicontrols.$fileclient.getFileSetting('sfcMulti');
            syn.$l.eventLog('btnGetFileSetting_click', setting == null ? '(저장소 조회 전이거나 실패)' : JSON.stringify({
                repositoryID: setting.repositoryID,
                uploadType: setting.uploadType,
                uploadExtensions: setting.uploadExtensions,
                uploadCount: setting.uploadCount,
                uploadSizeLimit: setting.uploadSizeLimit,
                uploadUrl: setting.uploadUrl
            }));
        },

        // 팝업 없이 Data URI 를 Blob 으로 바꿔 바로 업로드한다.
        btnUploadDataUri_click() {
            let dataUri = 'data:text/plain;base64,' + btoa('FileClient uploadDataUri 예제 파일입니다.');
            syn.uicontrols.$fileclient.uploadDataUri({
                repositoryID: 'TSTLS01',
                dependencyID: 'FEATURES-DOC-001',
                dataUri: dataUri,
                fileName: 'sample.txt'
            }, function (result) {
                syn.$l.eventLog('btnUploadDataUri_click', result == null ? '업로드 실패(서버 확인 필요)' : JSON.stringify(result));
            });
        },

        btnUploadBlob_click() {
            let blob = new Blob(['FileClient uploadBlob 예제 파일입니다.'], { type: 'text/plain' });
            syn.uicontrols.$fileclient.uploadBlob({
                repositoryID: 'TSTLS01',
                dependencyID: 'FEATURES-DOC-001',
                blobInfo: blob,
                mimeType: 'text/plain',
                fileName: 'sample-blob.txt'
            }, function (result) {
                syn.$l.eventLog('btnUploadBlob_click', result == null ? '업로드 실패(서버 확인 필요)' : JSON.stringify(result));
            });
        },

        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', JSON.stringify({
                Single: syn.uicontrols.$fileclient.getValue('sfcSingle'),
                Profile: syn.uicontrols.$fileclient.getValue('sfcProfile'),
                Multi: syn.uicontrols.$fileclient.getValue('sfcMulti')
            }));
        },

        btnSetValue_click() {
            syn.uicontrols.$fileclient.setValue('sfcSingle', syn.$l.get('txtItemID').value.trim());
        },

        btnClear_click() {
            ['sfcSingle', 'sfcProfile', 'sfcMulti', 'sfcEditor'].forEach((id) => {
                syn.uicontrols.$fileclient.clear(id);
            });
        },

        btnGetItem_click() {
            syn.uicontrols.$fileclient.getItem('sfcSingle', syn.$l.get('txtItemID').value.trim(), function (result) {
                syn.$l.eventLog('btnGetItem_click', result == null ? '조회 실패' : JSON.stringify(result));
            });
        },

        btnGetItems_click() {
            syn.uicontrols.$fileclient.getItems('sfcMulti', 'FEATURES-DOC-001', function (result) {
                syn.$l.eventLog('btnGetItems_click', result == null ? '조회 실패' : JSON.stringify(result));
            });
        },

        btnUpdateFileName_click() {
            syn.uicontrols.$fileclient.updateFileName('sfcSingle', syn.$l.get('txtItemID').value.trim(), 'renamed.txt', function (result) {
                syn.$l.eventLog('btnUpdateFileName_click', result == null ? '변경 실패' : JSON.stringify(result));
            });
        },

        btnUpdateDependency_click() {
            syn.uicontrols.$fileclient.updateDependencyID('sfcMulti', 'FEATURES-DOC-001', 'FEATURES-DOC-002', function (result) {
                syn.$l.eventLog('btnUpdateDependency_click', result == null ? '변경 실패' : JSON.stringify(result));
            });
        },

        btnDownload_click() {
            syn.uicontrols.$fileclient.fileDownload('sfcSingle');
        },

        btnDeleteItem_click() {
            syn.uicontrols.$fileclient.deleteItem('sfcSingle', syn.$l.get('txtItemID').value.trim(), function (response) {
                syn.$l.eventLog('btnDeleteItem_click', response == null ? '삭제 실패' : JSON.stringify(response));
            });
        },

        btnDeleteItems_click() {
            syn.uicontrols.$fileclient.deleteItems('sfcMulti', 'FEATURES-DOC-001', function (response) {
                syn.$l.eventLog('btnDeleteItems_click', response == null ? '삭제 실패' : JSON.stringify(response));
            });
        },

        btnTempID_click() {
            syn.$l.eventLog('btnTempID_click', syn.uicontrols.$fileclient.getTemporaryDependencyID('BOARD_'));
        },

        btnFileLength_click() {
            let lengths = [1234, 5678901, 3221225472];
            syn.$l.eventLog('btnFileLength_click', lengths.map((length) => {
                return `${length} => ${syn.uicontrols.$fileclient.toFileLengthString(length)}`;
            }).join(', '));
        }
    }
}
