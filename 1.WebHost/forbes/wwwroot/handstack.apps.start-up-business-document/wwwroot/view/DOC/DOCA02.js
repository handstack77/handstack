'use strict';
let $DOCA02 = {
    prop: {
        documentFormID: 'A02',
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

                    var yearMonth = syn.$l.get('txtWorkDate').value;
                    $this.config.dataSource['MonthWeek'] = $this.method.calcMonthBetweenWeek(parseInt(yearMonth.substring(0, 4)), parseInt(yearMonth.substring(5)));
                    syn.uicontrols.$select.loadData('ddlWeek', $this.config.dataSource['MonthWeek'], true);

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
        pageInit: function () {
            var date = new Date();
            $this.config.dataSource['MonthWeek'] = $this.method.calcMonthBetweenWeek(date.getFullYear(), (date.getMonth() + 1));
        },

        async pageLoad() {
            var date = new Date();
            syn.$l.get('txtCreatedAt').value = $date.toString(date, 'd');
            syn.$l.get('txtYear').value = date.getFullYear();
            syn.$l.get('ddlMonth').value = $date.toString(date, 'm');

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
        txtYear_change() {
            var date = new Date();
            var currentYear = date.getFullYear();
            var year = syn.$l.get('txtYear').value;
            if ($string.isNullOrEmpty(year) == true || parseInt(year) < currentYear) {
                syn.$l.get('txtYear').value = currentYear.toString();
            }
            else {
                var month = syn.$l.get('ddlMonth').value;
                $this.config.dataSource['MonthWeek'] = $this.method.calcMonthBetweenWeek(currentYear, parseInt(month));
                syn.uicontrols.$select.loadData('ddlWeek', $this.config.dataSource['MonthWeek'], true);
                syn.$l.get('ddlWeek').setAttribute('size', syn.$l.get('ddlWeek').options.length);
            }
        },

        ddlMonth_change() {
            var year = syn.$l.get('txtYear').value;
            var month = syn.$l.get('ddlMonth').value;
            $this.config.dataSource['MonthWeek'] = $this.method.calcMonthBetweenWeek(parseInt(year), parseInt(month));
            syn.uicontrols.$select.loadData('ddlWeek', $this.config.dataSource['MonthWeek'], true);
            syn.$l.get('ddlWeek').setAttribute('size', syn.$l.get('ddlWeek').options.length);
        },

        btnAddDetailItems1_click() {
            var date = new Date();
            syn.uicontrols.$grid.insertRow('grdDetailItems1', {
                amount: 1,
                values: {
                    DetailNo: '0',
                    DocumentNo: syn.$l.get('txtDocumentNo').value,
                    DateName: '1주차',
                    ExecutionWorkName: '',
                    ProgressRate: '100%',
                    DeadLineDate: $date.toString(date, 'd')
                },
                focusColumnID: 'DateName'
            });
        },

        btnRemoveDetailItems1_click() {
            syn.uicontrols.$grid.removeRow('grdDetailItems1');
        },

        btnSave_click() {
            var title = syn.$l.get('txtTitle').value.trim();
            if (title == '') {
                syn.$w.alert('제목을 입력하세요');
                return false;
            }

            var nextWorkSchedule = syn.$l.get('txtNextWorkSchedule').value.trim();
            if (nextWorkSchedule == '') {
                syn.$w.alert('주요 업무 계획을 입력하세요');
                return false;
            }
            
            var year = syn.$l.get('txtYear').value.trim();
            if (year == '') {
                syn.$w.alert('업무년월 년도를 입력하세요');
                return false;
            }

            var creatorName = syn.$l.get('txtCreatorName').value.trim();
            if (creatorName == '') {
                syn.$w.alert('작성자를 입력하세요');
                return false;
            }

            syn.$l.get('txtWorkDate').value = `${syn.$l.get('txtYear').value}-${syn.$l.get('ddlMonth').value}`;

            syn.$w.transactionAction('MD01');
        },

        btnPrint_click() {
            syn.$l.get('ifmViewer').contentWindow.print();
        },

        async btnPreview_click() {
            var title = syn.$l.get('txtTitle').value.trim();
            var nextWorkSchedule = syn.$l.get('txtNextWorkSchedule').value.replaceAll('\n', '<br />').trim();
            var decisionText = syn.$l.get('htmDecisionText').value.replaceAll('\n', '<br />').trim();
            var createdAt = syn.$l.get('txtCreatedAt').value.trim();
            var creatorName = syn.$l.get('txtCreatorName').value.trim();
            var note = syn.$l.get('txtNote').value.replaceAll('\n', '<br />').trim();
            var templateHtml = syn.$l.get('tplTPLA02').innerHTML;

            var detailItems1 = JSON.parse(JSON.stringify(syn.uicontrols.$grid.getSettings('grdDetailItems1').data));
            for (var i = 0, length = detailItems1.length; i < length; i++) {
                var item = detailItems1[i];
                item.No = (i + 1).toString();
            }

            var dataSource = {
                Title: title,
                Period: `${syn.$l.get('txtYear').value}년 ${syn.$l.get('ddlMonth').value}월`,
                NextWorkSchedule: nextWorkSchedule,
                DecisionText: decisionText,
                CreatedAt: $date.toString(new Date(createdAt), 'n'),
                CreatorName: creatorName,
                Note: note,
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
        calcMonthBetweenWeek(year, month) {
            var result = {
                CodeColumnID: 'CodeID',
                ValueColumnID: 'CodeValue',
                DataSource: []
            };

            var weekOfMonths = $date.weekOfMonth(year, month);
            for (var i = 0; i < weekOfMonths.length; i++) {
                var weekOfMonth = weekOfMonths[i];
                result.DataSource.push({
                    CodeID: weekOfMonth.weekStartDate + ' ~ ' + weekOfMonth.weekEndDate,
                    CodeValue: `${(i + 1).toString()}주차 ${weekOfMonth.weekStartDate.substring(5).replace('-', '/')} ~ ${weekOfMonth.weekEndDate.substring(5).replace('-', '/')}`
                });
            }

            return result;
        },

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
