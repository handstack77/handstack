'use strict';
let $files = {
    event: {
        btnProfile1FileGetValue_click() {
            syn.$l.eventLog('btnProfile1FileGetValue_click', JSON.stringify(syn.uicontrols.$fileclient.getValue('txtProfile1FileID')));
        },

        btnProfile1FileSetValue_click() {
            syn.uicontrols.$fileclient.setValue('txtProfile1FileID', 'e9259ffe12534c83957906bdb2ff7d6b');
        },

        btnProfile1FileClear_click() {
            syn.uicontrols.$fileclient.clear('txtProfile1FileID');
        },

        btnProfile1FileUpload_click() {
            var uploadOptions = syn.uicontrols.$fileclient.getFileSetting('txtProfile1FileID');
            uploadOptions.fileUpdateCallback = 'fleProfile1File_Callback';
            uploadOptions.dependencyID = syn.$l.get('txtProfile1DependencyID').value != '' ? syn.$l.get('txtProfile1DependencyID').value : syn.uicontrols.$fileclient.getTemporaryDependencyID('txtProfile1DependencyID');
            uploadOptions.minHeight = 386;
            uploadOptions.profileFileName = '{0}_{1}'.format(syn.$w.Variable.ApplicationID, syn.$w.Variable.ApplicationNo);

            syn.uicontrols.$fileclient.uploadUI(uploadOptions);
        },

        btnProfile1FileDownload_click() {
            syn.uicontrols.$fileclient.fileDownload('txtProfile1FileID');
        },

        fleProfile1File_Callback(action, result) {
            syn.$l.eventLog('btnProfile1GetItem_click', action + ', ' + JSON.stringify(result));
        },

        btnProfile1GetItem_click() {
            syn.uicontrols.$fileclient.getItem('txtProfile1FileID', syn.$l.get('txtProfile1FileID').value, function (result) {
                syn.$l.eventLog('btnProfile1GetItem_click', JSON.stringify(result));
            });
        },

        btnProfile1DeleteItem_click() {
            syn.uicontrols.$fileclient.deleteItem('txtProfile1FileID', syn.$l.get('txtProfile1FileID').value, function (result) {
                syn.$l.eventLog('btnProfile1DeleteItem_click', JSON.stringify(result));
            });
        },

        btnProfile1UpdateDependencyID_click() {
            syn.uicontrols.$fileclient.updateDependencyID('txtProfile1FileID', syn.$l.get('txtProfile1DependencyID').value, 'targetDependencyID', function (result) {
                syn.$l.eventLog('btnProfile1UpdateDependencyID_click', JSON.stringify(result));
            });
        },

        btnProfile1UpdateFileName_click() {
            syn.uicontrols.$fileclient.updateFileName('txtProfile1FileID', '10_12345', '1950_yn1950', function (result) {
                syn.$l.eventLog('btnProfile1UpdateFileName_click', JSON.stringify(result));
            });
        },

        btnSingleFileGetValue_click() {
            syn.$l.eventLog('btnSingleFileGetValue_click', JSON.stringify(syn.uicontrols.$fileclient.getValue('txtSingleFileID')));
        },

        btnSingleFileSetValue_click() {
            syn.uicontrols.$fileclient.setValue('txtSingleFileID', 'e9259ffe12534c83957906bdb2ff7d6b');
        },

        btnSingleFileClear_click() {
            syn.uicontrols.$fileclient.clear('txtSingleFileID');
        },

        btnSingleFileUpload_click() {
            var uploadOptions = syn.uicontrols.$fileclient.getFileSetting('txtSingleFileID');
            uploadOptions.fileUpdateCallback = 'fleSingleFile_Callback';
            uploadOptions.dependencyID = syn.$l.get('txtSingleDependencyID').value != '' ? syn.$l.get('txtSingleDependencyID').value : syn.uicontrols.$fileclient.getTemporaryDependencyID('txtSingleDependencyID');
            uploadOptions.minHeight = 360;

            syn.uicontrols.$fileclient.uploadUI(uploadOptions);
        },

        btnSingleFileDownload_click() {
            syn.uicontrols.$fileclient.fileDownload('txtSingleFileID');
        },

        fleSingleFile_Callback(action, result) {
            syn.$l.eventLog('btnSingleGetItem_click', action + ', ' + JSON.stringify(result));
        },

        btnSingleGetItem_click() {
            syn.uicontrols.$fileclient.getItem('txtSingleFileID', syn.$l.get('txtSingleFileID').value, function (result) {
                syn.$l.eventLog('btnSingleGetItem_click', JSON.stringify(result));
            });
        },

        btnSingleDeleteItem_click() {
            syn.uicontrols.$fileclient.deleteItem('txtSingleFileID', syn.$l.get('txtSingleFileID').value, function (result) {
                syn.$l.eventLog('btnSingleDeleteItem_click', JSON.stringify(result));
            });
        },

        btnSingleUpdateDependencyID_click() {
            syn.uicontrols.$fileclient.updateDependencyID('txtSingleFileID', syn.$l.get('txtSingleDependencyID').value, 'targetDependencyID', function (result) {
                syn.$l.eventLog('btnSingleUpdateDependencyID_click', JSON.stringify(result));
            });
        },

        btnMultiFileGetValue_click() {
            syn.$l.eventLog('btnMultiFileGetValue_click', JSON.stringify(syn.uicontrols.$fileclient.getValue('txtMultiFileID')));
        },

        btnMultiFileSetValue_click() {
            syn.uicontrols.$fileclient.setValue('txtMultiFileID', 'e9259ffe12534c83957906bdb2ff7d6b');
        },

        btnMultiFileClear_click() {
            syn.uicontrols.$fileclient.clear('txtMultiFileID');
        },

        btnMultiFileUpload_click() {
            var uploadOptions = syn.uicontrols.$fileclient.getFileSetting('txtMultiFileID');
            uploadOptions.fileUpdateCallback = 'fleMultiFile_Callback';
            uploadOptions.dependencyID = syn.$l.get('txtMultiDependencyID').value != '' ? syn.$l.get('txtMultiDependencyID').value : syn.uicontrols.$fileclient.getTemporaryDependencyID('txtMultiDependencyID');
            uploadOptions.minHeight = 360;

            syn.uicontrols.$fileclient.uploadUI(uploadOptions);
        },

        btnMultiFileDownload_click() {
            const itemID = syn.$l.get('txtMultiItemID').value;
            const setting = syn.uicontrols.$fileclient.getFileSetting('txtMultiFileID');
            let options = {
                repositoryID: setting.repositoryID,
                itemID: itemID,
                fileMD5: '',
                tokenID: setting.tokenID,
                applicationID: syn.uicontrols.$fileclient.applicationID,
                businessID: syn.uicontrols.$fileclient.businessID
            };

            syn.uicontrols.$fileclient.fileDownload(options);
        },

        fleMultiFile_Callback(action, result) {
            syn.$l.eventLog('btnMultiGetItem_click', action + ', ' + JSON.stringify(result));
        },

        btnMultiGetItem_click() {
            syn.uicontrols.$fileclient.getItem('txtMultiFileID', syn.$l.get('txtMultiItemID').value, function (result) {
                syn.$l.eventLog('btnMultiGetItem_click', JSON.stringify(result));
            });
        },

        btnMultiGetItems_click() {
            syn.uicontrols.$fileclient.getItems('txtMultiFileID', syn.$l.get('txtMultiDependencyID').value, function (result) {
                syn.$l.eventLog('btnMultiGetItem_click', JSON.stringify(result));
            });
        },

        btnMultiDeleteItem_click() {
            syn.uicontrols.$fileclient.deleteItem('txtMultiFileID', syn.$l.get('txtMultiItemID').value, function (result) {
                syn.$l.eventLog('btnMultiDeleteItem_click', JSON.stringify(result));
            });
        },

        btnMultiDeleteItems_click() {
            syn.uicontrols.$fileclient.deleteItems('txtMultiFileID', syn.$l.get('txtMultiDependencyID').value, function (result) {
                syn.$l.eventLog('btnMultiDeleteItems_click', JSON.stringify(result));
            });
        },

        btnMultiUpdateDependencyID_click() {
            syn.uicontrols.$fileclient.updateDependencyID('txtMultiFileID', syn.$l.get('txtMultiDependencyID').value, 'targetDependencyID', function (result) {
                syn.$l.eventLog('btnMultiUpdateDependencyID_click', JSON.stringify(result));
            });
        },

        btnImageLinkFileGetValue_click() {
            syn.$l.eventLog('btnImageLinkFileGetValue_click', JSON.stringify(syn.uicontrols.$fileclient.getValue('txtImageLinkFileID')));
        },

        btnImageLinkFileSetValue_click() {
            syn.uicontrols.$fileclient.setValue('txtImageLinkFileID', 'e9259ffe12534c83957906bdb2ff7d6b');
        },

        btnImageLinkFileClear_click() {
            syn.uicontrols.$fileclient.clear('txtImageLinkFileID');
        },

        btnImageLinkFileUpload_click() {
            var uploadOptions = syn.uicontrols.$fileclient.getFileSetting('txtImageLinkFileID');
            uploadOptions.fileUpdateCallback = '$this.method.fleImageLinkFileCallback';
            uploadOptions.dependencyID = syn.$l.get('txtImageLinkDependencyID').value != '' ? syn.$l.get('txtImageLinkDependencyID').value : syn.uicontrols.$fileclient.getTemporaryDependencyID('txtImageLinkDependencyID');
            uploadOptions.minHeight = 360;

            syn.uicontrols.$fileclient.uploadUI(uploadOptions);
        },

        btnImageLinkFileDownload_click() {
            syn.uicontrols.$fileclient.fileDownload('txtImageLinkFileID');
        },

        btnImageLinkGetItem_click() {
            syn.uicontrols.$fileclient.getItem('txtImageLinkFileID', syn.$l.get('txtImageLinkItemID').value, function (result) {
                syn.$l.eventLog('btnImageLinkGetItem_click', JSON.stringify(result));
            });
        },

        btnImageLinkGetItems_click() {
            syn.uicontrols.$fileclient.getItems('txtImageLinkFileID', syn.$l.get('txtImageLinkDependencyID').value, function (result) {
                syn.$l.eventLog('btnImageLinkGetItem_click', JSON.stringify(result));
            });
        },

        btnImageLinkDeleteItem_click() {
            syn.uicontrols.$fileclient.deleteItem('txtImageLinkFileID', syn.$l.get('txtImageLinkItemID').value, function (result) {
                syn.$l.eventLog('btnImageLinkDeleteItem_click', JSON.stringify(result));
            });
        },

        btnImageLinkDeleteItems_click() {
            syn.uicontrols.$fileclient.deleteItems('txtImageLinkFileID', syn.$l.get('txtImageLinkDependencyID').value, function (result) {
                syn.$l.eventLog('btnImageLinkDeleteItems_click', JSON.stringify(result));
            });
        },

        btnImageLinkUpdateDependencyID_click() {
            syn.uicontrols.$fileclient.updateDependencyID('txtImageLinkFileID', syn.$l.get('txtImageLinkDependencyID').value, 'targetDependencyID', function (result) {
                syn.$l.eventLog('btnImageLinkUpdateDependencyID_click', JSON.stringify(result));
            });
        }
    },

    method: {
        fleImageLinkFileCallback(action, result) {
            syn.$l.eventLog('btnImageLinkGetItem_click', action + ', ' + JSON.stringify(result));
        }
    }
}
