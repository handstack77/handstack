﻿(function (context) {
    'use strict';
    var $print = context.$print || new syn.module();

    $print.extend({
        base64ExcelFile: null,
        reportName: `report-${$date.toString(new Date(), 'd')}.pdf`,
        datetimeFormat: 'yyyy-MM-dd',
        boolTrue: '○',
        boolFalse: '×',
        workItems: [],
        workActions: [],
        workData: null,
        reportifyServer: '',
        reportifyPath: '/reportify/api/brief',
        reportifyTemplateUrl: '/reportify/api/index/download-template?reportFileID=',
        pageExportScheme: 'export-scheme',
        pageExcelToPdf: 'excel-to-pdf',

        concreate() {
            if (globalRoot.devicePlatform == 'browser') {
                if ($string.toBoolean(syn.Config.IsReportifyModule) == true && !window.PDFObject) {
                    syn.$w.loadScript('/lib/pdfobject/pdfobject.min.js');
                }

                if ($string.toBoolean(syn.Config.IsReportifyModule) == true && !window.printJS) {
                    syn.$w.loadScript('/lib/print-js/print.min.js');
                }
            }
            else if (globalRoot.devicePlatform == 'node') {
                $print.reportifyServer = 'http://localhost:8421';
            }
        },

        getReportifyUrl(actionName) {
            return `${$print.reportifyServer}${$print.reportifyPath}/${actionName}`;
        },

        getDocumentTemplateUrl(reportFileID) {
            return `${$print.reportifyServer}${$print.reportifyTemplateUrl}${reportFileID}`;
        },

        formatDate(date, format) {
            const map = {
                yyyy: date.getFullYear(),
                MM: ('0' + (date.getMonth() + 1)).slice(-2),
                dd: ('0' + date.getDate()).slice(-2),
                HH: ('0' + date.getHours()).slice(-2),
                mm: ('0' + date.getMinutes()).slice(-2),
                ss: ('0' + date.getSeconds()).slice(-2)
            };
            return format.replace(/yyyy|MM|dd|HH|mm|ss/gi, matched => map[matched]);
        },

        updateOptions(options) {
            if (options) {
                if ($string.isNullOrEmpty(options.base64ExcelFile) == false) {
                    $print.base64ExcelFile = options.base64ExcelFile;
                }

                if ($string.isNullOrEmpty(options.reportName) == false) {
                    $print.reportName = options.reportName;
                }

                if ($string.isNullOrEmpty(options.datetimeFormat) == false) {
                    $print.datetimeFormat = options.datetimeFormat;
                }

                if ($string.isNullOrEmpty(options.boolTrue) == false) {
                    $print.boolTrue = options.boolTrue;
                }

                if ($string.isNullOrEmpty(options.boolFalse) == false) {
                    $print.boolFalse = options.boolFalse;
                }
            }
        },

        async generate(templateID, excelUrl) {
            var result = {
                templateID: templateID,
                reportName: $print.reportName,
                datetimeFormat: $print.datetimeFormat,
                boolTrue: $print.boolTrue,
                boolFalse: $print.boolFalse,
                workItems: $print.workItems,
                workActions: $print.workActions
            };

            if ($string.isNullOrEmpty(excelUrl) == false) {
                if ((excelUrl.startsWith('http:') == true || excelUrl.startsWith('https:') == true) == false) {
                    excelUrl = `${$print.reportifyServer}${excelUrl}`
                }
                $print.base64ExcelFile = await $print.getUrlToBase64(excelUrl);
            }

            if ($string.isNullOrEmpty($print.base64ExcelFile) == false) {
                result.base64ExcelFile = $print.base64ExcelFile;
            }

            for (var i = 0, length = result.workItems.length; i < length; i++) {
                var workitem = result.workItems[i];
                if (workitem.options && $object.isObject(workitem.options) == true) {
                    workitem.options = JSON.stringify(workitem.options);
                }
            }

            for (var i = 0, length = result.workActions.length; i < length; i++) {
                var workAction = result.workActions[i];
                if (workAction.options && $object.isObject(workAction.options) == true) {
                    workAction.options = JSON.stringify(workAction.options);
                }
            }

            return result;
        },

        addWorkItem(sourceName = 'workItems', document, worksheet, bind, row, col, type, data, overtake, step) {
            if ($object.isNumber(document) == true) {
                if (document || worksheet || bind || row || col) {
                    syn.$l.eventLog('addWorkItem', 'document, worksheet, bind, row, col 필수 항목 필요', 'Warning');
                }
                else {
                    var workItem = { document, worksheet, bind, row, col, type, data, step };
                    if (overtake) {
                        workItem.overtake = overtake;
                    }
                    $print[sourceName].push(workItem);
                }
            }
            else if ($object.isObject(document) == true) {
                var workObject = document;
                if (!workObject.document || !workObject.worksheet || !workObject.bind || !workObject.row || !workObject.col) {
                    syn.$l.eventLog('addWorkItem', 'document, worksheet, bind, row, col 필수 항목 필요', 'Warning');
                }
                else {
                    var workItem = {
                        document: workObject.document,
                        worksheet: workObject.worksheet,
                        bind: workObject.bind,
                        row: workObject.row,
                        col: workObject.col,
                        type: workObject.type,
                        data: workObject.data,
                        step: workObject.step
                    };
                    if (workObject.overtake) {
                        workItem.overtake = workObject.overtake;
                    }
                    $print[sourceName].push(workItem);
                }
            }
        },

        addAtWorkItem(sourceName = 'workItems', document, worksheet, datafield, target, nextDirection) {
            nextDirection = nextDirection || true;

            var index = $print[sourceName].findIndex(item =>
                item.document === document &&
                item.worksheet === worksheet &&
                item.datafield === datafield
            );

            if (index === -1) {
                syn.$l.eventLog('addAtWorkItem', `document: ${document}, worksheet: ${worksheet}, datafield: ${datafield} 항목 확인 필요`, 'Warning');
                return;
            }

            index = $print[sourceName].findIndex(item =>
                item.document === target.document &&
                item.worksheet === target.worksheet &&
                ($string.isNullOrEmpty(target.datafield) == false && item.datafield === target.datafield)
            );

            if (index === -1) {
                syn.$l.eventLog('addAtWorkItem', `datafield: ${target.datafield} 중복 항목 확인 필요`, 'Warning');
                return;
            }

            var newItem = {
                document: target.document,
                worksheet: target.worksheet,
                datafield: target.datafield,
                bind: target.bind,
                row: target.row,
                col: target.col,
                type: target.type,
                data: target.data,
            };

            if (target.overtake) {
                newItem.overtake = target.overtake;
            }

            if ($string.toBoolean(nextDirection) == true) {
                $print[sourceName].splice(index + 1, 0, newItem);
            } else {
                $print[sourceName].splice(index, 0, newItem);
            }
        },

        removeWorkItem(sourceName = 'workItems', document, worksheet, datafield) {
            var index = $print[sourceName].findIndex(item =>
                item.document === document &&
                item.worksheet === worksheet &&
                item.datafield === datafield
            );

            if (index > -1) {
                $print[sourceName].splice(index, 1);
            }
            else {
                syn.$l.eventLog('removeWorkItem', `document: ${document}, worksheet: ${worksheet}, datafield: ${datafield} 항목 확인 필요`, 'Warning');
            }
        },

        updateWorkItem(sourceName = 'workItems', document, worksheet, datafield, updates) {
            var item = $print[sourceName].find(item =>
                item.document === document &&
                item.worksheet === worksheet &&
                item.datafield === datafield
            );

            if (item) {
                Object.assign(item, updates);
            }
            else {
                syn.$l.eventLog('updateWorkItem', `document: ${document}, worksheet: ${worksheet}, datafield: ${datafield} 항목 확인 필요`, 'Warning');
            }
        },

        bindingWorkItems(sourceName = 'workItems', workItems, dataSource) {
            var reportWorkItems = JSON.parse(JSON.stringify(workItems));
            for (var key in dataSource) {
                var dataItem = dataSource[key];
                if (dataItem) {
                    for (var i = 0, length = reportWorkItems.length; i < length; i++) {
                        var item = reportWorkItems[i];
                        if ($object.isNullOrUndefined(item.bind) == true) {
                            item.bind = 'cell';
                        }

                        if (['cell'].includes(item.bind) == true && dataItem.hasOwnProperty(item.datafield) == true && Array.isArray(dataItem) == false) {
                            var binds = item.bind.split(':');
                            if (binds.length == 1 || (binds.length > 1 && binds[1] == key)) {
                                item.data = dataItem[item.datafield] || '';
                            }
                        }
                        else if (['item', 'list'].includes(item.bind.split(':')[0]) == true && Array.isArray(dataItem) == true) {
                            var binds = item.bind.split(':');
                            if (binds.length == 1 || (binds.length > 1 && binds[1] == key)) {
                                item.data = dataItem.map(dataItem => {
                                    return item.datafield.map(field => dataItem[field] || '');
                                });
                            }
                        }

                        item.bind = item.bind.split(':')[0];
                    }
                }
            }
            $print[sourceName] = reportWorkItems;
            return reportWorkItems;
        },

        addItem(document, worksheet, bind, row, col, type, data, overtake, step) {
            $print.addWorkItem('workItems', document, worksheet, bind, row, col, type, data, overtake, step);
        },

        addAtItem(document, worksheet, datafield, target, nextDirection) {
            $print.addAtWorkItem('workItems', document, worksheet, datafield, target, nextDirection);
        },

        removeItem(document, worksheet, datafield) {
            $print.removeWorkItem('workItems', document, worksheet, datafield);
        },

        updateItem(document, worksheet, datafield, updates) {
            $print.updateWorkItem('workItems', document, worksheet, datafield, updates);
        },

        bindingItems(workItems, dataSource) {
            $print.bindingWorkItems('workItems', workItems, dataSource);
        },

        addAction(document, worksheet, bind, row, col, type, data, overtake, step) {
            $print.addWorkItem('workActions', document, worksheet, bind, row, col, type, data, overtake, step);
        },

        addAtAction(document, worksheet, datafield, target, nextDirection) {
            $print.addAtWorkItem('workActions', document, worksheet, datafield, target, nextDirection);
        },

        removeAction(document, worksheet, datafield) {
            $print.removeWorkItem('workActions', document, worksheet, datafield);
        },

        updateAction(document, worksheet, datafield, updates) {
            $print.updateWorkItem('workActions', document, worksheet, datafield, updates);
        },

        bindingActions(workActions, dataSource) {
            $print.bindingWorkItems('workActions', workActions, dataSource);
        },

        // var workData = syn.$p.transformWorkData(data, ['DETAIL_CONTENTS', 'RESULTS']);
        transformWorkData(jsonData, keys) {
            return jsonData.map(item => {
                return keys.map(key => item[key]);
            });
        },

        // var chunkDatas = splitDataChunks(dataList, 2, 3);
        splitDataChunks(dataList, firstLength, chunkSize) {
            var result = [];

            if (firstLength > 0 && firstLength <= dataList.length) {
                result.push(dataList.slice(0, firstLength));
            }

            for (var i = firstLength, length = dataList.length; i < length; i += chunkSize) {
                result.push(dataList.slice(i, i + chunkSize));
            }

            return result;
        },

        async renderViewer(templateID, el, options) {
            el = syn.$l.getElement(el);
            if (el) {
                if (parent.syn && parent.syn.$w.progressMessage) {
                    parent.syn.$w.progressMessage();
                }

                options = syn.$w.argumentsExtend({
                    width: '100%',
                    height: '100%',
                    forcePDFJS: true,
                    PDFJS_URL: '/reportify/lib/pdfjs/web/viewer.html',
                    pdfOpenParams: {
                        navpanes: 0,
                        toolbar: 0,
                        statusbar: 0,
                        view: 'FitH'
                    },
                    fallbackLink: '<p>이 브라우저는 인라인 PDF를 지원하지 않습니다. 내용을 확인하려면 PDF를 다운로드하세요. <a href="[url]"> PDF 다운로드 </a> </ p>',
                    excelUrl: '',
                    workData: null
                }, options);

                var payLoad = await $print.generate(templateID, options.excelUrl);
                if (options.workItems != null) {
                    payLoad.workItems = options.workItems;
                }

                if (options.workActions != null) {
                    payLoad.workActions = options.workActions;
                }

                if (options.workData != null) {
                    payLoad.workData = options.workData;
                }

                var pdfResult = await syn.$r.httpRequest('POST', $print.getReportifyUrl($print.pageExcelToPdf), payLoad, null, { responseType: 'blob' });
                if (pdfResult && pdfResult.status == 200) {
                    var pdfFileUrl = syn.$r.createBlobUrl(pdfResult.response);
                    PDFObject.embed(pdfFileUrl, el, options);
                }

                if (parent.syn && parent.syn.$w.progressMessage) {
                    parent.syn.$w.closeProgress();
                }
            }
        },

        async renderPrint(templateID, options) {
            if (parent.syn && parent.syn.$w.progressMessage) {
                parent.syn.$w.progressMessage();
            }

            options = syn.$w.argumentsExtend({
                excelUrl: '',
                workData: null
            }, options);

            var payLoad = await $print.generate(templateID, options.excelUrl);
            if (options.workItems != null) {
                payLoad.workItems = options.workItems;
            }

            if (options.workActions != null) {
                payLoad.workActions = options.workActions;
            }

            if (options.workData != null) {
                payLoad.workData = options.workData;
            }

            var pdfResult = await syn.$r.httpRequest('POST', $print.getReportifyUrl($print.pageExcelToPdf), payLoad, null, { responseType: 'blob' });
            if (pdfResult && pdfResult.status == 200) {
                var pdfFileUrl = syn.$r.createBlobUrl(pdfResult.response);
                printJS(pdfFileUrl);
            }

            if (parent.syn && parent.syn.$w.progressMessage) {
                parent.syn.$w.closeProgress();
            }
        },

        async getUrlToBase64(url) {
            var result = null;
            var excelResult = await syn.$r.httpFetch(url).send();
            if (excelResult && excelResult.error) {
                return result;
            }
            result = await syn.$l.blobToBase64(excelResult, true);
            return result;
        },

        async getSchemeText(excelUrl, formatted, indent) {
            var result = '';
            var base64ExcelFile = await $print.getUrlToBase64(excelUrl);
            if (base64ExcelFile) {
                var reportifyUrl = $print.getReportifyUrl($print.pageExportScheme);
                var data = {
                    body: {
                        base64ExcelFile: base64ExcelFile,
                        indent: $string.toBoolean(indent),
                        formatted: $string.toBoolean(formatted)
                    }
                };

                var httpResult = await syn.$r.httpRequest('POST', reportifyUrl, data);
                if (httpResult && httpResult.status == 200) {
                    result = httpResult.response;
                    if (window.ClipboardJS) {
                        var tempButton = syn.$l.get('btn-clipboard-text') || document.createElement('button');
                        if (tempButton.id == '') {
                            tempButton.id = 'btn-clipboard-text';
                            tempButton.style.display = 'none';
                        }
                        tempButton.setAttribute('data-clipboard-text', result);
                        document.body.appendChild(tempButton);

                        var clipboard = new ClipboardJS(tempButton);

                        return new Promise((resolve, reject) => {
                            clipboard.on('success', (e) => {
                                clipboard.destroy();
                                document.body.removeChild(tempButton);
                                resolve(true);
                            });

                            clipboard.on('error', (e) => {
                                clipboard.destroy();
                                document.body.removeChild(tempButton);
                                reject(false);
                            });

                            tempButton.click();
                        });
                    }
                }
                else {
                    syn.$l.eventLog('getSchemeText', `작업 항목 요청 오류: ${reportifyUrl}`, 'Error');
                }
            }
            return result;
        },

        requestReportValue(moduleID, pdfOptions, transactionOptions, callback) {
            var defaultPdfOptions = {
                REPORT_ID: '',
                COMPANY_NO: '',
                DOCUMENT_FORM_ID: '',
                DOCUMENT_NO: '',
                EMPLOYEE_NO: '',
                PRINT_TYPE: '',
                ENV: 'D'
            };

            if (syn.Config && syn.Config.Environment) {
                defaultPdfOptions.ENV = syn.Config.Environment.substring(0, 1);
            }

            pdfOptions = syn.$w.argumentsExtend(defaultPdfOptions, pdfOptions);

            const directObject = {
                programID: syn.Config.ApplicationID,
                businessID: transactionOptions.businessID || syn.Config.ProjectID || 'RPT',
                transactionID: transactionOptions.transactionID || pdfOptions.REPORT_ID,
                functionID: transactionOptions.functionID || 'PD01',
                dataMapInterface: transactionOptions.dataMapInterface || 'Row|Form',
                inputObjects: Object.entries(pdfOptions).map(([key, val]) => ({ prop: key, val }))
            };

            try {
                syn.$w.transactionDirect(directObject, function (response) {
                    var result = {};
                    if (response && response.length > 0) {
                        for (var i = 0; i < response.length; i++) {
                            var item = response[i];
                            result[item.id] = item.value;
                        }
                    }
                    else {
                        syn.$l.moduleEventLog(moduleID, 'requestReportValue', '보고서 요청 오류, directObject: {0}'.format(JSON.stringify(directObject)), 'Error');
                    }

                    callback(null, result);
                });
            } catch (error) {
                callback(error, null);
            }
        }
    });

    context.$print = syn.$p = $print;

    if (globalRoot.devicePlatform === 'node') {
        delete syn.$p.renderViewer;
        delete syn.$p.renderPrint;
        delete syn.$p.getSchemeText;
    }
})(globalRoot);
