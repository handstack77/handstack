'use strict';
let $features = {
    prop: {
        keySeq: 0
    },

    event: {
        fdzMulti_ready(evt) { $this.method.log('ready', evt.detail.policy.RepositoryName + ' / 최대 ' + evt.detail.policy.UploadCount + '개, ' + evt.detail.policy.UploadSizeLimit + ' bytes'); },
        fdzMulti_fileAdded(evt) { $this.method.log('fileAdded', evt.detail.file.name); },
        // 크기/확장자/개수 초과로 업로드 전에 거부된 파일
        fdzMulti_fileRejected(evt) { $this.method.log('fileRejected', evt.detail.file.name + ' - ' + evt.detail.reason); },
        fdzMulti_uploadProgress(evt) { if (evt.detail.progress === 100) { $this.method.log('uploadProgress', evt.detail.file.name + ' 100%'); } },
        fdzMulti_uploadSuccess(evt) { $this.method.log('uploadSuccess', evt.detail.item.FileName + ' (' + evt.detail.item.ItemID + ')'); },
        fdzMulti_uploadError(evt) { $this.method.log('uploadError', evt.detail.file.name + ' - ' + evt.detail.message); },
        fdzMulti_queueComplete() { $this.method.log('queueComplete'); },
        fdzMulti_fileRemoved(evt) { $this.method.log('fileRemoved', evt.detail.item.FileName); },
        fdzMulti_fileDownload(evt) { $this.method.log('fileDownload', evt.detail.item.FileName); },
        fdzMulti_change(evt) { $this.method.log('change', evt.detail.value.length + '개'); },

        btnGetValue_click() { $this.method.logItems('getValue', syn.uicontrols.$filedropzone.getValue('fdzMulti')); },

        async btnLoad_click() { $this.method.logItems('load', await syn.uicontrols.$filedropzone.load('fdzMulti')); },

        btnUpload_click() {
            // File 객체(또는 배열)를 코드에서 직접 추가합니다. 정책(확장자/크기/개수) 검증과 업로드는 드롭과 동일합니다.
            syn.uicontrols.$filedropzone.upload('fdzMulti', new File(['코드에서 추가한 파일 ' + new Date().toISOString()], 'from-code-' + (++$this.prop.keySeq) + '.txt', { type: 'text/plain' }));
        },

        async btnDownload_click() {
            var items = syn.uicontrols.$filedropzone.getValue('fdzMulti');
            if (items.length > 0) {
                $this.method.log('download', await syn.uicontrols.$filedropzone.download('fdzMulti', items[0].ItemID));
            }
        },

        async btnRemoveItem_click() {
            var items = syn.uicontrols.$filedropzone.getValue('fdzMulti');
            if (items.length > 0) {
                $this.method.log('removeItem', await syn.uicontrols.$filedropzone.removeItem('fdzMulti', items[0].ItemID));
            }
        },

        async btnRemoveAll_click() { $this.method.log('removeAll', await syn.uicontrols.$filedropzone.removeAll('fdzMulti')); },

        btnClear_click() { syn.uicontrols.$filedropzone.clear('fdzMulti'); $this.method.log('clear', '화면 목록만 비움(서버 파일은 그대로)'); },

        async btnUpdateKey_click() {
            // 임시 키로 올린 파일을 실제 업무 키로 옮기는 저장 흐름에 사용합니다. 서버 항목의 dependencyID 가 바뀝니다.
            var target = 'EXAMPLE_FILEDROPZONE_FEATURES_MOVED_' + (++$this.prop.keySeq);
            var success = await syn.uicontrols.$filedropzone.updateDependencyID('fdzMulti', target);
            $this.method.log('updateDependencyID', success + ', 현재 키: ' + syn.uicontrols.$filedropzone.getDependencyID('fdzMulti'));
        },

        btnReadOnly_click() {
            var control = syn.uicontrols.$filedropzone.getControl('fdzMulti');
            syn.uicontrols.$filedropzone.setReadOnly('fdzMulti', control.readOnly == false);
            $this.method.log('setReadOnly', control.readOnly);
        },

        btnDisabled_click() {
            var control = syn.uicontrols.$filedropzone.getControl('fdzMulti');
            syn.uicontrols.$filedropzone.setDisabled('fdzMulti', control.disabled == false);
            $this.method.log('setDisabled', control.disabled);
        },

        btnDestroy_click() {
            syn.uicontrols.$filedropzone.destroy('fdzOptions');
            $this.method.log('destroy', syn.uicontrols.$filedropzone.getControl('fdzOptions') == null);
        }
    },

    method: {
        logItems(name, items) {
            $this.method.log(name, items.length + '개: ' + items.map(function (item) { return item.FileName; }).join(', '));
        },

        log(name, value) {
            var log = syn.$l.get('preLog');
            log.textContent = (name + (value === undefined ? '' : ' ' + value) + '\n' + log.textContent).slice(0, 8000);
        }
    }
}
