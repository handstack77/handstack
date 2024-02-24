'use strict';
let $HFM020 = {
    config: {
        actionButtons: [{
            command: 'search',
            icon: 'search',
            text: '조회',
            action(evt) {
                $this.store.Exception.Error = '';
                syn.$w.transactionAction('LF01');
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

    transaction: {
        LF01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [
                { type: 'Form', dataFieldID: 'Exception' },
                { type: 'Grid', dataFieldID: 'DataSource' }
            ],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($object.isNullOrUndefined(error) == true) {
                    if ($string.toBoolean($this.store.Exception.Error) == false) {
                        var dataSource = {
                            items: $this.store.DataSource
                        };

                        $this.method.drawHtmlTemplate('lstProject', 'tplProjectItem', dataSource);

                        if ($this.store.DataSource.length > 0) {
                            var dataSource = $this.store.DataSource[0];
                            $this.event.lblNugetItem_click(null, dataSource.name, dataSource.version);
                        }
                    }
                    else {
                        syn.$w.notify('warning', '연결에 실패했습니다. 오류: ' + $this.store.Exception.Message, dataSourceID);
                    }
                }
            }
        }
    },

    hook: {
        pageInit() {
            syn.$w.addUIButton();
        },

        pageLoad() {
            syn.$l.get('txtUserWorkID').value = syn.$w.ManagedApp.UserWorkID;
            syn.$l.get('txtApplicationID').value = syn.$w.ManagedApp.ApplicationID;
            syn.$l.get('txtUserNo').value = syn.$w.User.UserNo;

            $this.method.search();
        },
    },

    event: {
        lblNugetItem_click(evt, name, version) {
            syn.$l.get('ifmPreview').src = `/checkup/api/tenant-app/nuget-package?packageName=${name}&version=${version}`;
            syn.$l.get('lblPreviewName').textContent = `${name}${$string.isNullOrEmpty(version) == true ? '' : '@' + version}`;
        }
    },

    method: {
        search() {
            $this.store.Exception.Error = '';
            syn.$w.transactionAction('LF01');
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
