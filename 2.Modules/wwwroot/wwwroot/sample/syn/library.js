'use strict';
let $library = {
    extends: [
        'parsehtml'
    ],

    hook: {
        pageLoad() {
            syn.$l.get('txt_version').value = syn.$m.version;
        }
    },

    method: {
        updateText(evt) {
            var el = null;
            if ($object.isNullOrUndefined(evt) == true) {
                el = syn.$w.activeControl(this);
            }
            else {
                el = syn.$w.activeControl(evt);
            }

            el.value = el.value + ' changed !';
        }
    },

    event: {
        btn_guid_click() {
            syn.$l.get('txt_guid').value = syn.$l.guid();
        },

        btn_stringToArrayBuffer_click() {
            syn.$l.get('txt_stringToArrayBuffer').value = syn.$l.stringToArrayBuffer('hello world');
        },

        btn_arrayBufferToString_click() {
            syn.$l.get('txt_arrayBufferToString').value = syn.$l.arrayBufferToString(syn.$l.stringToArrayBuffer('hello world'));
        },

        btn_random_click() {
            syn.$l.get('txt_random').value = syn.$l.random();
        },

        btn_random1_click() {
            syn.$l.get('txt_random').value = syn.$l.random(32);
        },

        btn_random2_click() {
            syn.$l.get('txt_random').value = syn.$l.random(32, true);
        },

        btn_dispatchClick_click() {
            syn.$l.dispatchClick('btn_random2');
        },

        btn_addEvent_click() {
            syn.$l.addEvent('txt_addEvent', 'click', (evt) => {
                var el = syn.$w.activeControl(evt);
                el.value = el.value + ' click !';
            })
                .addEvent('txt_addEvent', 'change', $this.method.updateText)
                .addEvent('txt_addEvent', 'blur', (evt) => {
                    var el = syn.$w.activeControl(evt);
                    el.value = el.value + ' blur !';
                });
        },

        btn_addEvents_click() {
            syn.$l.addEvents('input[type="text"]', 'click', (evt) => {
                var el = syn.$l.get('txt_addEvents');
                el.value = el.value + ' input[type="text"] click !';
            });

            syn.$l.addEvents(['div.form-text', 'button#btn_triggerEvent'], 'click', (evt) => {
                var el = syn.$l.get('txt_addEvents');
                el.value = el.value + ' div.form-text, button#btn_triggerEvent click !';
            });
        },

        btn_addLive_click() {
            syn.$l.addLive('txt_addLive', 'click', (evt) => {
                var el = syn.$w.activeControl(evt);
                el.value = el.value + ' click !';
            });
        },

        btn_addLiveElement_click() {
            syn.$m.append('div_addLive', 'input', 'txt_addLive', {
                classNames: 'form-control',
                value: 'hello world'
            });
        },

        btn_removeEvent_click() {
            syn.$l.removeEvent('txt_addEvent', 'change', $this.method.updateText);
        },

        btn_hasEvent_click() {
            syn.$l.get('txt_hasEvent').value = syn.$l.hasEvent('txt_addEvent', 'change');
        },

        btn_trigger_click() {
            syn.$l.get('txt_trigger').value = syn.$l.trigger('txt_addEvent', 'change');
        },

        btn_triggerEvent_click() {
            syn.$l.get('txt_triggerEvent').value = syn.$l.triggerEvent('txt_addEvent', 'change');
        },

        btn_get_click() {
            var els = syn.$l.get('btn_trigger', 'btn_triggerEvent', 'btn_get');
            syn.$l.get('txt_get').value = `${syn.$l.get('btn_get').textContent}, ${els.length}`;
        },

        btn_querySelector_click() {
            var els = syn.$l.querySelector('#btn_trigger', '#btn_triggerEvent', '#btn_get');
            syn.$l.get('txt_querySelector').value = `${syn.$l.querySelector('#btn_get').textContent}, ${els.length}`;
        },

        btn_getTagName_click() {
            var els = syn.$l.getTagName('button', 'input');
            syn.$l.get('txt_getTagName').value = els.length;
        },

        btn_toEnumText_click() {
            syn.$l.get('txt_toEnumText').value = syn.$l.toEnumText(syn.$v.valueType, 0);
        },

        btn_text2Json_click() {
            var json = syn.$l.text2Json(syn.$l.get('txt_text2Json').value);
            syn.$l.get('txt_text2Json').value = JSON.stringify(json, null, 4);
        },

        btn_json2Text_click() {
            var json = JSON.parse(syn.$l.get('txt_json2Text').value);
            var text = syn.$l.json2Text(json, ['AAA', 'BBB', 'CCC']);
            syn.$l.get('txt_json2Text').value = text;
        },

        btn_nested2Flat_click() {
            var dataSource = JSON.parse(syn.$l.get('txt_jsontext').value);
            var jsonRoot = syn.$l.flat2Nested(dataSource, 'id', 'parentId');
            var flatItems = syn.$l.nested2Flat(jsonRoot, 'id', 'parentId', 'items');
            syn.$l.get('txt_nestedresult').value = JSON.stringify(flatItems, null, 4);
        },

        btn_flat2Nested_click() {
            var dataSource = JSON.parse(syn.$l.get('txt_jsontext').value);
            var jsonRoot = syn.$l.flat2Nested(dataSource, 'id', 'parentId');
            syn.$l.get('txt_nestedresult').value = JSON.stringify(jsonRoot, null, 4);
        },

        btn_findNestedByID_click() {
            var dataSource = JSON.parse(syn.$l.get('txt_jsontext').value);
            var jsonRoot = syn.$l.flat2Nested(dataSource, 'id', 'parentId');
            var findItem = syn.$l.findNestedByID(jsonRoot, 10, 'id', 'items');
            syn.$l.get('txt_nestedresult').value = JSON.stringify(findItem, null, 4);
        },

        btn_deepFreeze_click() {
            var json = {
                value: ''
            };
            json.value = 'hello world';

            var freezeJson = syn.$l.deepFreeze(json);

            try {
                freezeJson.value = 'change !';
            } catch {

            }

            syn.$l.get('txt_deepFreeze').value = `json: ${JSON.stringify(json)}, freezeJson: ${JSON.stringify(freezeJson)}`;
        },

        btn_createBlob_click() {
            var blob = syn.$l.createBlob('hello world', 'text/plain');
            syn.$l.get('txt_createBlob').value = blob;
        },

        btn_dataUriToBlob_click() {
            var dataUri = 'data:text/plain;base64,aGVsbG93b3JsZA==';
            var blob = syn.$l.dataUriToBlob(dataUri);
            syn.$l.get('txt_dataUriToBlob').value = blob;
        },

        btn_dataUriToText_click() {
            var dataUri = 'data:text/plain;base64,aGVsbG93b3JsZA==';
            var json = syn.$l.dataUriToText(dataUri);
            syn.$l.get('txt_dataUriToText').value = `value: ${json.value}, mime: ${json.mime}`;
        },

        btn_blobToDataUri_click() {
            var blob = syn.$l.createBlob('hello world', 'text/plain');
            syn.$l.blobToDataUri(blob, (dataUri) => {
                syn.$l.get('txt_blobToDataUri').value = dataUri;
            });
        },

        btn_blobToDownload_click() {
            var blob = syn.$l.createBlob('hello world', 'text/plain');
            syn.$l.blobToDownload(blob, 'helloworld.txt');
        },

        btn_blobUrlToBlob_click() {
            var createBlob = syn.$l.createBlob('helloworld', 'text/plain');
            var blobUrl = syn.$r.createBlobUrl(createBlob);
            syn.$l.blobUrlToBlob(blobUrl, (blob) => {
                syn.$l.get('txt_blobUrlToBlob').value = blob;
            });
        },

        btn_blobUrlToDataUri_click() {
            var blob = syn.$l.createBlob('helloworld', 'text/plain');
            var blobUrl = syn.$r.createBlobUrl(blob);
            syn.$l.blobUrlToDataUri(blobUrl, (error, dataUri) => {
                if (error) {
                    console.log(error);
                }
                syn.$l.get('txt_blobUrlToDataUri').value = dataUri;
            });
        },

        async btn_blobToBase64_click() {
            var blob = syn.$l.createBlob('hello world', 'text/plain');
            syn.$l.get('txt_blobToBase64').value = await syn.$l.blobToBase64(blob);
        },

        async btn_base64ToBlob_click() {
            var blob = syn.$l.createBlob('hello world', 'text/plain');
            var base64 = await syn.$l.blobToBase64(blob);

            var mimeType = base64?.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0];
            var realData = base64.split(',')[1];

            syn.$l.get('txt_base64ToBlob').value = syn.$l.base64ToBlob(realData, mimeType).size;
        },

        async btn_blobToFile_click() {
            var blob = syn.$l.createBlob('hello world', 'text/plain');
            var file = await syn.$l.blobToFile(blob, 0);
            syn.$l.get('txt_blobToFile').value = file.size;
        },

        async btn_fileToBase64_click() {
            var blob = syn.$l.createBlob('hello world', 'text/plain');
            var file = await syn.$l.blobToFile(blob, 0);
            syn.$l.get('txt_fileToBase64').value = await syn.$l.fileToBase64(file);
        },

        async btn_fileToBlob_click() {
            var blob = syn.$l.createBlob('hello world', 'text/plain');
            var file = await syn.$l.blobToFile(blob, 0);
            syn.$l.get('txt_fileToBlob').value = await syn.$l.fileToBlob(file);
        }
    }
};
