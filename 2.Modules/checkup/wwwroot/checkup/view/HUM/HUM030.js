'use strict';
let $HUM030 = {
    config: {
        actionButtons: [{
            command: 'search',
            icon: 'search',
            text: '조회',
            action(evt) {
                var pathName = syn.$l.get('lblPathName').textContent;
                $this.method.updateProjectItems(pathName);
            }
        },
        {
            command: 'delete',
            icon: 'trash',
            text: '항목 삭제',
            class: 'btn-danger',
            action(evt) {
                $this.method.deleteProjectItems();
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
        className: 'directory',
        projectItems: []
    },

    hook: {
        pageInit() {
            syn.$w.addUIButton();
        },

        pageLoad() {
            $this.method.updateProjectItems();
        },
    },

    event: {
        async fleAsset_change(evt) {
            var fileUpload = syn.$l.get('fleAsset');
            if (fileUpload.files.length > 0) {
                var myHeaders = new Headers();
                var formData = new FormData();
                formData.append("file", fileUpload.files[0]);

                var requestOptions = {
                    method: 'POST',
                    headers: myHeaders,
                    body: formData
                };

                var pathName = syn.$l.get('lblPathName').textContent;
                var response = await fetch(`/checkup/api/tenant-app/upload-asset-file?userWorkID=${syn.$w.ManagedApp.UserWorkID}&applicationID=${syn.$w.ManagedApp.ApplicationID}&accessKey=${syn.$w.Variable.AccessKey}&locationPath=${pathName}`, requestOptions);
                if (response.status == 200) {
                    $this.method.updateProjectItems(pathName);
                }
                else {
                    syn.$w.notify('warning', '파일 업로드가 실패했습니다');
                }
            }
        },

        btnUpDirectory_click() {
            var pathName = syn.$l.get('lblPathName').textContent;
            if (pathName && pathName != 'assets/' && pathName.length > 7) {
                var paths = pathName.split('/');
                paths.splice(paths.length - 2, 1);
                pathName = paths.join('/');

                $this.method.updateProjectItems(pathName);
            }
        },

        btnAssetFileUpload_click() {
            syn.$l.get('fleAsset').click();
        },

        lblProjectItem_click(evt, className, name) {
            var pathName = syn.$l.get('lblPathName').textContent;
            $this.prop.className = className;
            if ($this.prop.className == 'file') {
                var itemPath = `/app/${syn.$w.ManagedApp.UserWorkID}/${syn.$w.ManagedApp.ApplicationID}/wwwroot/${pathName}${encodeURIComponent(name)}`;
                syn.$l.get('ifmPreview').src = itemPath;
                syn.$l.get('lblPreviewName').textContent = pathName.replace('assets/', '') + name;
            }
            else {
                $this.method.updateProjectItems(`${pathName}${name}`);
            }
        }
    },

    method: {
        deleteProjectItems() {
            var deletes = [];
            var els = syn.$l.querySelectorAll('input.form-check-input:checked');
            for (var i = 0, length = els.length; i < length; i++) {
                var el = els[i];
                var no = el.id.split('_')[1];
                var item = $this.prop.projectItems.find((x) => { return x.no == no });
                if (item) {
                    deletes.push(item);
                }
            }

            if (deletes.length > 0) {
                var alertOptions = $object.clone(syn.$w.alertOptions);
                alertOptions.icon = 'question';
                alertOptions.buttonType = '3';
                syn.$w.alert('정말로 삭제하시겠습니까?', '삭제 확인', alertOptions, async function (result) {
                    if (result == 'Yes') {
                        var myHeaders = new Headers();
                        var requestOptions = {
                            method: 'GET',
                            headers: myHeaders
                        };

                        var pathName = syn.$l.get('lblPathName').textContent;
                        for (var i = 0, length = deletes.length; i < length; i++) {
                            var item = deletes[i];
                            if (item.class == 'directory') {
                                var directoryName = pathName + item.name;
                                var response = await fetch(`/checkup/api/tenant-app/delete-directory?userWorkID=${syn.$w.ManagedApp.UserWorkID}&applicationID=${syn.$w.ManagedApp.ApplicationID}&projectType=A&accessKey=${syn.$w.Variable.AccessKey}&directoryName=${directoryName}`, requestOptions);
                                if (response.status != 200) {
                                    syn.$w.alert(`${item.name} 디렉토리 삭제가 실패했습니다`);
                                    break;
                                }
                            }
                            else if (item.class == 'file') {
                                var itemPath = pathName + item.name;
                                var response = await fetch(`/checkup/api/tenant-app/delete-file?userWorkID=${syn.$w.ManagedApp.UserWorkID}&applicationID=${syn.$w.ManagedApp.ApplicationID}&projectType=A&accessKey=${syn.$w.Variable.AccessKey}&itemPath=${encodeURIComponent(itemPath)}`, requestOptions);
                                if (response.status != 200) {
                                    syn.$w.alert(`${item.name} 파일 삭제가 실패했습니다`);
                                    break;
                                }
                            }
                        }

                        var pathName = syn.$l.get('lblPathName').textContent;
                        $this.method.updateProjectItems(pathName);
                    }
                });
            }
            else {
                syn.$w.alert('삭제 할 항목을 선택하세요');
            }
        },

        async updateProjectItems(locationPath) {
            locationPath = locationPath || 'assets/';
            syn.$l.get('lblPathName').textContent = locationPath;

            var response = await fetch(`/checkup/api/tenant-app/asset-file-list?userWorkID=${syn.$w.ManagedApp.UserWorkID}&applicationID=${syn.$w.ManagedApp.ApplicationID}&accessKey=6eac215f2f5e495cad4f2abfdcad7644&locationPath=${locationPath.replace('assets/', '')}`);
            if (response.status == 200) {
                $this.prop.projectItems = await response.json();

                var dataSource = {
                    items: $this.prop.projectItems
                };

                $this.method.drawHtmlTemplate('lstProject', 'tplProjectItem', dataSource);
            }
            else {
                syn.$w.notify('warning', '요청 경로에 대한 결과가 없습니다');
            }
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
