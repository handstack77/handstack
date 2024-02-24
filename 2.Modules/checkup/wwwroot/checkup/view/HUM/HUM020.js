'use strict';
let $HUM020 = {
    config: {
        actionButtons: [{
            command: 'search',
            icon: 'search',
            text: '조회',
            action(evt) {
                syn.$l.get('ifmUILibrary').contentWindow.location.reload();
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
        className: 'directory'
    },

    hook: {
        pageInit() {
            syn.$w.addUIButton();
        },

        pageLoad() {
            syn.$l.addEvent('ifmUILibrary', 'load', (evt) => {
                if ($string.isNullOrEmpty(evt.target.contentDocument.body.textContent) == true) {
                    syn.$l.get('ifmUILibrary').contentWindow.history.back();
                    return;
                }

                $this.method.updateProjectItems();
            });

            $this.method.updateProjectItems();
        },
    },

    event: {
        btnUpDirectory_click() {
            var pathName = syn.$l.get('lblPathName').textContent;
            if (pathName && pathName != '/' && pathName != '/lib/') {
                var paths = pathName.split('/');
                paths.splice(paths.length - 2, 1);
                pathName = paths.join('/');
                syn.$l.get('ifmUILibrary').src = pathName;
            }
        },

        lblProjectItem_click(evt, className, name) {
            $this.prop.className = className;
            var pathName = syn.$l.get('ifmUILibrary').contentWindow.location.pathname;
            pathName = pathName == '/lib' ? '/lib/' : pathName;
            if ($this.prop.className == 'file') {
                syn.$l.get('ifmPreview').src = pathName + name;
                syn.$l.get('lblPreviewName').textContent = pathName + name;
            }
            else {
                syn.$l.get('ifmUILibrary').src = pathName + name;
            }
        }
    },

    method: {
        updateProjectItems() {
            var pathName = syn.$l.get('ifmUILibrary').contentWindow.location.pathname;
            syn.$l.get('lblPathName').textContent = pathName == '/lib' ? '/lib/' : pathName;
            var table = syn.$l.get('ifmUILibrary').contentDocument.querySelector('table');
            var projectItems = $this.method.tableToJson(table);

            var dataSource = {
                items: projectItems
            };

            $this.method.drawHtmlTemplate('lstProject', 'tplProjectItem', dataSource);
        },

        tableToJson(table) {
            var data = [];

            var headers = [];
            for (var i = 0; i < table.rows[0].cells.length; i++) {
                headers[i] = table.rows[0].cells[i].innerText.toLowerCase().replace(/ /gi, '');
            }

            for (var i = 1; i < table.rows.length; i++) {
                var tableRow = table.rows[i];
                var rowData = {};
                rowData.no = i;
                rowData.class = tableRow.className;
                for (var j = 0; j < tableRow.cells.length; j++) {
                    rowData[headers[j]] = tableRow.cells[j].innerText;
                }
                rowData.lastmodified = rowData.lastmodified.split(' +')[0];

                data.push(rowData);
            }

            return data;
        },

        drawHtmlTemplate(elID, templateID, dataSource, prefixHtml) {
            prefixHtml = prefixHtml || '';
            var drawEl = syn.$l.get(elID);
            var tplEL = syn.$l.get(templateID);

            try {
                var templateHtml = tplEL.textContent;
                drawEl.innerHTML = prefixHtml + Mustache.render(templateHtml, dataSource);
            } catch (error) {
                syn.$l.eventLog('$this.method.drawHtmlTemplate', error.message, 'Error');
            }
        }
    }
}
