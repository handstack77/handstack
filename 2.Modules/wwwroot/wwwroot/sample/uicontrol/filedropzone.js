'use strict';
let $filedropzone = {
    prop: {
        saved: []
    },
    event: {
        fdzMulti_ready(evt) {
            $this.method.log('ready', evt.detail.policy.RepositoryName + ', 최대 ' + evt.detail.policy.UploadCount + '개'); $this.method.show();
        },

        fdzMulti_fileAdded(evt) {
            $this.method.log('fileAdded', evt.detail.file.name);
        },

        fdzMulti_fileRejected(evt) {
            $this.method.log('fileRejected', evt.detail.file.name + ' - ' + evt.detail.reason);
        },

        fdzMulti_uploadSuccess(evt) {
            $this.method.log('uploadSuccess', evt.detail.item.FileName + ' (' + evt.detail.item.ItemID + ')');
        },

        fdzMulti_uploadError(evt) {
            $this.method.log('uploadError', evt.detail.file.name + ' - ' + evt.detail.message);
        },

        fdzMulti_fileRemoved(evt) {
            $this.method.log('fileRemoved', evt.detail.item.FileName);
        },

        fdzMulti_fileDownload(evt) {
            $this.method.log('fileDownload', evt.detail.item.FileName);
        },

        fdzMulti_queueComplete() {
            $this.method.log('queueComplete');
        },

        fdzMulti_change() {
            $this.method.show();
        },

        btnGetValue_click() {
            $this.method.show();
        },

        async btnReload_click() {
            var items = await syn.uicontrols.$filedropzone.load('fdzMulti');
            $this.method.log('load', items.length + '개');
            $this.method.show();
        },

        btnDownloadFirst_click() {
            var items = syn.uicontrols.$filedropzone.getValue('fdzMulti');
            if (items.length > 0) {
                syn.uicontrols.$filedropzone.download('fdzMulti', items[0].ItemID);
            }
        },

        btnClear_click() {
            syn.uicontrols.$filedropzone.clear('fdzMulti');
            $this.method.show();
        },

        async btnRestore_click() {
            await syn.uicontrols.$filedropzone.setValue('fdzMulti', $this.prop.saved);
            $this.method.show();
        },

        async btnRemoveAll_click() {
            $this.prop.saved = syn.uicontrols.$filedropzone.getValue('fdzMulti');
            var success = await syn.uicontrols.$filedropzone.removeAll('fdzMulti');
            $this.method.log('removeAll', success);
            $this.method.show();
        },

        btnReadOnly_click() {
            var control = syn.uicontrols.$filedropzone.getControl('fdzMulti');
            syn.uicontrols.$filedropzone.setReadOnly('fdzMulti', control.readOnly == false);
        },

        btnDisabled_click() {
            var control = syn.uicontrols.$filedropzone.getControl('fdzMulti');
            syn.uicontrols.$filedropzone.setDisabled('fdzMulti', control.disabled == false);
        }
    },
    method: {
        show() {
            document.getElementById('result').textContent = JSON.stringify(syn.uicontrols.$filedropzone.getValue('fdzMulti'), null, 2);
        },

        log(name, value) {
            var log = document.getElementById('events');
            log.textContent = (name + (value === undefined ? '' : ' ' + value) + '\n' + log.textContent).slice(0, 10000);
        }
    }
};
