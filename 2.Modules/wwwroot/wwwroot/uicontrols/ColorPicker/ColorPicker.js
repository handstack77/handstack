/// <reference path="/assets/js/syn.js" />

(function (window) {
    'use strict';
    syn.uicontrols = syn.uicontrols || new syn.module();
    var $colorpicker = syn.uicontrols.$colorpicker || new syn.module();

    $colorpicker.extend({
        name: 'syn.uicontrols.$colorpicker',
        version: '1.0.0',
        colorControls: [],
        defaultSetting:
        {
            elID: '',
            defaultColor: null,
            defineColors: ['FF0000', 'FF4000', 'FF8000', 'FFBF00', 'FFFF00', 'BFFF00', '80FF00', '40FF00', '00FF00', '00FFFF', '00BFFF', '0080FF', '0040FF', '8000FF', 'BF00FF', 'FF00FF', 'FF0080', 'FF0080', '848484', '000000'],
            dataType: 'string',
            belongID: null,
            getter: false,
            setter: false,
            controlText: null,
            validators: null,
            transactConfig: null,
            triggerConfig: null
        },

        addModuleList(el, moduleList, setting, controlType) {
            var elementID = el.getAttribute('id');
            var dataField = el.getAttribute('syn-datafield');
            var formDataField = el.closest('form') ? el.closest('form').getAttribute('syn-datafield') : '';

            moduleList.push({
                id: elementID,
                formDataFieldID: formDataField,
                field: dataField,
                module: this.name,
                type: controlType
            });
        },

        controlLoad(elID, setting) {
            var el = syn.$l.get(elID);

            setting = syn.$w.argumentsExtend($colorpicker.defaultSetting, setting);

            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook.controlInit) {
                var moduleSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleSettings);
            }

            setting.elID = elID;
            el.setAttribute('id', el.id + '_hidden');
            el.setAttribute('syn-options', JSON.stringify(setting));
            el.style.display = 'none';

            var dataField = el.getAttribute('syn-datafield');

            var html = '<div class="control">' +
                '<input type="text" class="form-control" id="{0}" syn-datafield="{1}" syn-options="{editType: \'text\', maskPattern: \'#SSSSSS\', dataType: \'string\', belongID: \'{2}\'}" />'.format(elID, dataField, setting.belongID) +
                '<button type="button" id="{0}_Button" type="button" class="btn btn-default btn-code-search"></button>'.format(elID) +
                '</div>';

            var parent = el.parentNode;
            var wrapper = syn.$m.create({
                tag: 'div',
                id: elID + '_box',
                className: 'control-set'
            });
            wrapper.innerHTML = html;

            parent.appendChild(wrapper);

            syn.uicontrols.$textbox.controlLoad(elID);

            setting.field = syn.$l.get(elID);
            setting.trigger = syn.$l.get(elID + '_Button');

            syn.$l.addEvent(setting.trigger, 'click', function (e) {
                picker[picker.visible ? 'exit' : 'enter']();
            });

            var picker = new CP(setting.field);
            if ($object.isString(setting.defaultColor) == true) {
                picker.set(setting.defaultColor);
            }

            var box = document.createElement('span');
            box.className = 'color-pickers';
            picker.self.appendChild(box);

            var span = null;
            for (var i = 0, j = setting.defineColors.length; i < j; ++i) {
                span = document.createElement('span');
                span.title = '#' + setting.defineColors[i];
                span.style.backgroundColor = '#' + setting.defineColors[i];
                syn.$l.addEvent(span, 'click', function (e) {
                    picker.set(this.title);
                    picker.fire("change", [this.title.slice(1)], 'main-change');
                    e.stopPropagation();
                });
                box.appendChild(span);
            }

            var code = document.createElement('input');

            picker.source.onclick = function (e) {
                e.preventDefault();
            };

            code.className = 'color-picker-code';
            code.pattern = '^#[A-Fa-f0-9]{6}$';
            code.type = 'text';

            picker.on("enter", function () {
                code.value = '#' + CP._HSV2HEX(this.get());
            });

            picker.on("change", function (color) {
                this.source.value = '#' + color;
                code.value = '#' + color;
                code.style.backgroundColor = '#' + color;
            });

            picker.self.appendChild(code);

            function update() {
                if (this.value.length) {
                    picker.set(this.value);
                    picker.fire("change", [this.value.slice(1)]);
                }
            }

            code.oncut = update;
            code.onpaste = update;
            code.onkeyup = update;
            code.oninput = update;

            $colorpicker.colorControls.push({
                id: elID,
                picker: picker,
                setting: $object.clone(setting)
            });

            if (setting.bindingID && syn.uicontrols.$data) {
                syn.uicontrols.$data.bindingSource(elID, setting.bindingID);
            }
        },

        getValue(elID, meta) {
            var result = null;
            var dateControl = $colorpicker.getControl(elID);

            if (dateControl) {
                result = dateControl.picker.field.value;
            }

            return result;
        },

        setValue(elID, value, meta) {
            var dateControl = $colorpicker.getControl(elID);
            if (dateControl) {
                dateControl.picker.field.value = value;
            }
        },

        colorConvert(convertType, value) {
            return CP[convertType](value);
        },

        clear(elID, isControlLoad) {
            var dateControl = $colorpicker.getControl(elID);
            if (dateControl) {
                dateControl.picker.clear();
            }
        },

        getControl(elID) {
            var result = null;
            var length = $colorpicker.colorControls.length;
            for (var i = 0; i < length; i++) {
                var item = $colorpicker.colorControls[i];

                if (item.id == elID) {
                    result = item;
                    break;
                }
            }

            return result;
        },

        setLocale(elID, translations, control, options) {
        }
    });
    syn.uicontrols.$colorpicker = $colorpicker;
})(window);