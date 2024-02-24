'use strict';
let $SYS020 = {
    config: {
        actionButtons: [{
            command: 'search',
            icon: 'search',
            text: '조회',
            action(evt) {
                $this.method.search();
            }
        },
        {
            command: 'refresh',
            icon: 'refresh',
            action(evt) {
                location.reload();
            }
        }]
    },

    prop: {
        beforeRow: null
    },

    transaction: {
        LF01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [
                { type: 'Form', dataFieldID: 'Exception' },
                { type: 'Grid', dataFieldID: 'TraceLog', clear: true }
            ]
        },

        GF01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [
                { type: 'Form', dataFieldID: 'Exception' },
                { type: 'Form', dataFieldID: 'MainForm' }
            ],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($string.toBoolean($this.store.Exception.Error) == false) {
                    syn.$m.addClass('btnJsonToTable', 'hidden');

                    var message = syn.$l.get('txtMessage').value;
                    try {
                        var gridID = 'grdTraceLog';
                        var activeRow = syn.uicontrols.$grid.getActiveRowIndex(gridID);
                        var format = syn.uicontrols.$grid.getDataAtCell(gridID, activeRow, 'Format');
                        if (format == 'J' && (message.startsWith('{') == true || message.startsWith('[') == true)) {
                            var data = JSON.parse(message);
                            syn.$l.get('txtMessage').value = JSON.stringify(data, null, '\t');

                            var container = syn.$l.get('htmJsonToTable');
                            container.innerHTML = '';
                            var jsonGrid = new JSONGrid(data, container);
                            jsonGrid.render();

                            syn.$m.removeClass('btnJsonToTable', 'hidden');
                        }
                    } catch (error) {
                        syn.$l.eventLog('$this.transaction.GF01', error.message, 'Error');
                    }
                }
            }
        },
    },

    hook: {
        pageInit() {
            syn.$w.addUIButton();
        },

        pageLoad() {
            syn.$l.get('txtApplicationID').value = syn.Config.ApplicationID;

            $this.event.btnClearCondition_click();
            $this.method.search();
        },
    },

    event: {
        btnTime1_click() {
            var date = new Date();
            syn.$l.get('dtpStartedDate').value = $date.toString(date, 'd');
            syn.$l.get('dtpEndedDate').value = $date.toString(date, 'd');
            syn.$l.get('txtStartedTime').value = $date.toString($date.addHour(new Date(), -0.1), 't');
            syn.$l.get('txtEndedTime').value = '23:59:59';
        },

        btnTime2_click() {
            var date = new Date();
            syn.$l.get('dtpStartedDate').value = $date.toString(date, 'd');
            syn.$l.get('dtpEndedDate').value = $date.toString(date, 'd');
            syn.$l.get('txtStartedTime').value = $date.toString($date.addHour(new Date(), -0.5), 't');
            syn.$l.get('txtEndedTime').value = '23:59:59';
        },

        btnTime3_click() {
            var date = new Date();
            syn.$l.get('dtpStartedDate').value = $date.toString(date, 'd');
            syn.$l.get('dtpEndedDate').value = $date.toString(date, 'd');
            syn.$l.get('txtStartedTime').value = $date.toString($date.addHour(new Date(), -1), 't');
            syn.$l.get('txtEndedTime').value = '23:59:59';
        },

        btnTime4_click() {
            var date = new Date();
            syn.$l.get('dtpStartedDate').value = $date.toString(date, 'd');
            syn.$l.get('dtpEndedDate').value = $date.toString(date, 'd');
            syn.$l.get('txtStartedTime').value = '00:00:00';
            syn.$l.get('txtEndedTime').value = '23:59:59';
        },

        btnJsonToTable_click() {
            var dialogOptions = $object.clone(syn.$w.dialogOptions);
            dialogOptions.minWidth = 1280;
            dialogOptions.minHeight = 768;

            syn.$w.showDialog(syn.$l.get("tplJsonToTable"), dialogOptions);
        },

        btnClearCondition_click() {
            syn.$l.get('txtGlobalID').value = '';
            syn.$l.get('txtEnvironment').value = '';
            syn.$l.get('txtServerID').value = '';
            syn.$l.get('txtProjectID').value = '';
            syn.$l.get('txtTransactionID').value = '';
            syn.$l.get('txtServiceID').value = '';

            var date = new Date();
            syn.$l.get('dtpStartedDate').value = $date.toString(date, 'd');
            syn.$l.get('dtpEndedDate').value = $date.toString(date, 'd');
            syn.$l.get('txtStartedTime').value = $date.toString($date.addHour(new Date(), -0.1), 't');
            syn.$l.get('txtEndedTime').value = '23:59:59';
        },

        grdTraceLog_afterSelectionEnd(row, column, row2, column2) {
            var gridID = 'grdTraceLog';
            if (syn.uicontrols.$grid.getGridValue(gridID).colHeaderClick) {
                return;
            }

            if ($object.isNullOrUndefined($this.prop.beforeRow) == false && $this.prop.beforeRow == row) {
            }
            else {
                var activeRow = syn.uicontrols.$grid.getActiveRowIndex(gridID);
                var physicalRowIndex = syn.uicontrols.$grid.getPhysicalRowIndex(gridID, activeRow);
                var item = syn.uicontrols.$grid.getSourceDataAtRow(gridID, physicalRowIndex);

                var message = `- GlobalID: <b class="fg-red-500">${item.GlobalID}</b>`;

                syn.$l.get('lblRowText').innerHTML = message;
                syn.$l.get('txtLogNo').value = item.LogNo;

                $this.store.Exception.Error = '';
                syn.$w.transactionAction('GF01');
            }

            $this.prop.beforeRow = row;
        },
    },

    method: {
        search() {
            var startedDateTime = syn.$l.get('dtpStartedDate').value + ' ' + syn.$l.get('txtStartedTime').value;
            var endedDateTime = syn.$l.get('dtpEndedDate').value + ' ' + syn.$l.get('txtEndedTime').value;

            if ($date.isDate(startedDateTime) == false) {
                syn.$w.alert(`거래 시작시간이 잘못 입력되었습니다. 예) ${$date.toString(new Date(), 'd')} 00:00:00`);
                return;
            }

            if ($date.isDate(endedDateTime) == false) {
                syn.$w.alert(`거래 종료시간이 잘못 입력되었습니다. 예) ${$date.toString(new Date(), 'd')} 23:59:59`);
                return;
            }

            $this.prop.beforeRow = null;

            syn.$l.get('txtStartedAt').value = startedDateTime;
            syn.$l.get('txtEndedAt').value = endedDateTime;
            syn.$l.get('txtProperties').value = '';
            syn.$l.get('txtMessage').value = '';
            syn.$l.get('lblRowText').textContent = '';

            syn.$m.addClass('btnJsonToTable', 'hidden');

            syn.$w.transactionAction('LF01');
        },
    },
}

var DOMHelper = {
    EXPANDER_TARGET_ATTRIBUTE: 'data-target-id',
    TABLE_SHRINKED_CLASSNAME: 'shrinked',
    JSON_GRID_CONTAINER_CLASSNAME: 'json-grid-container',
    JSON_GRID_ELEMENT_CONTAINER_CLASSNAME: 'json-grid-element-container',
    createElement(type, valueType, additionalClasses, id) {
        var element = document.createElement(type);
        var classes = additionalClasses || [];
        if (!Array.isArray(classes)) classes = [classes];
        if (valueType) classes.push(valueType);
        DOMTokenList.prototype.add.apply(element.classList, classes);
        if (id) {
            element.id = id;
        }
        return element;
    },
    createExpander(dataItems, target) {
        var expander = DOMHelper.createElement('span', 'expander');
        expander.textContent = '[' + DOMHelper.getExpanderSign(target) + '] ' + dataItems + ' 건';
        expander.setAttribute(DOMHelper.EXPANDER_TARGET_ATTRIBUTE, target.id);
        expander.onclick = DOMHelper.onExpanderClick;
        return expander;
    },
    onExpanderClick(event) {
        var tableId = event.target.getAttribute(DOMHelper.EXPANDER_TARGET_ATTRIBUTE);
        var target = document.getElementById(tableId);
        if (target) {
            target.classList.toggle(DOMHelper.TABLE_SHRINKED_CLASSNAME);
            target.classList.toggle('hidden');
            event.target.textContent = '[' + DOMHelper.getExpanderSign(target) + event.target.textContent.slice(4);
        }
    },
    getExpanderSign(target) {
        return target.classList.contains(DOMHelper.TABLE_SHRINKED_CLASSNAME)
            ? '숨기기'
            : '펼치기'
            ;
    }
}

function JSONGrid(data, container) {
    this.data = data;
    this.container = container instanceof HTMLElement
        ? container
        : null;
    this.instanceNumber = JSONGrid.instances || 0;
    JSONGrid.instances = (JSONGrid.instances || 0) + 1;
}

JSONGrid.prototype.processArray = function () {
    if ($object.isArray(this.data) == true) {
        if (this.data.length > 0) {
            var row = this.data[0];
            if ($object.isObject(row) == false) {
                var newArray = [];
                for (var i = 0; i < this.data.length; i++) {
                    var rowID = '_' + i.toString();
                    var val = {};
                    val[rowID] = this.data[i];
                    newArray.push(val);
                }

                this.data = newArray;
            }
        }
    }

    var keys = this.data.reduce(function (acc, val) {


        var keys = Object.keys(val);
        return acc.concat(keys);
    }, []);
    keys = keys.filter(function (value, idx) {
        return keys.indexOf(value) === idx;
    });
    var headers = DOMHelper.createElement('tr');
    headers.appendChild(DOMHelper.createElement('th'))
    keys.forEach(function (value) {
        var td = DOMHelper.createElement('th');
        td.textContent = value.toString();
        headers.appendChild(td);
    });
    var rows = this.data.map(function (obj, index) {
        var tr = DOMHelper.createElement('tr')
        var firstTd = DOMHelper.createElement('td', typeof index);
        firstTd.appendChild(new JSONGrid(index).generateDOM());
        tr.appendChild(firstTd);
        keys.forEach(function (key, keyIdx) {
            var td = DOMHelper.createElement('td', typeof obj, 'table-wrapper');
            var value = (obj[key] === undefined || obj[key] === null)
                ? '' + obj[key]
                : obj[key]
                ;
            td.appendChild(new JSONGrid(value).generateDOM());
            tr.appendChild(td);
        });
        return tr;
    });
    return {
        headers: [headers],
        rows: rows,
    };
}
JSONGrid.prototype.processObject = function () {
    var keys = Object.keys(this.data);
    var headers = DOMHelper.createElement('tr');
    keys.forEach(function (value) {
        var td = DOMHelper.createElement('td');
        td.textContent = '' + value;
        headers.appendChild(td);
    });
    var that = this;
    var rows = keys.map(function (key, index) {
        var tr = DOMHelper.createElement('tr')
        var keyTd = DOMHelper.createElement('td', 'string', 'rowName');
        var value = that.data[key];
        var tdType = typeof value;
        var tdValue;
        if (tdType === 'object' && value) {
            var grid = new JSONGrid(value);
            tdValue = grid.generateDOM();
        } else {
            tdValue = DOMHelper.createElement('span', tdType, 'value');
            tdValue.textContent = '' + value;
        }
        var valTd = DOMHelper.createElement('td', tdType);
        keyTd.textContent = key;
        valTd.appendChild(tdValue);
        tr.appendChild(keyTd);
        tr.appendChild(valTd);
        return tr;
    });
    return {
        headers: [],
        rows: rows,
    };
}
JSONGrid.prototype.generateDOM = function () {
    var dom;
    if (Array.isArray(this.data)) {
        dom = this.processArray();
    } else if (typeof this.data === 'object') {
        dom = this.processObject();
    } else {
        var span = DOMHelper.createElement('span', typeof this.data);
        span.textContent = '' + this.data;
        return span;
    }
    var container = DOMHelper.createElement(
        'div',
        DOMHelper.JSON_GRID_ELEMENT_CONTAINER_CLASSNAME
    );
    var tableId = 'table-' + this.instanceNumber;
    var intialClasses = this.instanceNumber !== 0 ? [DOMHelper.TABLE_SHRINKED_CLASSNAME] : [];
    var table = DOMHelper.createElement('table', 'table', intialClasses, tableId);
    var tbody = DOMHelper.createElement('tbody');
    var expander = DOMHelper.createExpander(dom.rows.length, table);
    container.appendChild(expander);
    dom.headers.forEach(function (val) { tbody.appendChild(val); });
    dom.rows.forEach(function (val) { tbody.appendChild(val); });
    table.appendChild(tbody);
    container.appendChild(table);
    return container;
};
JSONGrid.prototype.render = function () {
    if (!this.container || !this.data) {
        return;
    }
    this.container.innerHTML = '';
    this.container.appendChild(this.generateDOM());
    this.container.classList.add(DOMHelper.JSON_GRID_CONTAINER_CLASSNAME);
};
window.JSONGrid = JSONGrid;
