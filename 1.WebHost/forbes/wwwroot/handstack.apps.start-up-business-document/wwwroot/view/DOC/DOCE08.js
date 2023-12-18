'use strict';
let $DOCE08 = {
    prop: {
        documentFormID: 'E08',
        initializeItems1: [],
        initializeItems2: []
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

                $this.method.addDataDetailItems1('교육 경험', '학교 교육', '0', '4년제 대학 졸업 이상');
                $this.method.addDataDetailItems1('교육 경험', '기타 교육', '0', '');
                $this.method.addDataDetailItems1('교육 경험', '실무 경험', '0', 'IT 분야 및 소프트웨어 개발 경험 2년 이상');
                $this.method.addDataDetailItems1('교육 경험', '자격 및 면허', '0', '');

                $this.method.addDataDetailItems1('학술적 지식', '경영학', '0', '경영학 개론, 인사관리론, 조직관리론 등');
                $this.method.addDataDetailItems1('학술적 지식', '소프트웨어 공학', '0', '기획, 분석, 설계, 개발 공정 이해');
                $this.method.addDataDetailItems1('학술적 지식', '통계학', '0', '기초적 지식');
                $this.method.addDataDetailItems1('학술적 지식', '물리학', '0', '기초적 지식');

                $this.method.addDataDetailItems1('실무 지식', '인사 제도', '0', '사내 인사관리 및 기획에 대한 경험');
                $this.method.addDataDetailItems1('실무 지식', '직무 분석', '0', '직무 분석 및 역량 모델링 경험');
                $this.method.addDataDetailItems1('실무 지식', '규정', '0', '사내 규정 설계 및 개편 경험');
                $this.method.addDataDetailItems1('실무 지식', '기타', '0', '');

                syn.uicontrols.$grid.setDataAtRow('grdDetailItems1', $this.prop.initializeItems1);

                $this.method.addDataDetailItems2('노력', '신체적', '0', '적음');
                $this.method.addDataDetailItems2('노력', '정신적', '0', '대화, 계획, 창의력에 대한 노력이 크다');

                $this.method.addDataDetailItems2('책임', '대화', '0', '업무 담당자들과의 조율이 많음');
                $this.method.addDataDetailItems2('책임', '실무', '0', '일정 및 결과 관리 필요');

                syn.uicontrols.$grid.setDataAtRow('grdDetailItems2', $this.prop.initializeItems2);
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
                    CategoryName: '',
                    ExecutionWorkName: '',
                    Unit: '',
                    Comment: ''
                },
                focusColumnID: 'CategoryName'
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
                    CategoryName: '',
                    ExecutionWorkName: '',
                    Unit: '',
                    Comment: ''
                },
                focusColumnID: 'CategoryName'
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
            var title = syn.$l.get('txtTitle').value.trim();
            var progressText = syn.$l.get('txtProgressText').value.replaceAll('\n', '<br />').trim();
            var publishName = syn.$l.get('txtPublishName').value.trim();
            var publishAddress = syn.$l.get('txtPublishAddress').value.trim();
            var publishBusiness = syn.$l.get('txtPublishBusiness').value.trim();
            var publishSector = syn.$l.get('txtPublishSector').value.trim();
            var createdAt = syn.$l.get('txtCreatedAt').value.trim();
            var creatorName = syn.$l.get('txtCreatorName').value.trim();
            var templateHtml = syn.$l.get('tplTPLE08').innerHTML;

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
                ProgressText: progressText,
                PublishName: publishName,
                PublishAddress: publishAddress,
                PublishBusiness: publishBusiness,
                PublishSector: publishSector,
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
        },

        addDataDetailItems1(categoryName, executionWorkName, required, comment) {
            var row = $this.prop.initializeItems1.length > 0 ? $this.prop.initializeItems1.length / 7 : 0;
            $this.prop.initializeItems1.push([row, 0, 'C']);
            $this.prop.initializeItems1.push([row, 1, 0]);
            $this.prop.initializeItems1.push([row, 2, syn.$l.get('txtDocumentNo').value]);
            $this.prop.initializeItems1.push([row, 3, categoryName]);
            $this.prop.initializeItems1.push([row, 4, executionWorkName]);
            $this.prop.initializeItems1.push([row, 5, required]);
            $this.prop.initializeItems1.push([row, 6, comment]);
        }
        ,

        addDataDetailItems2(categoryName, executionWorkName, required, comment) {
            var row = $this.prop.initializeItems2.length > 0 ? $this.prop.initializeItems2.length / 7 : 0;
            $this.prop.initializeItems2.push([row, 0, 'C']);
            $this.prop.initializeItems2.push([row, 1, 0]);
            $this.prop.initializeItems2.push([row, 2, syn.$l.get('txtDocumentNo').value]);
            $this.prop.initializeItems2.push([row, 3, categoryName]);
            $this.prop.initializeItems2.push([row, 4, executionWorkName]);
            $this.prop.initializeItems2.push([row, 5, required]);
            $this.prop.initializeItems2.push([row, 6, comment]);
        }
    }
};
