'use strict';
let $DOCB06 = {
    prop: {
        documentFormID: 'B06',
    },

    transaction: {
        GD01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [
                { type: 'Form', dataFieldID: 'MainForm' },
                { type: 'Grid', dataFieldID: 'DetailItems1' }
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
                { type: 'List', dataFieldID: 'DetailItems1' }
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
                    ProductName: '',
                    Standard: '',
                    CategoryName: '',
                    Quantity: 0,
                    UnitPrice: 0,
                    Amount: 0,
                    Surtax: 0
                },
                focusColumnID: 'DateName'
            });
        },

        btnRemoveDetailItems1_click() {
            syn.uicontrols.$grid.removeRow('grdDetailItems1');
        },

        grdDetailItems1_afterChange(changes) {
            if (changes && changes.length > 0) {
                var change = changes[0];
                var row = change[0];
                var columnID = change[1];
                var oldValue = change[2];
                var newValue = change[3];

                oldValue = $object.isNullOrUndefined(oldValue) == true ? '' : oldValue;
                var gridID = 'grdDetailItems1';
                if (columnID == 'Quantity' && oldValue != newValue) {
                    var unitPrice = syn.uicontrols.$grid.getDataAtCell(gridID, row, 'UnitPrice');
                    if ($string.isNullOrEmpty(newValue) == true || $string.isNullOrEmpty(unitPrice) == true) {
                        syn.uicontrols.$grid.setDataAtCell(gridID, row, 'Amount', 0);
                        syn.uicontrols.$grid.setDataAtCell(gridID, row, 'Surtax', 0);
                    }
                    else {
                        var amount = newValue * unitPrice;
                        syn.uicontrols.$grid.setDataAtCell(gridID, row, 'Amount', amount);
                        syn.uicontrols.$grid.setDataAtCell(gridID, row, 'Surtax', (amount / 10).toFixed());
                    }
                }
                if (columnID == 'UnitPrice' && oldValue != newValue) {
                    var quantity = syn.uicontrols.$grid.getDataAtCell(gridID, row, 'Quantity');
                    if ($string.isNullOrEmpty(newValue) == true || $string.isNullOrEmpty(quantity) == true) {
                        syn.uicontrols.$grid.setDataAtCell(gridID, row, 'Amount', 0);
                        syn.uicontrols.$grid.setDataAtCell(gridID, row, 'Surtax', 0);
                    }
                    else {
                        var amount = newValue * quantity;
                        syn.uicontrols.$grid.setDataAtCell(gridID, row, 'Amount', amount);
                        syn.uicontrols.$grid.setDataAtCell(gridID, row, 'Surtax', (amount / 10).toFixed());
                    }
                }
                else if (columnID == 'Amount' && oldValue != newValue) {
                    if ($string.isNullOrEmpty(newValue) == true) {
                        syn.uicontrols.$grid.setDataAtCell(gridID, row, 'Surtax', 0);
                    }
                    else {
                        syn.uicontrols.$grid.setDataAtCell(gridID, row, 'Surtax', (newValue / 10).toFixed());
                    }
                }
            }
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

            syn.$l.get('txtPeriod').value = `${$date.toString(new Date(createdStartAt), 'n')} ~ ${$date.toString(new Date(createdEndAt), 'n')}`;
            var period = syn.$l.get('txtPeriod').value.trim();
            var title = syn.$l.get('txtTitle').value.trim();
            var customer = syn.$l.get('txtCustomer').value.trim();
            var departmentName = syn.$l.get('txtDepartmentName').value.trim();
            var purpose = syn.$l.get('txtPurpose').value.trim();
            var dueDate = syn.$l.get('dtpDueDate').value.trim();
            var returnDate = syn.$l.get('dtpReturnDate').value.trim();
            var note = syn.$l.get('txtNote').value.replaceAll('\n', '<br />').trim();
            var createdAt = syn.$l.get('txtCreatedAt').value.trim();
            var creatorName = syn.$l.get('txtCreatorName').value.trim();
            var templateHtml = syn.$l.get('tplTPLB06').innerHTML;

            var detailItems1 = JSON.parse(JSON.stringify(syn.uicontrols.$grid.getSettings('grdDetailItems1').data));
            for (var i = 0, length = detailItems1.length; i < length; i++) {
                var item = detailItems1[i];
                item.No = (i + 1).toString();
            }

            var dataSource = {
                Period: period,
                Customer: customer,
                Title: title,
                DepartmentName: departmentName,
                Purpose: purpose,
                DueDate: dueDate,
                ReturnDate: returnDate,
                Note: note,
                CreatedAt: $date.toString(new Date(createdAt), 'n'),
                CreatorName: creatorName,
                Logo: '../../assets/logo.jpg',
                DetailItems1: detailItems1
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
