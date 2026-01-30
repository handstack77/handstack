(function (context) {
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
        overwriteFontName: null,

        concreate() {
            if (globalRoot.devicePlatform == 'browser') {
                if ($string.toBoolean(syn.Config.IsReportifyModule) == true && !window.PDFObject) {
                    if (syn.Config && $string.isNullOrEmpty(syn.Config.ProxyPathName) == false) {
                        syn.$w.loadScript(`${syn.$w.proxyBasePath}/lib/pdfobject/pdfobject.min.js`);
                    }
                    else {
                        syn.$w.loadScript('/lib/pdfobject/pdfobject.min.js');
                    }
                }

                if ($string.toBoolean(syn.Config.IsReportifyModule) == true && !window.printJS) {
                    if (syn.Config && $string.isNullOrEmpty(syn.Config.ProxyPathName) == false) {
                        syn.$w.loadScript(`${syn.$w.proxyBasePath}/lib/print-js/print.min.js`);
                    }
                    else {
                        syn.$w.loadScript('/lib/print-js/print.min.js');
                    }
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

        async generate(templateID, excelUrl) {
            var result = {
                templateID: templateID,
                reportName: $print.reportName,
                datetimeFormat: $print.datetimeFormat,
                boolTrue: $print.boolTrue,
                boolFalse: $print.boolFalse,
                workItems: $print.workItems,
                workActions: $print.workActions,
                overwriteFontName: $print.overwriteFontName
            };

            if ($string.isNullOrEmpty(excelUrl) == false) {
                if ((excelUrl.startsWith('http:') == true || excelUrl.startsWith('https:') == true) == false) {
                    excelUrl = `${$print.reportifyServer}${excelUrl}`
                }
                $print.base64ExcelFile = await syn.$l.urlToBase64(excelUrl);
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

        addWorkItem(workItems, document, worksheet, datafield, bind, row, col, type, data, overtake, step) {
            if ($object.isNumber(document) == true) {
                if (document || worksheet || bind || row || col) {
                    syn.$l.eventLog('addWorkItem', 'document, worksheet, datafield, bind, row, col 필수 항목 필요', 'Warning');
                }
                else {
                    var workItem = { document, worksheet, datafield, bind, row, col, type, data, step };
                    if (overtake) {
                        workItem.overtake = overtake;
                    }
                    workItems.push(workItem);
                }
            }
            else if ($object.isObject(document) == true) {
                var workObject = document;
                if (!workObject.document || !workObject.worksheet || !workObject.bind || !workObject.row || !workObject.col) {
                    syn.$l.eventLog('addWorkItem', 'document, worksheet, datafield, bind, row, col 필수 항목 필요', 'Warning');
                }
                else {
                    var workItem = {
                        document: workObject.document,
                        worksheet: workObject.worksheet,
                        datafield: workObject.datafield,
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
                    workItems.push(workItem);
                }
            }
        },

        addAtWorkItem(workItems, document, worksheet, datafield, target, nextDirection) {
            nextDirection = nextDirection || true;

            var index = workItems.findIndex(item =>
                item.document === document &&
                item.worksheet === worksheet &&
                item.datafield === datafield
            );

            if (index === -1) {
                syn.$l.eventLog('addAtWorkItem', `document: ${document}, worksheet: ${worksheet}, datafield: ${datafield} 항목 확인 필요`, 'Warning');
                return;
            }

            index = workItems.findIndex(item =>
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
                workItems.splice(index + 1, 0, newItem);
            } else {
                workItems.splice(index, 0, newItem);
            }
        },

        removeWorkItem(workItems, document, worksheet, datafield) {
            var index = workItems.findIndex(item =>
                item.document === document &&
                item.worksheet === worksheet &&
                item.datafield === datafield
            );

            if (index > -1) {
                workItems.splice(index, 1);
            }
            else {
                syn.$l.eventLog('removeWorkItem', `document: ${document}, worksheet: ${worksheet}, datafield: ${datafield} 항목 확인 필요`, 'Warning');
            }
        },

        updateWorkItem(workItems, document, worksheet, datafield, updates) {
            var item = workItems.find(item =>
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

        calculateOffsets(totalCount, step) {
            const offsets = [];
            let i = 0;
            for (i = 0; i < totalCount; i += step) {
                offsets.push(i);
            }
            return offsets;
        },

        bindingWorkItems(workItems, dataSource, documentOffset) {
            var reportWorkItems = JSON.parse(JSON.stringify(workItems));
            for (var key in dataSource) {
                var dataItem = dataSource[key];
                if (dataItem) {
                    for (var i = 0, length = reportWorkItems.length; i < length; i++) {
                        var item = reportWorkItems[i];

                        if (documentOffset && $object.isNumber(documentOffset) == true && documentOffset > -1) {
                            item.document = documentOffset;
                        }

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

            return reportWorkItems;
        },

        // let workData = syn.$p.transformWorkData(data, ['DETAIL_CONTENTS', 'RESULTS']);
        transformWorkData(jsonData, keys) {
            return jsonData.map(item => {
                return keys.map(key => item[key]);
            });
        },

        // let formData = syn.$p.transformFormData(data, 1);
        transformFormData(jsonData, offset, padding, defaultKeys) {
            const result = {};
            offset = offset || 1;
            padding = padding || 0;

            let keys = [];
            const defaultValues = {};

            if (typeof defaultKeys === 'string') {
                keys = defaultKeys.split(',').map(key => {
                    const trimmedKey = key.trim();
                    if (trimmedKey.includes(':')) {
                        const [keyName, defaultValue] = trimmedKey.split(':').map(part => part.trim());
                        defaultValues[keyName] = defaultValue;
                        return keyName;
                    } else {
                        defaultValues[trimmedKey] = '';
                        return trimmedKey;
                    }
                });
            } else if (Array.isArray(defaultKeys)) {
                keys = defaultKeys.map(key => {
                    if (typeof key === 'string' && key.includes(':')) {
                        const [keyName, defaultValue] = key.split(':').map(part => part.trim());
                        defaultValues[keyName] = defaultValue;
                        return keyName;
                    } else {
                        const keyName = typeof key === 'string' ? key : String(key);
                        defaultValues[keyName] = '';
                        return keyName;
                    }
                });
            }

            if (jsonData.length > 0) {
                const dataKeys = Object.keys(jsonData[0]);
                dataKeys.forEach(key => {
                    if (!defaultValues.hasOwnProperty(key)) {
                        defaultValues[key] = '';
                    }
                });
                keys = [...new Set([...keys, ...dataKeys])];
            }

            jsonData.forEach((item, index) => {
                const suffix = offset + index;
                keys.forEach(key => {
                    if (item.hasOwnProperty(key)) {
                        result[key + suffix] = item[key];
                    } else {
                        result[key + suffix] = defaultValues[key] || '';
                    }
                });
            });

            if (padding > jsonData.length) {
                for (let i = jsonData.length; i < padding; i++) {
                    const suffix = offset + i;

                    keys.forEach(key => {
                        result[key + suffix] = defaultValues[key] || '';
                    });
                }
            }

            return result;
        },

        // let chunkDatas = syn.$p.splitDataChunks(dataList, 2, 3);
        splitDataChunks(dataList, firstLength, chunkSize) {
            var result = [];
            chunkSize = chunkSize || firstLength;
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

        async getSchemeText(excelUrl, formatted, indent) {
            var result = '';
            var base64ExcelFile = await syn.$l.urlToBase64(excelUrl);
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
                        clipboard.on('success', (error) => {
                            clipboard.destroy();
                            document.body.removeChild(tempButton);
                        });

                        tempButton.click();
                    }
                    else {
                        await syn.$w.copyToClipboard(textToCopy);
                    }
                }
                else {
                    syn.$l.eventLog('getSchemeText', `작업 항목 요청 오류: ${reportifyUrl}`, 'Error');
                }
            }
            return result;
        }
    });

    context.$print = syn.$p = $print;

    if (globalRoot.devicePlatform === 'node') {
        delete syn.$p.renderViewer;
        delete syn.$p.renderPrint;
        delete syn.$p.getSchemeText;
    }
})(globalRoot);
