'use strict';

(function () {
    var controlDefaultSettings = {
        TextBox: {
            editType: 'text',
            inValidateClear: true,
            formatNumber: true,
            maskPattern: null,
            maxCount: null,
            minCount: 0,
            allowChars: [],
            placeText: [],
            defaultSetValue: '0',
            dataType: 'string',
            belongID: null,
            getter: false,
            setter: false,
            controlText: null,
            validators: null,
            transactConfig: null,
            triggerConfig: null,
            datalistID: null,
            datalistItems: [],
            datalistUrl: null,
            datalistValueField: 'value',
            datalistLabelField: 'label',
            dataSourceID: null,
            storeSourceID: null,
            parameters: null,
            local: true,
            sharedAssetUrl: ''
        },
        DropDownList: {
            elID: '',
            placeholder: '전체',
            required: false,
            animate: false,
            local: true,
            search: false,
            multiSelectAll: false,
            width: null,
            classNames: 'border-0 form-select',
            dataSourceID: null,
            storeSourceID: null,
            parameters: null,
            selectedValue: null,
            toSynControl: true,
            sharedAssetUrl: '',
            dataType: 'string',
            belongID: null,
            getter: false,
            setter: false,
            controlText: null,
            validators: null,
            transactConfig: null,
            triggerConfig: null
        },
        CodePicker: {
            dataSourceID: null,
            storeSourceID: null,
            local: true,
            parameters: '',
            label: '',
            labelWidth: '',
            codeElementID: '',
            codeElementWidth: '',
            codeElementClass: '',
            textElementID: '',
            textElementWidth: '',
            textElementClass: '',
            required: false,
            readonly: false,
            disabled: false,
            textBelongID: null,
            textDataFieldID: null,
            searchValue: '',
            searchText: '',
            isMultiSelect: false,
            isAutoSearch: true,
            isSingleAutoReturn: true,
            isOnlineData: false,
            viewType: '',
            sharedAssetUrl: '',
            dataType: 'string',
            belongID: null,
            getter: false,
            setter: false,
            controlText: null,
            validators: null,
            transactConfig: null,
            triggerConfig: null
        },
        FileClient: {
            elementID: null,
            dialogTitle: '파일 업로드',
            tokenID: '',
            repositoryID: '',
            dependencyID: '',
            businessID: '',
            applicationID: '',
            fileUpdateCallback: null,
            accept: '*/*',
            uploadUrl: '',
            fileChangeHandler: undefined,
            custom1: undefined,
            custom2: undefined,
            custom3: undefined,
            minHeight: 360,
            fileManagerServer: '',
            fileManagerPath: '/repository/api/storage',
            pageGetRepository: 'get-repository',
            pageUploadFile: 'upload-file',
            pageUploadFiles: 'upload-files',
            pageActionHandler: 'action-handler',
            pageRemoveItem: 'remove-item',
            pageRemoveItems: 'remove-items',
            pageDownloadFile: 'download-file',
            pageHttpDownloadFile: 'http-download-file',
            pageVirtualDownloadFile: 'virtual-download-file',
            pageVirtualDeleteFile: 'virtual-delete-file',
            sharedAssetUrl: '',
            dataType: 'string',
            belongID: null,
            getter: false,
            setter: false,
            controlText: null,
            validators: null,
            transactConfig: null,
            triggerConfig: null
        },
        GridList: {
            width: '100%',
            height: '300px',
            paging: true,
            ordering: true,
            info: true,
            searching: true,
            select: true,
            lengthChange: false,
            autoWidth: true,
            pageLength: 50,
            orderCellsTop: true,
            fixedHeader: true,
            responsive: true,
            checkbox: false,
            order: [],
            sScrollY: '0px',
            footerCallback: function () {
                // Custom aggregate logic.
            },
            language: {
                emptyTable: '데이터가 없습니다',
                info: '_START_ - _END_ / _TOTAL_',
                infoEmpty: '0 - 0 / 0',
                search: '검색:'
            },
            columns: [],
            dataType: 'object',
            belongID: null,
            getter: false,
            setter: false,
            validators: null,
            transactConfig: null,
            triggerConfig: null
        }
    };

    var defaultSettingMeta = {
        editType: { type: 'options', options: ['text', 'english', 'uppercase', 'lowercase', 'number', 'numeric', 'spinner', 'date', 'time5', 'time8', 'email'] },
        dataType: { type: 'options', options: ['string', 'number', 'boolean', 'date', 'object', 'array'] },
        viewType: { type: 'options', options: ['', 'grid', 'auigrid'] },
        accept: { description: 'File accept string. Example: */*, image/*, .gif,.jpg,.png' },
        parameters: { description: 'Transaction parameter string. Example: @GROUPCODE:MS001;' },
        validators: { rows: 6 },
        transactConfig: { rows: 6 },
        triggerConfig: { rows: 6 },
        language: { rows: 8 },
        footerCallback: { rows: 8 }
    };

    var advancedValue = {
        icon: 'HOME',
        choices: ['Choice 1', 'Choice 2', 'A long choice which keeps horizontal scrolling usable.'],
        nullableOption: null,
        nestedOption: {
            CodeColumnID: 'CodeID',
            ValueColumnID: 'CodeValue',
            DataSource: [
                { CodeID: '0', CodeValue: '권한없음' },
                { CodeID: '1', CodeValue: '권한존재' }
            ]
        }
    };

    var advancedMeta = {
        icon: { name: 'Icon', group: 'Custom', type: 'icon' },
        choices: { name: 'Choices', group: 'Custom', type: 'textarea', colspan2: true },
        nullableOption: { group: 'JSON', type: 'json', description: 'Null values are edited as JSON.' },
        nestedOption: { group: 'JSON', type: 'json', rows: 10, description: 'Nested defaultSetting values use the json editor.' }
    };

    var customTypes = {
        icon: {
            html: function (elemId, name, value, meta) {
                var safeValue = (value || '').toString().substring(0, 4);
                return '<span id="' + elemId + '" class="example-icon" title="' + meta.name + '">' + safeValue + '</span>';
            },
            valueFn: function () {
                return 'Icon field value';
            }
        },
        textarea: {
            html: function (elemId, name, value) {
                var text = Array.isArray(value) ? value.join('\n') : (value || '').toString();
                return '<textarea id="' + elemId + '" class="example-textarea">' + escapeHtml(text) + '</textarea>';
            },
            makeValueFn: function (elemId) {
                return function () {
                    var element = document.getElementById(elemId);
                    return element ? element.value.split('\n') : [];
                };
            }
        }
    };

    function escapeHtml(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function cloneDefaultSetting(name) {
        var value = controlDefaultSettings[name];
        var clone = {};
        Object.keys(value).forEach(function (key) {
            clone[key] = value[key];
        });
        return clone;
    }

    function propertyChangedCallback(element, name, value) {
        var eventsLog = document.getElementById('eventsLog');
        var line = name + ' changed to ' + JSON.stringify(value);
        eventsLog.textContent = line + '\n' + eventsLog.textContent;
    }

    function renderPreset(name) {
        var value = cloneDefaultSetting(name);
        var meta = syn.uicontrols.$propertygrid.createDefaultSettingMeta(value, defaultSettingMeta);

        syn.uicontrols.$propertygrid.controlLoad('propGridDefaultSetting', {
            value: value,
            meta: meta,
            mode: 'defaultSetting',
            helpHtml: '?',
            isCollapsible: true,
            sort: true,
            callback: propertyChangedCallback
        });
    }

    function renderAdvancedGrid() {
        syn.uicontrols.$propertygrid.controlLoad('propGridAdvanced', {
            value: advancedValue,
            meta: advancedMeta,
            customTypes: customTypes,
            helpHtml: '?',
            callback: propertyChangedCallback,
            isCollapsible: true,
            sort: true
        });
    }

    function writeValues() {
        var presetName = document.getElementById('ddlControlPreset').value;
        var defaultSetting = syn.uicontrols.$propertygrid.getValue('propGridDefaultSetting');
        var customSample = syn.uicontrols.$propertygrid.getValue('propGridAdvanced');

        document.getElementById('txtValues').value = JSON.stringify({
            control: presetName,
            defaultSetting: defaultSetting,
            customSample: customSample
        }, jsonReplacer, 4);
    }

    function jsonReplacer(key, value) {
        if (typeof value === 'function') {
            return '[Function]';
        }

        if (typeof value === 'undefined') {
            return '[Undefined]';
        }

        return value;
    }

    function fillPresetOptions() {
        var select = document.getElementById('ddlControlPreset');
        Object.keys(controlDefaultSettings).forEach(function (name) {
            var option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        fillPresetOptions();
        renderPreset('TextBox');
        renderAdvancedGrid();
        writeValues();

        document.getElementById('ddlControlPreset').addEventListener('change', function () {
            renderPreset(this.value);
            writeValues();
        });

        document.getElementById('btnGetValues').addEventListener('click', writeValues);
        document.getElementById('btnResetValues').addEventListener('click', function () {
            document.getElementById('eventsLog').textContent = '';
            renderPreset(document.getElementById('ddlControlPreset').value);
            renderAdvancedGrid();
            writeValues();
        });
    });
})();
