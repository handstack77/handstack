'use strict';
let $DOCE09 = {
    prop: {
        documentFormID: 'E09',
        initializeItems: []
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

                $this.method.addDataDetailItems1('서버관리', '서버점검 및 백업 확인', 3, 2, 1);
                $this.method.addDataDetailItems1('서버관리', '서버 보안 패치', 3, 2, 1);
                $this.method.addDataDetailItems1('서버관리', '웹 서비스 보안 이슈 대응', 3, 2, 1);
                $this.method.addDataDetailItems1('서버관리', '서버 유지관리 및 운영', 3, 2, 1);

                $this.method.addDataDetailItems1('개발', '프로그램 유지보수 및 관리', 3, 2, 1);
                $this.method.addDataDetailItems1('개발', '서비스 업무 분석', 3, 2, 1);
                $this.method.addDataDetailItems1('개발', '업무 대응 통계자료 추출', 3, 2, 1);
                $this.method.addDataDetailItems1('개발', 'VOC 대응 및 유지보수', 3, 2, 1);
                $this.method.addDataDetailItems1('개발', '문제점 파악 및 개선안 작업', 3, 2, 1);

                $this.method.addDataDetailItems1('마케팅', '광고 업무 관리', 3, 2, 1);
                $this.method.addDataDetailItems1('마케팅', '광고 계약', 3, 2, 1);
                $this.method.addDataDetailItems1('마케팅', '광고 통계 업무 개발', 3, 2, 1);
                $this.method.addDataDetailItems1('마케팅', '데이터 수집 및 광고 효과 측정', 3, 2, 1);
                $this.method.addDataDetailItems1('마케팅', '중요 기워드 분석 및 신규 기워드 개발', 3, 2, 1);

                $this.method.addDataDetailItems1('프로세스 개선', '팀 워크를 위한 위크샵 및 면담', 3, 2, 1);
                $this.method.addDataDetailItems1('프로세스 개선', '업무 조율 및 일정 관리', 3, 2, 1);
                $this.method.addDataDetailItems1('프로세스 개선', '세미나 자료 준비 및 발표', 3, 2, 1);
                $this.method.addDataDetailItems1('프로세스 개선', '프로젝트 기획서 작성', 3, 2, 1);

                $this.method.addDataDetailItems1('인사관리', '신규 인원 채용', 3, 2, 1);
                $this.method.addDataDetailItems1('인사관리', '임직원 계정 발급 관리', 3, 2, 1);
                $this.method.addDataDetailItems1('인사관리', '직원 면담 및 고충 해결', 3, 2, 1);

                $this.method.addDataDetailItems1('기타', '시장 연구 및 개발', 3, 2, 1);
                $this.method.addDataDetailItems1('기타', '경쟁사 동향 및 시장 현황 파악', 3, 2, 1);
                $this.method.addDataDetailItems1('기타', '사내 행사 계획 및 조율', 3, 2, 1);

                syn.uicontrols.$grid.setDataAtRow('grdDetailItems1', $this.prop.initializeItems);
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
                    WorkDate: $date.toString(date, 'd'),
                    ProductName: '',
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
            var customer = syn.$l.get('txtCustomer').value.trim();
            if (customer == '') {
                syn.$w.alert('거래처명을 입력하세요');
                return false;
            }

            var publishOwnerName = syn.$l.get('txtPublishOwnerName').value.trim();
            if (publishOwnerName == '') {
                syn.$w.alert('대표자명을 입력하세요');
                return false;
            }

            var publishName = syn.$l.get('txtPublishName').value.trim();
            if (publishName == '') {
                syn.$w.alert('회사명을 입력하세요');
                return false;
            }

            var publishAddress = syn.$l.get('txtPublishAddress').value.trim();
            if (publishAddress == '') {
                syn.$w.alert('회사 주소를 입력하세요');
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
            var customer = syn.$l.get('txtCustomer').value.trim();
            var publishID = syn.$l.get('txtPublishID').value.trim();
            var publishOwnerName = syn.$l.get('txtPublishOwnerName').value.trim();
            var publishName = syn.$l.get('txtPublishName').value.trim();
            var publishPhoneNo = syn.$l.get('txtPublishPhoneNo').value.trim();
            var publishAddress = syn.$l.get('txtPublishAddress').value.trim();
            var publishBusiness = syn.$l.get('txtPublishBusiness').value.trim();
            var publishSector = syn.$l.get('txtPublishSector').value.trim();
            var createdAt = syn.$l.get('txtCreatedAt').value.trim();
            var creatorName = syn.$l.get('txtCreatorName').value.trim();
            var templateHtml = syn.$l.get('tplTPLE09').innerHTML;

            var detailItems1 = JSON.parse(JSON.stringify(syn.uicontrols.$grid.getSettings('grdDetailItems1').data));
            for (var i = 0, length = detailItems1.length; i < length; i++) {
                var item = detailItems1[i];
                item.No = (i + 1).toString();
            }

            var dataSource = {
                Customer: customer,
                PublishID: publishID,
                PublishOwnerName: publishOwnerName,
                PublishName: publishName,
                PublishPhoneNo: publishPhoneNo,
                PublishAddress: publishAddress,
                PublishBusiness: publishBusiness,
                PublishSector: publishSector,
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
        },

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
        }
    }
};
