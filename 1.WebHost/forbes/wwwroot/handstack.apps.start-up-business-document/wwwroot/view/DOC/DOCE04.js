'use strict';
let $DOCE04 = {
    prop: {
        documentFormID: 'E04',
    },

    transaction: {
        GD01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [
                { type: 'Form', dataFieldID: 'MainForm' }
            ],
            callback: (error, responseObject, addtionalData) => {
                if ($string.isNullOrEmpty(error) == true && responseObject.outputStat[0].Count > 0) {
                    syn.$l.get('txtFlag').value = 'U';
                    syn.$m.removeClass('btnDelete', 'hidden');

                    var periods = syn.$l.get('txtPeriod').value.split(' ');
                    if (periods.length == 2) {
                        syn.uicontrols.$datepicker.setValue('dtpStartDate', periods[0]);
                        syn.$l.get('txtStartTime').value = periods[1];
                    }

                    $this.method.mergeTagsItem();
                }
                else {
                    if (responseObject.outputStat[0].Count == 0) {
                        var alertOptions = $object.clone(syn.$w.alertOptions);
                        alertOptions.icon = 'error';
                        alertOptions.buttonType = '1';
                        syn.$w.alert('조회에 실패했습니다. 데이터 확인이 필요합니다', '데이터 확인 필요', alertOptions, function (result) {
                            location.href = location.pathname;
                        });
                    }
                    else {
                        syn.$w.notify('warning', `조회에 실패했습니다. 오류: ${error}`);
                    }
                }
            }
        },

        MD01: {
            inputs: [
                { type: 'Row', dataFieldID: 'MainForm' }
            ],
            outputs: [
                { type: 'Form', dataFieldID: 'MainForm' }
            ],
            callback: (error, responseObject, addtionalData) => {
                if ($string.isNullOrEmpty(error) == true) {
                    syn.$w.notify('success', `저장 되었습니다`);
                    history.pushState(null, null, `?documentNo=${syn.$l.get('txtDocumentNo').value}`);
                    syn.$w.transactionAction('GD01');
                }
                else {
                    syn.$w.notify('warning', `저장에 실패했습니다. 오류: ${error}`);
                }
            }
        },

        DD01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [],
            callback: (error, responseObject, addtionalData) => {
                if ($string.isNullOrEmpty(error) == true) {
                    var alertOptions = $object.clone(syn.$w.alertOptions);
                    alertOptions.icon = 'success';
                    alertOptions.buttonType = '1';
                    syn.$w.alert('삭제 되었습니다', '삭제 완료', alertOptions, function (result) {
                        location.href = location.pathname;
                    });
                }
                else {
                    syn.$w.notify('warning', `삭제에 실패했습니다. 오류: ${error}`);
                }
            }
        }
    },

    hook: {
        async pageLoad() {
            var date = new Date();
            syn.$l.get('txtCreatedAt').value = $date.toString(date, 'd');

            var documentNo = syn.$r.query('documentNo');
            if ($string.isNullOrEmpty(documentNo) == false) {
                syn.$l.get('txtDocumentNo').value = documentNo;

                syn.$w.transactionAction('GD01');
            }
            else {
                syn.$l.get('txtDocumentNo').value = await syn.$w.apiHttp('/handsup/api/index/id').send();
            }
        },
    },

    event: {
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

        btnSave_click() {
            var title = syn.$l.get('txtTitle').value.trim();
            if (title == '') {
                syn.$w.alert('제목을 입력하세요');
                return false;
            }

            var creatorName = syn.$l.get('txtCreatorName').value.trim();
            if (creatorName == '') {
                syn.$w.alert('작성자를 입력하세요');
                return false;
            }

            syn.$l.get('txtPeriod').value = `${syn.$l.get('dtpStartDate').value} ${syn.$l.get('txtStartTime').value}`;
            syn.$w.transactionAction('MD01');
        },

        btnDelete_click() {
            var alertOptions = $object.clone(syn.$w.alertOptions);
            alertOptions.icon = 'question';
            alertOptions.buttonType = '3';
            syn.$w.alert('정말로 삭제하시겠습니까?', '삭제 확인', alertOptions, function (result) {
                if (result == 'Yes') {
                    syn.$w.transactionAction('DD01');
                }
            });
        },

        btnPrint_click() {
            syn.$l.get('ifmViewer').contentWindow.print();
        },

        btnPreview_click() {
            syn.$l.get('txtPeriod').value = `${syn.$l.get('dtpStartDate').value} ${syn.$l.get('txtStartTime').value}`;

            var title = syn.$l.get('txtTitle').value.trim();
            var period = syn.$l.get('txtPeriod').value.trim();
            var progressText = syn.$l.get('txtProgressText').value.replaceAll('\n', '<br />').trim();
            var decisionText = syn.$l.get('htmDecisionText').value.replaceAll('\n', '<br />').trim();
            var nextWorkSchedule = syn.$l.get('txtNextWorkSchedule').value.replaceAll('\n', '<br />').trim();
            var contents = syn.uicontrols.$htmleditor.getValue('htmContents').trim();
            var createdAt = syn.$l.get('txtCreatedAt').value.trim();
            var creatorName = syn.$l.get('txtCreatorName').value.trim();
            var templateHtml = syn.$l.get('tplTPLE04').innerHTML;

            var dataSource = {
                Title: title,
                Period: period,
                ProgressText: progressText,
                DecisionText: decisionText,
                NextWorkSchedule: nextWorkSchedule,
                Contents: contents,
                CreatedAt: $date.toString(new Date(createdAt), 'n'),
                CreatorName: creatorName,
                Logo: '../../assets/logo.jpg'
            };

            var reportHtml = Mustache.render(templateHtml, dataSource);

            var contentBody = syn.$l.get('ifmViewer').contentDocument.body;
            contentBody.style.display = 'none';
            contentBody.innerHTML = reportHtml;
            setTimeout(() => {
                contentBody.style.display = 'block';
            }, 100);
        },

        lblTagsItem_click(el, projectID) {
            var projects = syn.$l.get('txtTags').value.split(',');
            projects.splice(projects.indexOf(projectID), 1);
            syn.$l.get('txtTags').value = projects.filter(item => item !== '').sort().join(',');
            $this.method.updateTagsItem(syn.$l.get('txtTags').value);
        },

        txtTagsAppender_keypress(evt) {
            if (evt.key == 'Enter') {
                $this.method.mergeTagsItem();
            }
        },

        btnTagsAppender_click(evt) {
            $this.method.mergeTagsItem();
        }
    },

    method: {
        mergeTagsItem() {
            var sourceTagss = syn.$l.get('txtTagsAppender').value.replaceAll(' ', '').split(',').filter(item => item !== '');
            var targetTagss = syn.$l.get('txtTags').value.replaceAll(' ', '').split(',').filter(item => item !== '');

            var projects = sourceTagss.concat(targetTagss);
            syn.$l.get('txtTags').value = [...new Set(projects)].sort().join(',');
            $this.method.updateTagsItem(syn.$l.get('txtTags').value);

            syn.$l.get('txtTagsAppender').value = '';
        },

        updateTagsItem(projectID) {
            var projectItems = [];
            var projects = projectID.split(',');
            for (var i = 0, length = projects.length; i < length; i++) {
                var project = projects[i].trim();
                if ($string.isNullOrEmpty(project) == false) {
                    projectItems.push(project);
                }
            }

            var dataSource = {
                items: projectItems
            };

            $this.method.drawHtmlTemplate('lstTags', 'tplTagsItem', dataSource);

            if (projectItems.length > 0) {
                syn.$m.removeClass(syn.$l.get('lstTags').parentElement, 'hidden');
            }
            else {
                syn.$m.addClass(syn.$l.get('lstTags').parentElement, 'hidden');
            }

            syn.$w.setTabContentHeight();
        },

        drawHtmlTemplate(elID, templateID, dataSource, prefixHtml) {
            prefixHtml = prefixHtml || '';
            var drawEl = syn.$l.get(elID);
            var tplEL = syn.$l.get(templateID);

            try {
                drawEl.innerHTML = '';
                var templateHtml = tplEL.innerHTML;
                drawEl.innerHTML = prefixHtml + Mustache.render(templateHtml, dataSource);
            } catch (error) {
                syn.$l.eventLog('$this.method.drawHtmlTemplate', error.message, 'Error');
            }
        }
    }
};
