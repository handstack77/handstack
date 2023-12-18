'use strict';
let $DOCB03 = {
    prop: {
        documentFormID: 'B03',
    },

    transaction: {
        GD01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [
                { type: 'Form', dataFieldID: 'MainForm' },
                { type: 'Grid', dataFieldID: 'DetailItems1' },
                { type: 'Grid', dataFieldID: 'DetailItems2' }
            ],
            callback: (error, responseObject, addtionalData) => {
                if ($string.isNullOrEmpty(error) == true && responseObject.outputStat[0].Count > 0) {
                    syn.$l.get('txtFlag').value = 'U';
                    syn.$m.removeClass('btnDelete', 'hidden');

                    var periods = syn.$l.get('txtPeriod').value.split(' ~ ');
                    if (periods.length == 2) {
                        syn.uicontrols.$datepicker.setValue('dtpCreatedStartAt', periods[0]);
                        syn.uicontrols.$datepicker.setValue('dtpCreatedEndAt', periods[1]);
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
                { type: 'Row', dataFieldID: 'MainForm' },
                { type: 'List', dataFieldID: 'DetailItems1' },
                { type: 'List', dataFieldID: 'DetailItems2' }
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
        btnAddDetailItems1_click() {
            var date = new Date();
            syn.uicontrols.$grid.insertRow('grdDetailItems1', {
                amount: 1,
                values: {
                    DetailNo: '0',
                    DocumentNo: syn.$l.get('txtDocumentNo').value,
                    ExecutionWorkName: '',
                    KeyResult: '',
                    Work1: '',
                    Result1: '',
                    PeriodName1: '',
                    Note: ''
                },
                focusColumnID: 'ExecutionWorkName'
            });
        },

        btnRemoveDetailItems1_click() {
            syn.uicontrols.$grid.removeRow('grdDetailItems1');
        },

        btnAddDetailItems2_click() {
            var date = new Date();
            syn.uicontrols.$grid.insertRow('grdDetailItems2', {
                amount: 1,
                values: {
                    DetailNo: '0',
                    DocumentNo: syn.$l.get('txtDocumentNo').value,
                    ExecutionWorkName: '',
                    KeyResult: '',
                    Work1: '',
                    Result1: '',
                    PeriodName1: '',
                    Note: ''
                },
                focusColumnID: 'ExecutionWorkName'
            });
        },

        btnRemoveDetailItems2_click() {
            syn.uicontrols.$grid.removeRow('grdDetailItems2');
        },

        btnSave_click() {
            var title = syn.$l.get('txtTitle').value.trim();
            if (title == '') {
                syn.$w.alert('제목을 입력하세요');
                return false;
            }

            var createdStartAt = syn.$l.get('dtpCreatedStartAt').value.trim();
            if (createdStartAt == '') {
                syn.$w.alert('시작일자를 입력하세요');
                return false;
            }

            var createdEndAt = syn.$l.get('dtpCreatedEndAt').value.trim();
            if (createdEndAt == '') {
                syn.$w.alert('종료일자를 입력하세요');
                return false;
            }

            var creatorName = syn.$l.get('txtCreatorName').value.trim();
            if (creatorName == '') {
                syn.$w.alert('작성자를 입력하세요');
                return false;
            }

            syn.$l.get('txtPeriod').value = `${syn.$l.get('dtpCreatedStartAt').value} ~ ${syn.$l.get('dtpCreatedEndAt').value}`;
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
            var createdStartAt = syn.$l.get('dtpCreatedStartAt').value.trim();
            if (createdStartAt == '') {
                syn.$w.alert('시작일자를 입력하세요');
                return false;
            }

            var createdEndAt = syn.$l.get('dtpCreatedEndAt').value.trim();
            if (createdEndAt == '') {
                syn.$w.alert('종료일자를 입력하세요');
                return false;
            }

            syn.$l.get('txtPeriod').value = `${$date.toString(new Date(createdStartAt), 'n')} ~ ${$date.toString(new Date(createdEndAt), 'n') }`;
            var period = syn.$l.get('txtPeriod').value.trim();
            var title = syn.$l.get('txtTitle').value.trim();
            var note = syn.$l.get('txtNote').value.replaceAll('\n', '<br />').trim();
            var createdAt = syn.$l.get('txtCreatedAt').value.trim();
            var creatorName = syn.$l.get('txtCreatorName').value.trim();
            var templateHtml = syn.$l.get('tplTPLB03').innerHTML;

            var detailItems1 = JSON.parse(JSON.stringify(syn.uicontrols.$grid.getSettings('grdDetailItems1').data));
            for (var i = 0, length = detailItems1.length; i < length; i++) {
                var item = detailItems1[i];
                item.No = (i + 1).toString();
            }

            var detailItems2 = JSON.parse(JSON.stringify(syn.uicontrols.$grid.getSettings('grdDetailItems2').data));
            for (var i = 0, length = detailItems2.length; i < length; i++) {
                var item = detailItems2[i];
                item.No = (i + 1).toString();
            }

            var dataSource = {
                Title: title,
                Period: period,
                Note: note,
                CreatedAt: $date.toString(new Date(createdAt), 'n'),
                CreatorName: creatorName,
                Logo: '../../assets/logo.jpg',
                DetailItems1: detailItems1,
                DetailItems2: detailItems2
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
