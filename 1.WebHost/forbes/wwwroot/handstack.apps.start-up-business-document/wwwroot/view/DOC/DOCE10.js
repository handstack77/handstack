'use strict';
let $DOCE10 = {
    prop: {
        documentFormID: 'E10',
        initializeItems: []
    },

    transaction: {
        GD01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [{ type: 'Form', dataFieldID: 'MainForm' }],
            callback: (error, responseObject, addtionalData) => {
                if ($string.isNullOrEmpty(error) == true) {
                    syn.$l.get('txtFlag').value = 'U';
                }
                else {
                    syn.$w.notify('warning', `조회에 실패했습니다. 오류: ${error}`);
                }
            }
        },

        MD01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [{ type: 'Form', dataFieldID: 'MainForm' }],
            callback: (error, responseObject, addtionalData) => {
                if ($string.isNullOrEmpty(error) == true) {
                    syn.$w.notify('success', `저장 되었습니다`);
                    syn.$w.transactionAction('GD01');
                }
                else {
                    syn.$w.notify('warning', `저장에 실패했습니다. 오류: ${error}`);
                }
            }
        }
    },

    hook: {
        async pageLoad() {
            
            var date = new Date();

            syn.$l.get('txtCreatedAt').value = $date.toString(date, 'd');
            // syn.$l.get('dtpWorkDate').value = $date.toString(todayDate, 'd');

            var documentNo = syn.$r.query('documentNo');
            if ($string.isNullOrEmpty(documentNo) == false) {
                syn.$l.get('txtDocumentNo').value = documentNo;

                syn.$w.transactionAction('GD01');
            }
            else {
                syn.$l.get('txtDocumentNo').value = await syn.$w.apiHttp('/handsup/api/index/id').send();
            }
        }
    },

    event: {
        btnAddDetailItems1_click() {
            var date = new Date();
            syn.uicontrols.$grid.insertRow('grdDetailItems1', {
                amount: 1,
                values: {
                    DetailNo: '0',
                    DocumentNo: syn.$l.get('txtDocumentNo').value,
                    WorkDate: $date.toString(date, 'd'),
                    DateName: $date.toString(date, 'wn')
                },
                focusColumnID: 'WorkDate'
            });
        },

        btnRemoveDetailItems1_click() {
            syn.uicontrols.$grid.removeRow('grdDetailItems1');
        },

        btnSave_click() {
            var title = ''; // syn.$l.get('txtTitle').value.trim();
            if (title == '') {
                syn.$w.alert('제목을 입력하세요');
                return false;
            }

            var workDate = ''; // syn.$l.get('dtpWorkDate').value.trim();
            if (workDate == '') {
                syn.$w.alert('시행일을 입력하세요');
                return false;
            }

            var creatorName = syn.$l.get('txtCreatorName').value.trim();
            if (creatorName == '') {
                syn.$w.alert('작성자를 입력하세요');
                return false;
            }

            var contents = ''; // syn.uicontrols.$htmleditor.getValue('htmContents').trim();
            if (contents == '') {
                syn.$w.alert('보고 내용을 입력하세요');
                return false;
            }

            syn.$w.transactionAction('MD01');
        },

        btnPrint_click() {
            syn.$l.get('ifmViewer').contentWindow.print();
        },

        txtContents_beforeUploadImageResize(elID, blobInfo, callback) {
            syn.uicontrols.$htmleditor.resizeImage(blobInfo, 600).then(function (adjustBlob) {
                callback(adjustBlob);

                var editor = syn.uicontrols.$htmleditor.getHtmlEditor(elID);
                editor.execCommand('mceRepaint');
            });
        },

        txtContents_imageResized(elID, evt, editor, selectedImage) {
            if (evt.width > 600) {
                var ratio = (evt.width / evt.height);
                evt.width = 600;
                evt.height = parseFloat(evt.width / ratio);
            }

            tinymce.activeEditor.dom.setStyle(selectedImage, 'width', evt.width);
            tinymce.activeEditor.dom.setStyle(selectedImage, 'height', evt.height);

            selectedImage.setAttribute('width', evt.width);
            selectedImage.setAttribute('height', evt.height);
        },

        async btnPreview_click() {
            var title = ''; // syn.$l.get('txtTitle').value.trim();
            var createdAt = syn.$l.get('txtCreatedAt').value.trim();
            var workDate = ''; // syn.$l.get('dtpWorkDate').value.trim();
            var creatorName = syn.$l.get('txtCreatorName').value.trim();
            var contents = ''; // syn.uicontrols.$htmleditor.getValue('htmContents').trim();
            var templateHtml = syn.$l.get('tplTPLE10').innerHTML.trim();

            var dataSource = {
                Title: title,
                CreatedAt: $date.toString(new Date(createdAt), 'n'),
                WorkDate: workDate,
                CreatorName: creatorName,
                Logo: '../../assets/logo.jpg',
                Contents: contents,
            };

            var reportHtml = Mustache.render(templateHtml, dataSource);

            var contentBody = syn.$l.get('ifmViewer').contentDocument.body;
            contentBody.style.display = 'none';
            contentBody.innerHTML = reportHtml;
            setTimeout(() => {
                contentBody.style.display = 'block';
            }, 100);
        },
    },

    method: {
        addDataDetailItems1(categoryName, executionWorkName, level, importance, ratio) {
            var row = $this.prop.initializeItems.length > 0 ? $this.prop.initializeItems.length / 8 : 0;
            $this.prop.initializeItems.push([row, 0, 'C']);
            $this.prop.initializeItems.push([row, 1, 0]);
            $this.prop.initializeItems.push([row, 2, syn.$l.get('txtDocumentNo').value]);
            $this.prop.initializeItems.push([row, 3, categoryName]);
            $this.prop.initializeItems.push([row, 4, executionWorkName]);
            $this.prop.initializeItems.push([row, 5, level]);
            $this.prop.initializeItems.push([row, 6, importance]);
            $this.prop.initializeItems.push([row, 7, ratio]);
        },
    }
};
