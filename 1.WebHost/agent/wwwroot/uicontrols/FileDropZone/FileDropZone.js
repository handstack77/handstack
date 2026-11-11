/// <reference path="/js/syn.js" />

(function (window) {
    'use strict';

    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'];
    const previewTemplate = '<div class="dz-preview dz-file-preview fdz-item">' +
        '<div class="dz-image"><img data-dz-thumbnail draggable="false" alt="" /><span class="fdz-ext"></span></div>' +
        '<div class="dz-details"><div class="dz-size"><span data-dz-size></span></div><div class="dz-filename"><span data-dz-name></span></div></div>' +
        '<div class="dz-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span class="dz-upload" data-dz-uploadprogress></span></div>' +
        '<div class="dz-error-message"><span data-dz-errormessage></span></div>' +
        '<div class="dz-success-mark"><svg width="54" height="54" viewBox="0 0 54 54" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M10.2071 29.7929L14.2929 25.7071C14.6834 25.3166 15.3166 25.3166 15.7071 25.7071L21.2929 31.2929C21.6834 31.6834 22.3166 31.6834 22.7071 31.2929L38.2929 15.7071C38.6834 15.3166 39.3166 15.3166 39.7071 15.7071L43.7929 19.7929C44.1834 20.1834 44.1834 20.8166 43.7929 21.2071L22.7071 42.2929C22.3166 42.6834 21.6834 42.6834 21.2929 42.2929L10.2071 31.2071C9.81658 30.8166 9.81658 30.1834 10.2071 29.7929Z" /></svg></div>' +
        '<div class="dz-error-mark"><svg width="54" height="54" viewBox="0 0 54 54" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M26.2929 20.2929L19.2071 13.2071C18.8166 12.8166 18.1834 12.8166 17.7929 13.2071L13.2071 17.7929C12.8166 18.1834 12.8166 18.8166 13.2071 19.2071L20.2929 26.2929C20.6834 26.6834 20.6834 27.3166 20.2929 27.7071L13.2071 34.7929C12.8166 35.1834 12.8166 35.8166 13.2071 36.2071L17.7929 40.7929C18.1834 41.1834 18.8166 41.1834 19.2071 40.7929L26.2929 33.7071C26.6834 33.3166 27.3166 33.3166 27.7071 33.7071L34.7929 40.7929C35.1834 41.1834 35.8166 41.1834 36.2071 40.7929L40.7929 36.2071C41.1834 35.8166 41.1834 35.1834 40.7929 34.7929L33.7071 27.7071C33.3166 27.3166 33.3166 26.6834 33.7071 26.2929L40.7929 19.2071C41.1834 18.8166 41.1834 18.1834 40.7929 17.7929L36.2071 13.2071C35.8166 12.8166 35.1834 12.8166 34.7929 13.2071L27.7071 20.2929C27.3166 20.6834 26.6834 20.6834 26.2929 20.2929Z" /></svg></div>' +
        '<div class="fdz-actions"><button type="button" class="fdz-download">다운로드</button><button type="button" class="fdz-remove">삭제</button></div>' +
        '</div>';

    const extensionOf = name => {
        const text = String(name || '');
        const index = text.lastIndexOf('.');
        return index > -1 ? text.substring(index + 1).toLowerCase() : '';
    };

    const isImageItem = item => imageExtensions.includes(String(item.Extension || extensionOf(item.FileName)).replace('.', '').toLowerCase());

    // FileClient.toFileLengthString 과 같은 규칙: 1MiB 미만 KB, 1GiB 미만 MB, 그 이상 GB (0 은 '0.0 KB')
    const toFileLengthString = bytes => {
        const size = typeof bytes === 'number' && bytes > 0 ? bytes : 0;
        if (size < 1048576) {
            return (size / 1024).toFixed(1) + ' KB';
        }

        if (size < 1073741824) {
            return (size / 1048576).toFixed(1) + ' MB';
        }

        return (size / 1073741824).toFixed(1) + ' GB';
    };

    const createTemporaryDependencyID = () => 'TEMP_' + Array.from(window.crypto.getRandomValues(new Uint8Array(12)), byte => byte.toString(16).padStart(2, '0')).join('');

    const decodeFileResult = value => {
        try {
            const binary = window.atob(value);
            return JSON.parse(new TextDecoder('utf-8').decode(Uint8Array.from(binary, char => char.charCodeAt(0))));
        } catch (error) {
            return null;
        }
    };

    // FileClient.controlLoad 와 같은 규칙으로 ApplicationID / BusinessID 를 결정한다(컨트롤별로 보관, 전역 공유 없음).
    const resolveContext = setting => {
        let applicationID = setting.applicationID;
        if (!applicationID) {
            applicationID = (syn.$w.Variable && syn.$w.Variable.ApplicationID) || (syn.$w.User && syn.$w.User.ApplicationID) || syn.Config.ApplicationID;
        }

        let businessID = setting.businessID;
        if (!businessID && syn.Config.FileBusinessIDSource && syn.Config.FileBusinessIDSource != 'None') {
            if (syn.Config.FileBusinessIDSource == 'Cookie') {
                businessID = syn.$r.getCookie('FileBusinessID');
            }
            else if (syn.Config.FileBusinessIDSource == 'SessionStorage') {
                businessID = syn.$w.getStorage('FileBusinessID');
            }
        }

        businessID = businessID || (syn.$w.User && syn.$w.User.WorkCompanyNo) || '0';
        return { applicationID: applicationID, businessID: String(businessID) };
    };

    const apiUrl = (control, page, params) => {
        const setting = control.setting;
        const query = new URLSearchParams();
        Object.keys(params || {}).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                query.set(key, String(params[key]));
            }
        });

        const queryText = query.toString();
        return setting.fileManagerServer.replace(/\/+$/, '') + setting.fileManagerPath + '/' + page + (queryText ? '?' + queryText : '');
    };

    // 저장 하위 경로(CustomPath1~3). 값이 있을 때만 업로드 요청에 포함한다.
    const customPathParams = setting => {
        const params = {};
        ['customPath1', 'customPath2', 'customPath3'].forEach((key, index) => {
            if (setting[key]) {
                params['CustomPath' + (index + 1)] = setting[key];
            }
        });

        return params;
    };

    const baseParams = control => ({ applicationID: control.context.applicationID, repositoryID: control.setting.repositoryID, businessID: control.context.businessID });

    const requestInit = (control, init) => Object.assign({
        headers: control.setting.headers || undefined,
        credentials: control.setting.withCredentials === true ? 'include' : 'same-origin',
        cache: 'no-store'
    }, init);

    const requestJson = async (control, page, params) => {
        const response = await fetch(apiUrl(control, page, params), requestInit(control, { method: 'GET' }));
        if (response.ok == false) {
            throw new Error('HTTP ' + response.status);
        }

        return response.json();
    };

    const notify = (control, type, detail) => syn.$l.triggerEvent(control.host, type, detail);

    const clone = value => JSON.parse(JSON.stringify(value));

    const errorText = message => {
        if (typeof message === 'string') {
            return message;
        }

        if (message && typeof message === 'object') {
            return message.Message || message.message || message.error || message.title || '업로드 오류';
        }

        return '업로드 오류';
    };

    const revokeThumbnail = file => {
        if (file.fdzObjectUrl) {
            URL.revokeObjectURL(file.fdzObjectUrl);
            file.fdzObjectUrl = null;
        }
    };

    const markItem = (file, item) => {
        file.fdzItem = item;
        const preview = file.previewElement;
        if (preview) {
            preview.classList.add('fdz-has-item');
            const ext = preview.querySelector('.fdz-ext');
            if (ext) {
                ext.textContent = String(item.Extension || extensionOf(item.FileName)).replace('.', '').toUpperCase();
            }
        }
    };

    const showStatus = (control, message, isError) => {
        let status = control.host.querySelector('.fdz-status');
        if (!status) {
            status = document.createElement('div');
            status.className = 'fdz-status';
            control.host.prepend(status);
        }

        status.textContent = message;
        status.classList.toggle('fdz-status-error', isError === true);
    };

    const applyState = control => {
        const locked = control.readOnly || control.disabled;
        if (control.dz) {
            if (locked && !control.dz.disabled) {
                control.dz.disable();
            }
            else if (!locked && control.dz.disabled) {
                control.dz.enable();
            }
        }

        control.host.classList.toggle('fdz-readonly', control.readOnly);
        control.host.classList.toggle('fdz-disabled', control.disabled);
        control.host.setAttribute('aria-readonly', control.readOnly ? 'true' : 'false');
        control.host.setAttribute('aria-disabled', control.disabled ? 'true' : 'false');
    };

    const setCardError = (file, message) => {
        if (file.previewElement) {
            file.previewElement.classList.add('dz-error');
            const target = file.previewElement.querySelector('[data-dz-errormessage]');
            if (target) {
                target.textContent = message;
            }
        }
    };

    // 업로드 성공 응답이어도 Result 가 false 이면 실패로 처리한다(서버는 논리 오류를 HTTP 200 으로 반환).
    const failUpload = (control, file, message) => {
        file.status = Dropzone.ERROR;
        file.accepted = false;
        if (file.previewElement) {
            file.previewElement.classList.remove('dz-success');
        }

        setCardError(file, message);
        notify(control, 'uploadError', { file: file, message: message });
    };

    const fetchItem = async (control, itemID) => {
        const item = await requestJson(control, 'action-handler', Object.assign(baseParams(control), { Action: 'GetItem', itemID: itemID }));
        return item && item.ItemID ? item : null;
    };

    // 업로드 직후 항목 정보: FileResult 헤더(base64 JSON)를 우선 사용하고, 없으면 GetItem 으로 조회한다.
    const resolveUploadedItem = async (control, file, response) => {
        let item = null;
        if (file.xhr && file.xhr.getResponseHeader('FileResult')) {
            item = decodeFileResult(file.xhr.getResponseHeader('FileResult'));
        }

        if ((!item || !item.ItemID) && response && response.ItemID) {
            try {
                item = await fetchItem(control, response.ItemID);
            } catch (error) {
                item = null;
            }
        }

        return item && item.ItemID ? item : null;
    };

    // 업로드 정책(저장소 설정) 중 서버가 강제하지 않는 확장자를 클라이언트에서 검사한다.
    const policyExtensions = policy => {
        const text = String(policy.UploadExtensions || '').trim();
        if (text === '' || text === '*/*' || text === '*') {
            return null;
        }

        return text.split(/[;,]/).map(item => item.trim().replace(/^\./, '').toLowerCase()).filter(item => item !== '');
    };

    const loadThumbnail = async (control, file) => {
        if (control.setting.thumbnails !== true || !file.fdzItem || isImageItem(file.fdzItem) == false || file.size > 10 * 1024 * 1024) {
            return;
        }

        try {
            const blob = await downloadBlob(control, file.fdzItem);
            if (blob && control.dz && control.dz.files.includes(file)) {
                file.fdzObjectUrl = URL.createObjectURL(blob.blob);
                control.dz.emit('thumbnail', file, file.fdzObjectUrl);
            }
        } catch (error) {
            // 썸네일 실패는 무시한다(파일 카드는 그대로 표시).
        }
    };

    const downloadBlob = async (control, item) => {
        const response = await fetch(apiUrl(control, 'download-file'), requestInit(control, {
            method: 'POST',
            headers: Object.assign({ 'Content-Type': 'application/json' }, control.setting.headers || {}),
            body: JSON.stringify({
                ApplicationID: control.context.applicationID,
                RepositoryID: control.setting.repositoryID,
                ItemID: item.ItemID,
                BusinessID: control.context.businessID,
                FileMD5: '',
                TokenID: control.setting.tokenID || '',
                Disposition: 'attachment'
            })
        }));

        if (response.ok == false) {
            throw new Error('HTTP ' + response.status);
        }

        const result = response.headers.get('FileResult') ? decodeFileResult(response.headers.get('FileResult')) : null;
        if (result && result.Result === false) {
            throw new Error(result.Message || '다운로드 실패');
        }

        return { blob: await response.blob(), fileName: (result && result.FileName) || item.FileName };
    };

    // 서버에 이미 있는 항목을 목록에 표시한다(업로드 없음).
    const addExisting = (control, item) => {
        const dz = control.dz;
        const name = item.FileName || item.ItemID;
        const size = typeof item.Size === 'number' ? item.Size : Number(item.Size || item.SizeLength || 0);
        const file = {
            name: name,
            size: size,
            type: item.MimeType || '',
            accepted: true,
            status: Dropzone.SUCCESS,
            upload: { progress: 100, total: size, bytesSent: size },
            fdzItem: clone(item)
        };

        dz.emit('addedfile', file);
        dz.emit('complete', file);
        dz.files.push(file);
        markItem(file, file.fdzItem);
        file.previewElement.classList.add('dz-success', 'dz-complete');
        dz._updateMaxFilesReachedClass();
        loadThumbnail(control, file);
        return file;
    };

    const clearList = control => {
        if (control.dz) {
            control.dz.files.slice().forEach(file => revokeThumbnail(file));
            control.dz.removeAllFiles(true);
        }
    };

    const findFile = (control, itemID) => (control.dz ? control.dz.files.find(file => file.fdzItem && file.fdzItem.ItemID === itemID) : null) || null;

    const normalizeItems = async (control, values) => {
        if (typeof values === 'string') {
            const text = values.trim();
            values = text === '' ? [] : (text.startsWith('[') ? JSON.parse(text) : text.split(',').map(item => item.trim()).filter(item => item !== ''));
        }

        if (Array.isArray(values) == false) {
            values = values === null || values === undefined ? [] : [values];
        }

        const items = [];
        items.skipped = 0;
        for (const value of values) {
            const itemID = typeof value === 'string' ? value : (value && value.ItemID);
            if (!itemID) {
                items.skipped++;
                syn.$l.eventLog('$filedropzone.setValue', 'elID: "{0}" ItemID 가 없는 항목은 무시합니다.'.format(control.id), 'Warning');
                continue;
            }

            if (typeof value === 'object' && value.FileName) {
                items.push(value);
            }
            else {
                const item = await fetchItem(control, itemID);
                if (item) {
                    items.push(item);
                }
                else {
                    items.skipped++;
                    syn.$l.eventLog('$filedropzone.setValue', 'elID: "{0}" ItemID "{1}" 정보를 찾을 수 없습니다.'.format(control.id, itemID), 'Warning');
                }
            }
        }

        return items;
    };

    const createDropzone = control => {
        const setting = control.setting;
        const policy = control.policy;
        const extensions = policyExtensions(policy);
        const isSingle = policy.IsMultiUpload === false;

        let maxFilesize = policy.UploadSizeLimit > 0 ? policy.UploadSizeLimit / 1048576 : null;
        if (setting.maxFilesize > 0 && (maxFilesize === null || setting.maxFilesize < maxFilesize)) {
            maxFilesize = setting.maxFilesize;
        }

        let maxFiles = null;
        if (isSingle == false) {
            maxFiles = policy.UploadCount > 0 ? policy.UploadCount : null;
            if (setting.maxFiles > 0 && (maxFiles === null || setting.maxFiles < maxFiles)) {
                maxFiles = setting.maxFiles;
            }
        }

        const dz = new Dropzone(control.host, {
            url: () => apiUrl(control, 'upload-file', Object.assign(baseParams(control), { dependencyID: control.dependencyID }, customPathParams(setting))),
            method: 'post',
            paramName: 'file',
            parallelUploads: isSingle ? 1 : setting.parallelUploads,
            uploadMultiple: false,
            maxFilesize: maxFilesize,
            maxFiles: maxFiles,
            acceptedFiles: setting.acceptedFiles || null,
            timeout: setting.timeout > 0 ? setting.timeout : null,
            headers: setting.headers,
            withCredentials: setting.withCredentials === true,
            createImageThumbnails: setting.thumbnails === true,
            thumbnailWidth: 120,
            thumbnailHeight: 120,
            hiddenInputContainer: control.host,
            previewTemplate: previewTemplate,
            dictDefaultMessage: setting.placeholder,
            dictFileTooBig: '파일이 너무 큽니다({{filesize}}MB). 최대 {{maxFilesize}}MB 까지 업로드할 수 있습니다.',
            dictInvalidFileType: '허용되지 않는 파일 형식입니다.',
            dictResponseError: '서버 오류가 발생했습니다(상태 코드 {{statusCode}}).',
            dictCancelUpload: '업로드 취소',
            dictMaxFilesExceeded: '더 이상 파일을 올릴 수 없습니다. (최대 {{maxFiles}}개)',
            accept(file, done) {
                if (extensions && file.fdzItem == null && extensions.includes(extensionOf(file.name)) == false) {
                    done('허용되지 않는 확장자입니다. (허용: ' + extensions.join(', ') + ')');
                    return;
                }

                done();
            }
        });

        dz.filesize = size => toFileLengthString(size);

        dz.on('addedfile', file => {
            if (file.previewElement) {
                file.previewElement.fdzFile = file;
                file.previewElement.setAttribute('title', file.name);
                const ext = file.previewElement.querySelector('.fdz-ext');
                if (ext) {
                    ext.textContent = extensionOf(file.name).toUpperCase();
                }

                if (setting.showDownload !== true) {
                    file.previewElement.classList.add('fdz-no-download');
                }
            }

            if (file.fdzItem) {
                return;
            }

            // 단일 파일 저장소는 마지막으로 추가한 파일만 업로드한다.
            if (isSingle == true) {
                dz.files.filter(other => other !== file && other.fdzItem == null && (other.status === Dropzone.ADDED || other.status === Dropzone.QUEUED || other.status === Dropzone.UPLOADING)).forEach(other => dz.removeFile(other));
            }

            notify(control, 'fileAdded', { file: file });
        });

        dz.on('uploadprogress', (file, progress) => {
            if (file.previewElement) {
                const bar = file.previewElement.querySelector('.dz-progress');
                if (bar) {
                    bar.setAttribute('aria-valuenow', String(Math.round(progress)));
                }
            }

            notify(control, 'uploadProgress', { file: file, progress: progress });
        });

        dz.on('success', async (file, response) => {
            if (file.fdzItem) {
                return;
            }

            if (!response || typeof response !== 'object' || response.Result !== true) {
                failUpload(control, file, (response && response.Message) || '업로드에 실패했습니다.');
                return;
            }

            const item = await resolveUploadedItem(control, file, response);
            if (item == null) {
                failUpload(control, file, '업로드한 파일 정보를 확인할 수 없습니다.');
                return;
            }

            if (control.dz == null || dz.files.includes(file) == false) {
                return;
            }

            markItem(file, item);
            if (isSingle == true) {
                dz.files.filter(other => other !== file && other.fdzItem).forEach(other => {
                    revokeThumbnail(other);
                    dz.removeFile(other);
                });
            }

            notify(control, 'uploadSuccess', { file: file, item: clone(item) });
            notify(control, 'change', { value: module.getValue(control.id) });
        });

        dz.on('error', (file, message) => {
            const text = errorText(message);
            file.accepted = false;
            if (file.previewElement) {
                const target = file.previewElement.querySelector('[data-dz-errormessage]');
                if (target) {
                    target.textContent = text;
                }
            }

            if (file.xhr) {
                notify(control, 'uploadError', { file: file, message: text });
                return;
            }

            // 업로드 전에 거부된 파일(크기/확장자/개수 초과)
            notify(control, 'fileRejected', { file: file, reason: text });
            if (setting.rejectedDisplayMs > 0) {
                setTimeout(() => {
                    if (control.dz && dz.files.includes(file)) {
                        dz.removeFile(file);
                    }
                }, setting.rejectedDisplayMs);
            }
        });

        dz.on('queuecomplete', () => notify(control, 'queueComplete', {}));

        control.onClick = event => {
            const button = event.target.closest('.fdz-download, .fdz-remove');
            if (!button || !control.host.contains(button)) {
                return;
            }

            const preview = button.closest('.fdz-item');
            const file = preview && preview.fdzFile;
            if (!file) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            if (button.classList.contains('fdz-download')) {
                if (file.fdzItem) {
                    module.download(control.id, file.fdzItem.ItemID);
                }
            }
            else {
                removeFileEntry(control, file);
            }
        };
        control.host.addEventListener('click', control.onClick);

        return dz;
    };

    // 파일 카드의 삭제 버튼/removeItem 이 공통으로 사용한다. 반환: 성공 여부.
    const removeFileEntry = async (control, file) => {
        const dz = control.dz;
        if (!dz) {
            return false;
        }

        if (control.readOnly || control.disabled) {
            return false;
        }

        const item = file.fdzItem;
        if (item && control.setting.confirmRemove === true && window.confirm('"{0}" 파일을 삭제하시겠습니까?'.format(item.FileName)) == false) {
            return false;
        }

        if (item && control.setting.deleteOnRemove === true) {
            try {
                const result = await requestJson(control, 'remove-item', Object.assign(baseParams(control), { itemID: item.ItemID }));
                if (!result || result.Result !== true) {
                    setCardError(file, (result && result.Message) || '파일을 삭제하지 못했습니다.');
                    return false;
                }
            } catch (error) {
                syn.$l.eventLog('$filedropzone.remove', 'elID: "{0}" 삭제 요청 오류: {1}'.format(control.id, error.message), 'Warning');
                setCardError(file, '파일을 삭제하지 못했습니다.');
                return false;
            }
        }

        revokeThumbnail(file);
        dz.removeFile(file);
        dz._updateMaxFilesReachedClass();
        if (item) {
            notify(control, 'fileRemoved', { item: clone(item) });
            notify(control, 'change', { value: module.getValue(control.id) });
        }

        return true;
    };

    syn.uicontrols = syn.uicontrols || new syn.module();
    const module = syn.uicontrols.$filedropzone || new syn.module();

    module.extend({
        name: 'syn.uicontrols.$filedropzone',
        version: 'v2026.10.14',
        fileDropZoneControls: [],
        defaultSetting: {
            repositoryID: '',
            applicationID: '',
            businessID: '',
            dependencyID: '',
            tokenID: '',
            customPath1: '',
            customPath2: '',
            customPath3: '',
            fileManagerServer: '',
            fileManagerPath: '/repository/api/storage',
            width: '100%',
            height: null,
            placeholder: '파일을 끌어다 놓거나 클릭하여 선택하세요',
            autoLoad: true,
            deleteOnRemove: true,
            confirmRemove: false,
            readOnly: false,
            showDownload: true,
            thumbnails: true,
            acceptedFiles: null,
            maxFilesize: null,
            maxFiles: null,
            parallelUploads: 2,
            timeout: 0,
            headers: null,
            withCredentials: false,
            rejectedDisplayMs: 3000,
            dataType: 'object',
            belongID: null,
            getter: false,
            setter: false,
            controlText: null,
            validators: null,
            transactConfig: null,
            triggerConfig: null
        },

        addModuleList(el, moduleList, setting, controlType) {
            moduleList.push({
                id: el.getAttribute('id'),
                formDataFieldID: el.closest('form') ? el.closest('form').getAttribute('syn-datafield') : '',
                field: el.getAttribute('syn-datafield'),
                module: this.name,
                type: controlType
            });
        },

        // 컨트롤은 저장소 정책 조회가 끝나야 사용할 수 있다. 준비 완료 시 'ready' 이벤트가 발생하며 whenReady(elID) 로도 기다릴 수 있다.
        controlLoad(elID, setting) {
            const existing = this.getControl(elID);
            if (existing) {
                return existing;
            }

            const el = syn.$l.get(elID);
            if (!el) {
                throw new Error('FileDropZone: element not found: ' + elID);
            }

            if (typeof Dropzone === 'undefined') {
                throw new Error('FileDropZone: Dropzone library must be loaded first');
            }

            Dropzone.autoDiscover = false;
            setting = syn.$w.argumentsExtend(this.defaultSetting, setting || {});

            const mod = window[syn.$w.pageScript];
            if (mod && mod.hook && mod.hook.controlInit) {
                setting = syn.$w.argumentsExtend(setting, mod.hook.controlInit(elID, setting));
            }

            if ($string.isNullOrEmpty(setting.fileManagerServer) == true && syn.Config && syn.Config.FileManagerServer) {
                setting.fileManagerServer = syn.Config.FileManagerServer;
            }

            setting.elID = elID;
            el.setAttribute('syn-options', JSON.stringify(setting));
            el.classList.add('syn-filedropzone', 'dropzone');
            el.style.width = setting.width;
            if (setting.height) {
                el.style.minHeight = setting.height;
            }

            el.replaceChildren();

            const control = {
                id: elID,
                host: el,
                setting: $object.clone(setting),
                context: null,
                policy: null,
                dz: null,
                dependencyID: setting.dependencyID || createTemporaryDependencyID(),
                isTemporary: !setting.dependencyID,
                readOnly: setting.readOnly === true,
                disabled: false,
                state: 'loading',
                ready: null
            };

            this.fileDropZoneControls.push(control);
            applyState(control);

            control.ready = (async () => {
                if ($string.isNullOrEmpty(control.setting.fileManagerServer) == true || $string.isNullOrEmpty(control.setting.repositoryID) == true) {
                    throw new Error('파일 서버(fileManagerServer) 또는 repositoryID 정보 확인 필요');
                }

                control.context = resolveContext(control.setting);
                if ($string.isNullOrEmpty(control.context.applicationID) == true) {
                    throw new Error('ApplicationID 정보 확인 필요');
                }

                showStatus(control, '저장소 정보를 확인하는 중입니다...', false);
                const policy = await requestJson(control, 'get-repository', { applicationID: control.context.applicationID, repositoryID: control.setting.repositoryID });
                if (!policy || Object.keys(policy).length === 0) {
                    throw new Error('저장소 "{0}" 정보를 찾을 수 없습니다'.format(control.setting.repositoryID));
                }

                control.policy = policy;
                control.host.querySelector('.fdz-status') && control.host.querySelector('.fdz-status').remove();
                control.dz = createDropzone(control);
                applyState(control);
                control.state = 'ready';

                if (control.setting.autoLoad === true && control.isTemporary == false) {
                    await module.load(elID);
                }

                notify(control, 'ready', { policy: clone(policy) });
                return control;
            })().catch(error => {
                control.state = 'error';
                showStatus(control, '파일 컨트롤을 초기화하지 못했습니다: ' + error.message, true);
                syn.$l.eventLog('$filedropzone.controlLoad', 'elID: "{0}" 초기화 오류: {1}'.format(elID, error.message), 'Error');
                return control;
            });

            return control;
        },

        // 컨트롤이 준비(정책 조회, 기존 파일 표시)될 때까지 기다린다.
        whenReady(elID) {
            const control = this.getControl(elID);
            return control ? control.ready : Promise.resolve(null);
        },

        // 업로드가 끝난 파일 항목(repository 항목 JSON)의 복제 배열을 반환한다. 없으면 [].
        getValue(elID, meta) {
            const control = this.getControl(elID);
            if (!control || !control.dz) {
                return [];
            }

            return control.dz.files.filter(file => file.fdzItem && file.status === Dropzone.SUCCESS).map(file => clone(file.fdzItem));
        },

        // 항목 배열(또는 ItemID 문자열/CSV/JSON 문자열)로 목록을 교체한다. 서버에 업로드/삭제하지 않으며 change 이벤트는 발생하지 않는다.
        // ItemID 만 있는 항목은 서버에서 조회한다. Promise<boolean> 을 반환한다(해석하지 못한 항목이 있으면 false, 나머지 항목은 표시).
        async setValue(elID, value, meta) {
            const control = this.getControl(elID);
            if (!control) {
                return false;
            }

            await control.ready;
            if (!control.dz) {
                return false;
            }

            try {
                const items = await normalizeItems(control, value);
                clearList(control);
                items.forEach(item => addExisting(control, item));
                return items.skipped === 0;
            } catch (error) {
                syn.$l.eventLog('$filedropzone.setValue', 'elID: "{0}" 값을 설정하지 못했습니다: {1}'.format(elID, error.message), 'Warning');
                return false;
            }
        },

        // 서버 목록을 비우지 않고 화면 목록만 비운다. change 이벤트는 발생하지 않는다.
        clear(elID, isControlLoad) {
            const control = this.getControl(elID);
            if (control) {
                clearList(control);
            }
        },

        // dependencyID(생략하면 현재 값)의 항목을 서버에서 다시 조회해 목록을 교체한다. 조회한 항목 배열을 반환한다.
        async load(elID, dependencyID) {
            const control = this.getControl(elID);
            if (!control) {
                return [];
            }

            if (control.dz == null && control.state === 'loading') {
                await control.ready;
            }

            if (!control.dz) {
                return [];
            }

            if (dependencyID) {
                control.dependencyID = dependencyID;
                control.isTemporary = false;
            }

            try {
                const result = await requestJson(control, 'action-handler', Object.assign(baseParams(control), { Action: 'GetItems', dependencyID: control.dependencyID }));
                const items = Array.isArray(result) ? result : (result && (result.Items || result.items)) || [];
                clearList(control);
                items.forEach(item => addExisting(control, item));
                return clone(items);
            } catch (error) {
                syn.$l.eventLog('$filedropzone.load', 'elID: "{0}" 목록 조회 오류: {1}'.format(elID, error.message), 'Warning');
                return [];
            }
        },

        // 코드에서 파일(File 객체 또는 배열)을 추가해 업로드한다.
        upload(elID, files) {
            const control = this.getControl(elID);
            if (!control || !control.dz || control.readOnly || control.disabled) {
                return false;
            }

            (Array.isArray(files) ? files : (files instanceof FileList ? Array.from(files) : [files])).forEach(file => control.dz.addFile(file));
            return true;
        },

        // 서버에서 항목을 삭제하고 목록에서도 제거한다(deleteOnRemove 와 무관). Promise<boolean>.
        async removeItem(elID, itemID) {
            const control = this.getControl(elID);
            const file = control ? findFile(control, itemID) : null;
            if (!control || !file) {
                return false;
            }

            const original = control.setting.deleteOnRemove;
            control.setting.deleteOnRemove = true;
            try {
                return await removeFileEntry(control, file);
            } finally {
                control.setting.deleteOnRemove = original;
            }
        },

        // 현재 dependencyID 의 모든 파일을 서버에서 삭제하고 목록을 비운다. Promise<boolean>.
        async removeAll(elID) {
            const control = this.getControl(elID);
            if (!control || !control.dz || control.readOnly || control.disabled) {
                return false;
            }

            try {
                const result = await requestJson(control, 'remove-items', Object.assign(baseParams(control), { dependencyID: control.dependencyID }));
                if (!result || result.Result !== true) {
                    return false;
                }

                clearList(control);
                notify(control, 'change', { value: [] });
                return true;
            } catch (error) {
                syn.$l.eventLog('$filedropzone.removeAll', 'elID: "{0}" 삭제 요청 오류: {1}'.format(elID, error.message), 'Warning');
                return false;
            }
        },

        // itemID(또는 항목 객체)의 파일을 내려받는다. Promise<boolean>.
        async download(elID, itemID) {
            const control = this.getControl(elID);
            const id = itemID && typeof itemID === 'object' ? itemID.ItemID : itemID;
            if (!control || !id) {
                return false;
            }

            const file = findFile(control, id);
            const item = file ? file.fdzItem : (typeof itemID === 'object' ? itemID : { ItemID: id, FileName: id });
            try {
                const result = await downloadBlob(control, item);
                syn.$l.blobToDownload(result.blob, result.fileName);
                notify(control, 'fileDownload', { item: clone(item) });
                return true;
            } catch (error) {
                syn.$l.eventLog('$filedropzone.download', 'elID: "{0}" 다운로드 오류: {1}'.format(elID, error.message), 'Warning');
                if (file && file.previewElement) {
                    const target = file.previewElement.querySelector('[data-dz-errormessage]');
                    if (target) {
                        target.textContent = '파일을 내려받지 못했습니다.';
                    }
                }

                return false;
            }
        },

        // http-download-file 주소를 반환한다(보호된 저장소는 같은 사이트의 Referer 가 필요하다). disposition: 'attachment' | 'inline'
        getDownloadUrl(elID, itemID, disposition) {
            const control = this.getControl(elID);
            if (!control || !itemID) {
                return null;
            }

            return apiUrl(control, 'http-download-file', Object.assign(baseParams(control), { itemID: itemID, disposition: disposition || 'attachment' }));
        },

        getDependencyID(elID) {
            const control = this.getControl(elID);
            return control ? control.dependencyID : null;
        },

        // 이후 업로드/조회가 사용할 dependencyID 를 바꾼다(목록은 그대로). 서버 항목의 키까지 바꾸려면 updateDependencyID 를 사용한다.
        setDependencyID(elID, dependencyID) {
            const control = this.getControl(elID);
            if (control && dependencyID) {
                control.dependencyID = dependencyID;
                control.isTemporary = false;
            }
        },

        // 서버 항목의 dependencyID 를 현재 값에서 targetDependencyID 로 바꾼다(임시 키 → 실제 업무 키 저장 흐름). Promise<boolean>.
        async updateDependencyID(elID, targetDependencyID) {
            const control = this.getControl(elID);
            if (!control || !targetDependencyID) {
                return false;
            }

            try {
                const result = await requestJson(control, 'action-handler', Object.assign(baseParams(control), { Action: 'UpdateDependencyID', sourceDependencyID: control.dependencyID, targetDependencyID: targetDependencyID }));
                if (!result || result.Result !== true) {
                    syn.$l.eventLog('$filedropzone.updateDependencyID', 'elID: "{0}" {1}'.format(elID, (result && result.Message) || '실패'), 'Warning');
                    return false;
                }

                control.dependencyID = targetDependencyID;
                control.isTemporary = false;
                if (control.dz) {
                    control.dz.files.forEach(file => {
                        if (file.fdzItem) {
                            file.fdzItem.DependencyID = targetDependencyID;
                        }
                    });
                }

                return true;
            } catch (error) {
                syn.$l.eventLog('$filedropzone.updateDependencyID', 'elID: "{0}" 요청 오류: {1}'.format(elID, error.message), 'Warning');
                return false;
            }
        },

        isEmpty(elID) {
            return this.getValue(elID).length === 0;
        },

        isUploading(elID) {
            const control = this.getControl(elID);
            return control && control.dz ? control.dz.getUploadingFiles().length + control.dz.getQueuedFiles().length > 0 : false;
        },

        setReadOnly(elID, isReadOnly) {
            const control = this.getControl(elID);
            if (control) {
                control.readOnly = isReadOnly !== false;
                applyState(control);
            }
        },

        setDisabled(elID, isDisabled) {
            const control = this.getControl(elID);
            if (control) {
                control.disabled = isDisabled !== false;
                applyState(control);
            }
        },

        toFileLengthString: toFileLengthString,

        destroy(elID) {
            const control = this.getControl(elID);
            if (!control) {
                return;
            }

            if (control.onClick) {
                control.host.removeEventListener('click', control.onClick);
            }

            if (control.dz) {
                control.dz.files.slice().forEach(file => revokeThumbnail(file));
                control.dz.destroy();
                control.dz = null;
            }

            control.host.classList.remove('syn-filedropzone', 'dropzone', 'fdz-readonly', 'fdz-disabled');
            control.host.replaceChildren();
            this.fileDropZoneControls = this.fileDropZoneControls.filter(item => item.id !== elID);
        },

        getControl(elID) {
            return this.fileDropZoneControls.find(item => item.id === elID) || null;
        },

        setLocale(elID, translations, control, options) {
        }
    });
    syn.uicontrols.$filedropzone = module;
})(window);
