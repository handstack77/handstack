/// <reference path="/js/syn.js" />

(function (context) {
    'use strict';
    syn.uicontrols = syn.uicontrols || new syn.module();
    var $htmleditor = syn.uicontrols.$htmleditor || new syn.module();

    $htmleditor.extend({
        name: 'syn.uicontrols.$htmleditor',
        version: '1.0.0',
        applicationID: '',
        editorPendings: [],
        editorControls: [],
        defaultSetting: {
            businessID: '',
            applicationID: '',
            selector: '',
            fileManagerServer: '',
            repositoryID: null,
            dependencyID: null,
            relative_urls: false,
            remove_script_host: false,
            convert_urls: false,
            isNumberTempDependency: true,
            height: 300,
            imageFileSizeLimit: 300000,
            viewerHtml: '<html><head><base href="/"><style type="text/css">body { font-family: \'맑은 고딕\', 돋움체; font-size: 12px; }</style><link type="text/css" rel="stylesheet" href="/lib/tinymce/skins/ui/oxide/content.min.css"><link type="text/css" rel="stylesheet" href="/lib/tinymce/skins/content/default/content.min.css"></head><body id="tinymce" class="mce-content-body">{0}<script>document.onselectstart = function () { return false; }; document.oncontextmenu = function () { return false; }; document.addEventListener && document.addEventListener("click", function(e) {for (var elm = e.target; elm; elm = elm.parentNode) {if (elm.nodeName === "A" && !(e.ctrlKey && !e.altKey)) {e.preventDefault();}}}, false);</script></body></html>',
            language: 'ko_KR',
            // plugins: [
            //     'autolink link image lists print preview hr anchor pagebreak',
            //     'searchreplace visualblocks visualchars code insertdatetime media nonbreaking',
            //     'table template paste powerpaste export powerpaste advcode help'
            // ],
            plugins: ['autolink link image lists print hr anchor pagebreak searchreplace visualblocks visualchars code insertdatetime media nonbreaking table paste help'],
            // toolbar: 'styleselect | bold italic forecolor backcolor table | alignleft aligncenter alignright | bullist numlist outdent indent | link image media | preview export code help',
            toolbar: 'styleselect | bold italic forecolor backcolor table | alignleft aligncenter alignright | link image | code help',
            menubar: false, // 'file edit view insert format tools table help',
            content_style: 'body { font-family: \'맑은 고딕\', 돋움체; font-size: 12px; }',
            powerpaste_word_import: 'merge',
            powerpaste_googledocs_import: 'merge',
            defaultHtmlContent: null,
            table_default_attributes: { 'border': '1', 'width': '100%' },
            table_default_styles: { 'border-collapse': 'collapse', 'width': '100%' },
            table_responsive_width: false,
            limitTableWidth: null,
            verify_html: false,
            table_sizing_mode: 'fixed',
            images_file_types: 'jpeg,jpg,png,gif,bmp,webp,JPEG,JPG,PNG,GIF,BMP,WEBP',
            paste_data_images: true,
            resize: false,
            allowExternalLink: false,
            prefixHtml: '',
            suffixHtml: '',
            limitGuideLineWidth: '',
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

        concreate() {
            if (window.tinymce) {
            }
            else {
                syn.$w.loadScript('/lib/tinymce/tinymce.min.js');
            }
        },

        controlLoad(elID, setting) {
            if (window.tinymce) {
                $htmleditor.lazyControlLoad(elID, setting);
            }
            else {
                var editorIntervalID = setInterval(function () {
                    if (window.tinymce) {
                        var length = $htmleditor.editorPendings.length;
                        for (var i = 0; i < length; i++) {
                            var item = $htmleditor.editorPendings[i];

                            clearInterval(item.intervalID);
                            $htmleditor.lazyControlLoad(item.elID, item.setting);
                        }

                        $htmleditor.editorPendings.length = 0;
                    }
                }, 25);

                $htmleditor.editorPendings.push({
                    elID: elID,
                    setting: setting,
                    intervalID: editorIntervalID
                });
            }
        },

        lazyControlLoad(elID, setting) {
            var el = syn.$l.get(elID);

            setting = syn.$w.argumentsExtend($htmleditor.defaultSetting, setting);

            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook.controlInit) {
                var moduleSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleSettings);
            }

            if ($string.isNullOrEmpty(setting.repositoryID) == false) {
                if (location.pathname.startsWith((syn.Config.TenantAppRequestPath ? `/${syn.Config.TenantAppRequestPath}/` : '/app/')) == true) {
                    if ($string.isNullOrEmpty($htmleditor.applicationID) == true) {
                        $htmleditor.applicationID = syn.$w.ManagedApp.ApplicationID;
                    }
                }
                else {
                    if ($string.isNullOrEmpty($htmleditor.applicationID) == true) {
                        $htmleditor.applicationID = syn.$w.Variable.ApplicationID || syn.$w.User.ApplicationID || syn.Config.ApplicationID;
                    }
                }

                if ($string.isNullOrEmpty($htmleditor.applicationID) == true) {
                    syn.$l.eventLog('$htmleditor.controlLoad', '파일 컨트롤 초기화 오류, ApplicationID 정보 확인 필요', 'Error');
                }

                if (syn.Config.FileBusinessIDSource && syn.Config.FileBusinessIDSource != 'None') {
                    if (syn.Config.FileBusinessIDSource == 'Cookie') {
                        syn.uicontrols.$fileclient.businessID = syn.$r.getCookie('FileBusinessID');
                    }
                    else if (syn.Config.FileBusinessIDSource == 'SessionStorage') {
                        syn.uicontrols.$fileclient.businessID = syn.$w.getStorage('FileBusinessID');
                    }
                }

                if ($string.isNullOrEmpty(syn.uicontrols.$fileclient.businessID) == true) {
                    syn.uicontrols.$fileclient.businessID = syn.$w.User.WorkCompanyNo;
                }

                if ($string.isNullOrEmpty(syn.uicontrols.$fileclient.businessID) == true) {
                    syn.uicontrols.$fileclient.businessID = '0';
                }

                if (syn.Config && syn.Config.FileManagerServer) {
                    setting.fileManagerServer = syn.Config.FileManagerServer;
                }

                if ($string.isNullOrEmpty(setting.fileManagerServer) == true) {
                    syn.$l.eventLog('$htmleditor.fileManagerServer', 'HTML 편집기 업로드 초기화 오류, 파일 서버 정보 확인 필요', 'Error');
                }

                if ($string.isNullOrEmpty(setting.dependencyID) == true) {
                    if (setting.isNumberTempDependency == true) {
                        setting.dependencyID = $date.toTicks(new Date()).toString();
                    }
                    else {
                        setting.dependencyID = syn.uicontrols.$fileclient.getTemporaryDependencyID(elID);
                    }
                }

                setting.images_upload_handler = function (file, success, failure) {
                    var uploadHandler = function (blobInfo, success, failure) {
                        var xhr = syn.$w.xmlHttp();
                        xhr.withCredentials = false;

                        var targetUrl = setting.fileManagerServer + '/repository/api/storage/upload-file?RepositoryID={0}&DependencyID={1}'.format(setting.repositoryID, setting.dependencyID);

                        if ($string.isNullOrEmpty($htmleditor.applicationID) == false) {
                            targetUrl = targetUrl + '&applicationID=' + $htmleditor.applicationID;
                        }

                        xhr.open('POST', targetUrl);
                        xhr.onload = function () {
                            if (xhr.status != 200) {
                                var error = 'HTTP Error code: {0}, text: {1}'.format(xhr.status, xhr.statusText);
                                syn.$l.eventLog('$htmleditor.images_upload_handler', error, 'Warning');
                                failure(error);
                                return;
                            }

                            try {
                                var response = JSON.parse(xhr.responseText);

                                if (response && response.Result == true) {
                                    syn.$r.path = setting.fileManagerServer + '/repository/api/storage/action-handler';
                                    syn.$r.params['action'] = 'GetItem';
                                    syn.$r.params['repositoryID'] = setting.repositoryID;
                                    syn.$r.params['itemID'] = response.ItemID;

                                    if ($string.isNullOrEmpty($htmleditor.applicationID) == false) {
                                        syn.$r.params['applicationID'] = $htmleditor.applicationID;
                                    }

                                    var xhrGetItem = syn.$w.xmlHttp();
                                    xhrGetItem.onreadystatechange = function () {
                                        if (xhrGetItem.readyState === XMLHttpRequest.DONE) {
                                            if (xhrGetItem.status === 200) {
                                                var result = JSON.parse(xhrGetItem.responseText);
                                                // response.location = setting.fileManagerServer + '/repository/api/storage/http-download-file?RepositoryID={0}&ItemID={1}'.format(setting.repositoryID, response.ItemID);
                                                response.location = result.AbsolutePath;
                                                success(response.location);

                                                setTimeout(function () {
                                                    var uploadedImage = tinymce.activeEditor.$('img[src$="' + response.location + '"]')
                                                    if (uploadedImage.length > 0) {
                                                        var width = blobInfo.width;
                                                        var height = blobInfo.height;

                                                        tinymce.activeEditor.dom.setStyle(uploadedImage, 'width', width);
                                                        tinymce.activeEditor.dom.setStyle(uploadedImage, 'height', height);

                                                        uploadedImage.attr('width', width);
                                                        uploadedImage.attr('height', height);

                                                        uploadedImage.after('&nbsp;');
                                                    }
                                                }, 100);
                                            }
                                            else {
                                                syn.$l.eventLog('$htmleditor.images_upload_handler', 'async url: ' + url + ', status: ' + xhrGetItem.status.toString() + ', responseText: ' + xhrGetItem.responseText, 'Error');
                                            }
                                        }
                                    };

                                    xhrGetItem.open('GET', syn.$r.url(), true);
                                    xhrGetItem.send();
                                } else {
                                    var error = response.Message;
                                    syn.$w.alert('이미지 업로드 실패: {0}'.format(error));
                                    syn.$l.eventLog('$htmleditor.images_upload_handler', error, 'Warning');
                                    failure(error);
                                    return;
                                }
                            } catch (error) {
                                syn.$w.alert('이미지 업로드 오류: {0}'.format(error.message));
                                syn.$l.eventLog('$htmleditor.images_upload_handler', error, 'Warning');
                                failure(error);
                            }
                        };

                        xhr.onerror = function () {
                            var error = 'HTTP Error code: {0}, text: {1}'.format(xhr.status, xhr.statusText);
                            syn.$l.eventLog('$htmleditor.images_upload_handler', error, 'Warning');
                            failure(error);
                        };

                        var formData = new FormData();
                        formData.append('file', blobInfo.blob, blobInfo.fileName);
                        xhr.send(formData);
                    }

                    var fileSize = file.blob().size;
                    if (setting.imageFileSizeLimit < fileSize) {
                        var message = '에디터에 표시 가능한 이미지 파일크기는 {0} 미만입니다'.format($number.toByteString(setting.imageFileSizeLimit));
                        syn.$w.alert(message);

                        var blobUri = file.blobUri();
                        syn.$r.revokeBlobUrl(blobUri);
                        failure(message);

                        var tempImage = tinymce.activeEditor.$('img[src$="' + blobUri + '"]')
                        if (tempImage.length > 0) {
                            tempImage.remove();
                        }
                    }
                    else {
                        try {
                            var mod = window[syn.$w.pageScript];
                            var eventHandler = mod.event['{0}_beforeUploadImageResize'.format(elID)];
                            if (eventHandler) {
                                // txtCONTENTS_beforeUploadImageResize(elID, blobInfo, callback) {
                                //     syn.uicontrols.$htmleditor.resizeImage(blobInfo, 320).then(function (adjustBlob) {
                                //         callback(adjustBlob);
                                // 
                                //         var editor = syn.uicontrols.$htmleditor.getHtmlEditor(elID);
                                //         editor.execCommand('mceRepaint');
                                //     });
                                // },
                                eventHandler.apply(el, [elID, file, (adjustBlob) => {
                                    uploadHandler({
                                        blob: adjustBlob.blob,
                                        width: adjustBlob.width,
                                        height: adjustBlob.height,
                                        fileName: file.filename()
                                    }, success, failure);
                                }]);
                            }
                            else {
                                $htmleditor.resizeImage(file, 0).then((adjustBlob) => {
                                    uploadHandler({
                                        blob: adjustBlob.blob,
                                        width: adjustBlob.width,
                                        height: adjustBlob.height,
                                        fileName: file.filename()
                                    }, success, failure);

                                    var editor = syn.uicontrols.$htmleditor.getHtmlEditor(elID);
                                    editor.execCommand('mceRepaint');
                                });
                            }
                        } catch (error) {
                            syn.$l.eventLog('$htmleditor.images_upload_handler', error.toString(), 'Error');
                        }
                    }
                };
            }
            else {
                syn.$l.eventLog('$htmleditor.fileManagerServer', `${elID}: HTML 편집기내 이미지 파일 업로드 사용 안함`, 'Debug');
            }

            setting.paste_preprocess = function (plugin, args) {
                // console.log(args.content);
                // debugger;
                // $this.blobUrlToString(args.content.substring(10, args.content.length - 2));
                // args.content += ' preprocess';
            };

            setting.paste_postprocess = function (plugin, args) {
                if (args.node.firstElementChild && args.node.firstElementChild.tagName == 'TABLE' && (args.mode && args.mode == 'merge') == false) {
                    var table = args.node.firstElementChild;
                    table.border = '1';
                    table.cellspacing = '0';
                    table.cellpadding = '0';
                    syn.$m.setStyle(table, 'border-collapse', 'collapse');

                    var headers = table.querySelectorAll('thead tr:first-child td');
                    var headerLength = headers.length;
                    if (headerLength > 0) {
                        for (var i = 0; i < headerLength; i++) {
                            var header = headers[i];
                            syn.$m.setStyle(header, 'background-color', '#ecf0f1');
                        }
                    }
                    else {
                        headers = table.querySelectorAll('tr:first-child td');
                        headerLength = headers.length;
                        if (headerLength > 0) {
                            for (var i = 0; i < headerLength; i++) {
                                var header = headers[i];
                                syn.$m.setStyle(header, 'background-color', '#ecf0f1');
                            }
                        }
                    }
                }
            };

            setting.width = el.style.width || 320;
            setting.height = el.style.height || 240;

            el.setAttribute('id', el.id + '_hidden');
            el.setAttribute('syn-options', JSON.stringify(setting));
            el.style.display = 'none';

            var parent = el.parentNode;
            var wrapper = document.createElement('div');
            wrapper.style.width = setting.width
            wrapper.style.height = setting.height
            wrapper.id = elID;
            wrapper.innerHTML = $string.isNullOrEmpty(el.innerHTML) == true ? '<div></div>' : el.innerHTML;

            parent.appendChild(wrapper);
            setting.selector = '#' + elID;

            setting.init_instance_callback = function (editor) {
                var length = $htmleditor.editorControls.length;
                for (var i = 0; i < length; i++) {
                    var item = $htmleditor.editorControls[i];
                    if (item.id == elID) {
                        item.editor = editor;
                        break;
                    }
                }

                var el = syn.$l.get(elID);
                var setInitValue = el.getAttribute('setInitValue');
                if ($string.isNullOrEmpty(setInitValue) == false) {
                    $htmleditor.setValue(elID, setInitValue);
                }

                editor.on('keydown', function (e) {
                    var key = e.keyCode || e.which;

                    if (key == 9) {
                        editor.execCommand('mceInsertContent', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
                        tinymce.dom.Event.cancel(e);
                        e.preventDefault();
                        return;
                    }
                });

                editor.on('ObjectResized', function (e) {
                    if (e.target.nodeName == 'TABLE') {
                        var table = e.target;
                        if ($string.isNullOrEmpty(setting.limitTableWidth) == false && setting.limitTableWidth < table.style.width) {
                            table.style.width = setting.limitTableWidth;
                        }

                        if ($string.isNullOrEmpty(table.style.width) == false) {
                            table.setAttribute('width', table.style.width);
                        }

                        if ($string.isNullOrEmpty(table.style.height) == false) {
                            table.setAttribute('height', table.style.height);
                        }

                        var tds = e.target.querySelectorAll('td');
                        var length = tds.length;
                        for (var i = 0; i < length; i++) {
                            var td = tds[i];
                            if ($string.isNullOrEmpty(td.style.width) == false) {
                                td.setAttribute('width', td.style.width);
                            }

                            if ($string.isNullOrEmpty(td.style.height) == false) {
                                td.setAttribute('height', td.style.height);
                            }
                        }
                    }

                    if (e.target.nodeName == 'IMG') {
                        var selectedImage = tinymce.activeEditor.selection.getNode();

                        var mod = window[syn.$w.pageScript];
                        var eventHandler = mod.event['{0}_imageResized'.format(elID)];
                        if (eventHandler) {
                            // txtCONTENTS_imageResized(elID, evt, editor, selectedImage) {
                            //     if (evt.width > 600) {
                            //         var ratio = (evt.width / evt.height);
                            //         evt.width = 600;
                            //         evt.height = parseFloat(evt.width / ratio);
                            //         tinymce.activeEditor.dom.setStyle(selectedImage, 'width', evt.width);
                            //         tinymce.activeEditor.dom.setStyle(selectedImage, 'height', evt.height);
                            // 
                            //         selectedImage.setAttribute('width', evt.width);
                            //         selectedImage.setAttribute('height', evt.height);
                            //     }
                            // }
                            eventHandler.apply(el, [elID, e, editor, selectedImage]);
                        }
                    }
                });

                if ($string.isNullOrEmpty(setting.defaultHtmlContent) == false) {
                    editor.setContent(setting.defaultHtmlContent);
                }

                if (setting.readonly == true) {
                    Array.from(editor.getDoc().querySelectorAll('a')).map(function (el) {
                        el.target = '_blank';
                    });
                }

                if (setting.readonly == true && setting.allowExternalLink == true) {
                    Array.from(editor.getDoc().querySelectorAll('.mce-object-iframe')).map(function (el) {
                        el.setAttribute('data-mce-selected', '2');
                    });
                }

                var mod = window[syn.$w.pageScript];
                var eventHandler = mod.event['{0}_documentReady'.format(elID)];
                if (eventHandler) {
                    eventHandler.apply(el, [elID, editor]);
                }
            };

            tinymce.addI18n('ko_KR', {
                "Redo": "다시 실행",
                "Undo": "실행 취소",
                "Cut": "잘라내기",
                "Copy": "복사",
                "Paste": "붙여넣기",
                "Select all": "전체선택",
                "New document": "새 문서",
                "Ok": "확인",
                "Cancel": "취소",
                "Visual aids": "시각교재",
                "Bold": "굵게",
                "Italic": "기울임꼴",
                "Underline": "밑줄",
                "Strikethrough": "취소선",
                "Superscript": "위 첨자",
                "Subscript": "아래 첨자",
                "Clear formatting": "서식 지우기",
                "Align left": "왼쪽 맞춤",
                "Align center": "가운데 맞춤",
                "Align right": "오른쪽 맞춤",
                "Justify": "양쪽 맞춤",
                "Bullet list": "글머리 기호 목록",
                "Numbered list": "번호 매기기 목록",
                "Decrease indent": "내어쓰기",
                "Increase indent": "들여쓰기",
                "Alternative description": "대체 설명문구",
                "Close": "닫기",
                "Formats": "서식",
                "Your browser doesn't support direct access to the clipboard. Please use the Ctrl+X\/C\/V keyboard shortcuts instead.": "브라우저가 클립보드 접근을 지원하지 않습니다. Ctrl+X\/C\/V 단축키를 이용하십시오.",
                "Headers": "머리글",
                "Header 1": "머리글 1",
                "Header 2": "머리글 2",
                "Header 3": "머리글 3",
                "Header 4": "머리글 4",
                "Header 5": "머리글 5",
                "Header 6": "머리글 6",
                "Headings": "제목",
                "Heading 1": "제목 1",
                "Heading 2": "제목 2",
                "Heading 3": "제목 3",
                "Heading 4": "제목 4",
                "Heading 5": "제목 5",
                "Heading 6": "제목 6",
                "Preformatted": "서식 미설정",
                "Div": "Div",
                "Pre": "Pre",
                "Code": "코드",
                "Paragraph": "단락",
                "Blockquote": "인용문",
                "Inline": "인라인",
                "Blocks": "블록",
                "Paste is now in plain text mode. Contents will now be pasted as plain text until you toggle this option off.": "스타일복사 끄기. 이 옵션을 끄기 전에는 복사 시, 스타일이 복사되지 않습니다.",
                "Fonts": "글꼴",
                "Font Sizes": "글꼴 크기",
                "Class": "클래스",
                "Browse for an image": "이미지 찾기",
                "OR": "또는",
                "Drop an image here": "여기로 이미지 끌어오기",
                "Upload": "업로드",
                "Block": "블록",
                "Align": "정렬",
                "Default": "기본",
                "Circle": "원",
                "Disc": "원반",
                "Square": "사각",
                "Lower Alpha": "알파벳 소문자",
                "Lower Greek": "그리스어 소문자",
                "Lower Roman": "로마자 소문자",
                "Upper Alpha": "알파벳 소문자",
                "Upper Roman": "로마자 대문자",
                "Anchor...": "앵커...",
                "Name": "이름",
                "Id": "아이디",
                "Id should start with a letter, followed only by letters, numbers, dashes, dots, colons or underscores.": "아이디는 문자, 숫자, 대시, 점, 콜론 또는 밑줄로 시작해야합니다.",
                "You have unsaved changes are you sure you want to navigate away?": "저장하지 않은 정보가 있습니다. 이 페이지를 벗어나시겠습니까?",
                "Restore last draft": "마지막 초안 복원",
                "Special character...": "특수 문자...",
                "Source code": "소스코드",
                "Insert\/Edit code sample": "코드샘플 삽입\/편집",
                "Language": "언어",
                "Code sample...": "코드 샘플...",
                "Color Picker": "색 선택기",
                "R": "R",
                "G": "G",
                "B": "B",
                "Left to right": "왼쪽에서 오른쪽",
                "Right to left": "오른쪽에서 왼쪽",
                "Emoticons...": "이모티콘...",
                "Metadata and Document Properties": "메타데이터와 문서 속성",
                "Title": "제목",
                "Keywords": "키워드",
                "Description": "설명",
                "Robots": "로봇",
                "Author": "저자",
                "Encoding": "인코딩",
                "Fullscreen": "전체화면",
                "Action": "동작",
                "Shortcut": "단축키",
                "Help": "도움말",
                "Address": "주소",
                "Focus to menubar": "메뉴에 포커스",
                "Focus to toolbar": "툴바에 포커스",
                "Focus to element path": "element path에 포커스",
                "Focus to contextual toolbar": "켄텍스트 툴바에 포커스",
                "Insert link (if link plugin activated)": "링크 삽입 (link 플러그인이 활성화된 상태에서)",
                "Save (if save plugin activated)": "저장 (save 플러그인이 활성화된 상태에서)",
                "Find (if searchreplace plugin activated)": "찾기(searchreplace 플러그인이 활성화된 상태에서)",
                "Plugins installed ({0}):": "설치된 플러그인 ({0}):",
                "Premium plugins:": "고급 플러그인",
                "Learn more...": "좀 더 살펴보기",
                "You are using {0}": "{0}를 사용중",
                "Plugins": "플러그인",
                "Handy Shortcuts": "단축키",
                "Horizontal line": "가로",
                "Insert\/edit image": "이미지 삽입\/수정",
                "Image description": "이미지 설명",
                "Source": "소스",
                "Dimensions": "크기",
                "Constrain proportions": "작업 제한",
                "General": "일반",
                "Advanced": "고급",
                "Style": "스타일",
                "Vertical space": "수직 공백",
                "Horizontal space": "수평 공백",
                "Border": "테두리",
                "Insert image": "이미지 삽입",
                "Image...": "이미지...",
                "Image list": "이미지 목록",
                "Rotate counterclockwise": "시계반대방향으로 회전",
                "Rotate clockwise": "시계방향으로 회전",
                "Flip vertically": "수직 뒤집기",
                "Flip horizontally": "수평 뒤집기",
                "Edit image": "이미지 편집",
                "Image options": "이미지 옵션",
                "Zoom in": "확대",
                "Zoom out": "축소",
                "Crop": "자르기",
                "Resize": "크기 조절",
                "Orientation": "방향",
                "Brightness": "밝기",
                "Sharpen": "선명하게",
                "Contrast": "대비",
                "Color levels": "색상레벨",
                "Gamma": "감마",
                "Invert": "반전",
                "Apply": "적용",
                "Back": "뒤로",
                "Insert date\/time": "날짜\/시간삽입",
                "Date\/time": "날짜\/시간",
                "Insert\/Edit Link": "링크 삽입\/편집",
                "Insert\/edit link": "링크 삽입\/수정",
                "Text to display": "본문",
                "Url": "주소",
                "Open link in...": "...에서 링크 열기",
                "Current window": "현재 창",
                "None": "없음",
                "New window": "새창",
                "Remove link": "링크삭제",
                "Anchors": "책갈피",
                "Link...": "링크...",
                "Paste or type a link": "링크를 붙여넣거나 입력하세요",
                "The URL you entered seems to be an email address. Do you want to add the required mailto: prefix?": "현재 E-mail주소를 입력하셨습니다. E-mail 주소에 링크를 걸까요?",
                "The URL you entered seems to be an external link. Do you want to add the required http:\/\/ prefix?": "현재 웹사이트 주소를 입력하셨습니다. 해당 주소에 링크를 걸까요?",
                "Link list": "링크 리스트",
                "Insert video": "비디오 삽입",
                "Insert\/edit video": "비디오 삽입\/수정",
                "Insert\/edit media": "미디어 삽입\/수정",
                "Alternative source": "대체 소스",
                "Alternative source URL": "대체 원본 URL",
                "Media poster (Image URL)": "대표 이미지(이미지 URL)",
                "Paste your embed code below:": "아래에 코드를 붙여넣으세요:",
                "Embed": "삽입",
                "Media...": "미디어...",
                "Nonbreaking space": "띄어쓰기",
                "Page break": "페이지 구분자",
                "Paste as text": "텍스트로 붙여넣기",
                "Preview": "미리보기",
                "Print...": "인쇄...",
                "Save": "저장",
                "Find": "찾기",
                "Replace with": "교체",
                "Replace": "교체",
                "Replace all": "전체 교체",
                "Previous": "이전",
                "Next": "다음",
                "Find and replace...": "찾기 및 바꾸기...",
                "Could not find the specified string.": "문자를 찾을 수 없습니다.",
                "Match case": "대소문자 일치",
                "Find whole words only": "모두 일치하는 문자 찾기",
                "Spell check": "맞춤법 검사",
                "Ignore": "무시",
                "Ignore all": "전체무시",
                "Finish": "완료",
                "Add to Dictionary": "사전에 추가",
                "Insert table": "테이블 삽입",
                "Table properties": "테이블 속성",
                "Delete table": "테이블 삭제",
                "Cell": "셀",
                "Row": "열",
                "Column": "행",
                "Cell properties": "셀 속성",
                "Merge cells": "셀 합치기",
                "Split cell": "셀 나누기",
                "Insert row before": "이전에 행 삽입",
                "Insert row after": "다음에 행 삽입",
                "Delete row": "행 지우기",
                "Row properties": "행 속성",
                "Cut row": "행 잘라내기",
                "Copy row": "행 복사",
                "Paste row before": "이전에 행 붙여넣기",
                "Paste row after": "다음에 행 붙여넣기",
                "Insert column before": "이전에 행 삽입",
                "Insert column after": "다음에 열 삽입",
                "Delete column": "열 지우기",
                "Cols": "열",
                "Rows": "행",
                "Width": "넓이",
                "Height": "높이",
                "Cell spacing": "셀 간격",
                "Cell padding": "셀 안쪽 여백",
                "Show caption": "캡션 표시",
                "Left": "왼쪽",
                "Center": "가운데",
                "Right": "오른쪽",
                "Cell type": "셀 타입",
                "Scope": "범위",
                "Alignment": "정렬",
                "H Align": "가로 정렬",
                "V Align": "세로 정렬",
                "Top": "상단",
                "Middle": "중간",
                "Bottom": "하단",
                "Header cell": "헤더 셀",
                "Row group": "행 그룹",
                "Column group": "열 그룹",
                "Row type": "행 타입",
                "Header": "헤더",
                "Body": "바디",
                "Footer": "푸터",
                "Border color": "테두리 색",
                "Insert template...": "템플릿 삽입...",
                "Templates": "템플릿",
                "Template": "템플릿",
                "Text color": "문자 색깔",
                "Background color": "배경색",
                "Custom...": "직접 색깔 지정하기",
                "Custom color": "직접 지정한 색깔",
                "No color": "색상 없음",
                "Remove color": "색 제거",
                "Table of Contents": "목차",
                "Show blocks": "블럭 보여주기",
                "Show invisible characters": "안보이는 문자 보이기",
                "Word count": "단어 수",
                "Count": "개수",
                "Document": "문서",
                "Selection": "선택",
                "Words": "단어",
                "Words: {0}": "단어: {0}",
                "{0} words": "{0} 단어",
                "File": "파일",
                "Edit": "수정",
                "Insert": "삽입",
                "View": "보기",
                "Format": "포맷",
                "Table": "테이블",
                "Tools": "도구",
                "Powered by {0}": "Powered by {0}",
                "Rich Text Area. Press ALT-F9 for menu. Press ALT-F10 for toolbar. Press ALT-0 for help": "서식 있는 텍스트 편집기 입니다. ALT-F9를 누르면 메뉴, ALT-F10를 누르면 툴바, ALT-0을 누르면 도움말을 볼 수 있습니다.",
                "Image title": "이미지 제목",
                "Border width": "테두리 두께",
                "Border style": "테두리 스타일",
                "Error": "오류",
                "Warn": "경고",
                "Valid": "유효함",
                "To open the popup, press Shift+Enter": "팝업을 열려면 Shift+Enter를 누르십시오.",
                "Rich Text Area. Press ALT-0 for help.": "서식 있는 텍스트 영역. ALT-0을 누르면 도움말을 볼 수 있습니다.",
                "System Font": "시스템 글꼴",
                "Failed to upload image: {0}": "이미지 업로드 실패: {0}",
                "Failed to load plugin: {0} from url {1}": "플러그인 로드 실패:  URL: {1}에서의 {0}",
                "Failed to load plugin url: {0}": "플러그인 URL 로드 실패: {0}",
                "Failed to initialize plugin: {0}": "플러그인 초기화 실패: {0}",
                "example": "예제",
                "Search": "검색",
                "All": "모두",
                "Currency": "통화",
                "Text": "텍스트",
                "Quotations": "인용문",
                "Mathematical": "수학",
                "Extended Latin": "확장 라틴어",
                "Symbols": "기호",
                "Arrows": "화살표",
                "User Defined": "사용자 정의",
                "dollar sign": "달러 기호",
                "currency sign": "통화 기호",
                "euro-currency sign": "유로화 기호",
                "colon sign": "콜론 기호",
                "cruzeiro sign": "크루제이루 기호",
                "french franc sign": "프랑스 프랑 기호",
                "lira sign": "리라 기호",
                "mill sign": "밀 기호",
                "naira sign": "나이라 기호",
                "peseta sign": "페세타 기호",
                "rupee sign": "루피 기호",
                "won sign": "원 기호",
                "new sheqel sign": "뉴 세켈 기호",
                "dong sign": "동 기호",
                "kip sign": "킵 기호",
                "tugrik sign": "투그리크 기호",
                "drachma sign": "드라크마 기호",
                "german penny symbol": "독일 페니 기호",
                "peso sign": "페소 기호",
                "guarani sign": "과라니 기호",
                "austral sign": "아우스트랄 기호",
                "hryvnia sign": "그리브나 기호",
                "cedi sign": "세디 기호",
                "livre tournois sign": "리브르 트르누아 기호",
                "spesmilo sign": "스페스밀로 기호",
                "tenge sign": "텡게 기호",
                "indian rupee sign": "인도 루피 기호",
                "turkish lira sign": "터키 리라 기호",
                "nordic mark sign": "노르딕 마르크 기호",
                "manat sign": "마나트 기호",
                "ruble sign": "루블 기호",
                "yen character": "엔 기호",
                "yuan character": "위안 기호",
                "yuan character, in hong kong and taiwan": "대만 위안 기호",
                "yen\/yuan character variant one": "엔\/위안 문자 변형",
                "Loading emoticons...": "이모티콘 불러오는 중...",
                "Could not load emoticons": "이모티콘을 불러올 수 없음",
                "People": "사람",
                "Animals and Nature": "동물과 자연",
                "Food and Drink": "음식과 음료",
                "Activity": "활동",
                "Travel and Places": "여행과 장소",
                "Objects": "물건",
                "Flags": "깃발",
                "Characters": "문자",
                "Characters (no spaces)": "문자(공백 없음)",
                "{0} characters": "{0} 문자",
                "Error: Form submit field collision.": "오류: 양식 제출 필드 불일치",
                "Error: No form element found.": "오류: 양식 항목 없음",
                "Update": "업데이트",
                "Color swatch": "색상 견본",
                "Turquoise": "청록색",
                "Green": "초록색",
                "Blue": "파란색",
                "Purple": "보라색",
                "Navy Blue": "남색",
                "Dark Turquoise": "진한 청록색",
                "Dark Green": "진한 초록색",
                "Medium Blue": "중간 파란색",
                "Medium Purple": "중간 보라색",
                "Midnight Blue": "진한 파란색",
                "Yellow": "노란색",
                "Orange": "주황색",
                "Red": "빨간색",
                "Light Gray": "밝은 회색",
                "Gray": "회색",
                "Dark Yellow": "진한 노란색",
                "Dark Orange": "진한 주황색",
                "Dark Red": "진한 빨간색",
                "Medium Gray": "중간 회색",
                "Dark Gray": "진한 회색",
                "Light Green": "밝은 녹색",
                "Light Yellow": "밝은 노란색",
                "Light Red": "밝은 빨간색",
                "Light Purple": "밝은 보라색",
                "Light Blue": "밝은 파란색",
                "Dark Purple": "진한 보라색",
                "Dark Blue": "진한 파란색",
                "Black": "검은색",
                "White": "흰색",
                "Switch to or from fullscreen mode": "전체 화면으로\/에서 전환",
                "Open help dialog": "도움말 대화창 열기",
                "history": "기록",
                "styles": "스타일",
                "formatting": "포맷팅",
                "alignment": "정렬",
                "indentation": "들여쓰기",
                "permanent pen": "유성펜",
                "comments": "주석",
                "Format Painter": "서식 복사",
                "Insert\/edit iframe": "아이프레임 삽입\/편집",
                "Capitalization": "대문자화",
                "lowercase": "소문자",
                "UPPERCASE": "대문자",
                "Title Case": "제목을 대문자화",
                "Permanent Pen Properties": "영구 펜 특성",
                "Permanent pen properties...": "영구 펜 특성...",
                "Font": "글꼴",
                "Size": "크기",
                "More...": "더 보기...",
                "Spellcheck Language": "맞춤법 검사 언어",
                "Select...": "선택...",
                "Preferences": "환경설정",
                "Yes": "네",
                "No": "아니오",
                "Keyboard Navigation": "키 선택",
                "Version": "버전",
                "Anchor": "앵커",
                "Special character": "특수문자",
                "Code sample": "코드샘플",
                "Color": "색상",
                "Emoticons": "이모티콘",
                "Document properties": "문서 속성",
                "Image": "이미지",
                "Insert link": "링크 삽입 ",
                "Target": "대상",
                "Link": "링크",
                "Poster": "포스터",
                "Media": "미디어",
                "Print": "출력",
                "Prev": "이전",
                "Find and replace": "찾아서 교체",
                "Whole words": "전체 단어",
                "Spellcheck": "문법체크",
                "Caption": "캡션",
                "Insert template": "템플릿 삽입"
            });

            $htmleditor.editorControls.push({
                id: elID,
                editor: null,
                setting: $object.clone(setting)
            });

            tinymce.init(setting);
            if ($string.isNullOrEmpty(setting.limitGuideLineWidth) == false) {
                syn.$l.get(elID).controlPseudoStyle(' + div .tox-edit-area:after', '{content: "";width: 2px;height: 100%;background: #EF4444 repeat-y;top: 0px;left: {0};position: absolute;display: inline-block;}'.format(setting.limitGuideLineWidth))
            }

            if (setting.bindingID && syn.uicontrols.$data) {
                syn.uicontrols.$data.bindingSource(elID, setting.bindingID);
            }
        },

        resizeImage(file, maxSize) {
            var reader = new FileReader();
            var image = new Image();
            var canvas = document.createElement('canvas');
            var dataURItoBlob = function (dataURI) {
                var bytes = dataURI.split(',')[0].indexOf('base64') >= 0 ?
                    atob(dataURI.split(',')[1]) :
                    decodeURIComponent(dataURI.split(',')[1]);
                var mime = dataURI.split(',')[0].split(':')[1].split(';')[0];
                var max = bytes.length;
                var ia = new Uint8Array(max);
                for (var i = 0; i < max; i++)
                    ia[i] = bytes.charCodeAt(i);
                return new Blob([ia], { type: mime || 'image/jpeg' });
            };
            var resize = function () {
                var width = image.width;
                var height = image.height;
                if (width > height) {
                    if (maxSize <= 0) {
                        maxSize = 600;
                        if (width > maxSize) {
                            height *= maxSize / width;
                            width = maxSize;
                        }
                    }
                    else {
                        if (width > maxSize) {
                            height *= maxSize / width;
                            width = maxSize;
                        }
                    }
                } else {
                    if (maxSize <= 0) {
                        maxSize = 600;
                        if (height > maxSize) {
                            width *= maxSize / height;
                            height = maxSize;
                        }
                    }
                    else {
                        if (height > maxSize) {
                            width *= maxSize / height;
                            height = maxSize;
                        }
                    }
                }
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(image, 0, 0, width, height);
                var dataUrl = canvas.toDataURL('image/jpeg');
                return {
                    blob: dataURItoBlob(dataUrl),
                    width: width,
                    height: height,
                };
            };
            return new Promise(function (success, failure) {
                var blob = file.blob();
                if (!blob.type.match(/image.*/)) {
                    failure(new Error("이미지 파일 확인 필요"));
                    return;
                }
                reader.onload = function (readerEvent) {
                    image.onload = function () { return success(resize()); };
                    image.src = readerEvent.target.result;
                };
                reader.readAsDataURL(blob);
            });
        },

        getHtmlEditor(elID) {
            var editor = null;

            var length = $htmleditor.editorControls.length;
            for (var i = 0; i < length; i++) {
                var item = $htmleditor.editorControls[i];
                if (item.id == elID) {
                    editor = item.editor;
                    break;
                }
            }

            return editor;
        },

        getHtmlSetting(elID) {
            var setting = null;

            var length = $htmleditor.editorControls.length;
            for (var i = 0; i < length; i++) {
                var item = $htmleditor.editorControls[i];
                if (item.id == elID) {
                    setting = item.setting;
                    break;
                }
            }

            return setting;
        },

        // mode - design, readonly
        setMode(elID, mode) {
            var editor = $htmleditor.getHtmlEditor(elID);
            if (editor) {
                editor.setMode(mode);
            }
        },

        insertContent(elID, content) {
            var editor = $htmleditor.getHtmlEditor(elID);
            if (editor) {
                editor.insertContent(content);
            }
        },

        // https://www.tiny.cloud/docs-3x/reference/TinyMCE3x@Command_identifiers/
        execCommand(elID, command, uiState, value, args) {
            var result = false;
            var editor = $htmleditor.getHtmlEditor(elID);
            if (editor) {
                if ($object.isNullOrUndefined(uiState) == true) {
                    uiState = false;
                }
                result = editor.execCommand(command, uiState, value, args);
            }

            return result;
        },

        isDirty(elID) {
            var result = false;
            var editor = $htmleditor.getHtmlEditor(elID);
            if (editor) {
                result = editor.isDirty();
            }

            return result;
        },

        updateDependencyID(elID, targetDependencyID, callback) {
            var setting = $htmleditor.getHtmlSetting(elID);
            syn.$r.path = setting.fileManagerServer + '/repository/api/storage/action-handler';
            syn.$r.params['action'] = 'UpdateDependencyID';
            syn.$r.params['repositoryID'] = setting.repositoryID;
            syn.$r.params['sourceDependencyID'] = setting.dependencyID;
            syn.$r.params['targetDependencyID'] = targetDependencyID;

            syn.uicontrols.$fileclient.executeProxy(syn.$r.url(), callback);
        },

        getDependencyID(elID) {
            var val = '';
            var setting = $htmleditor.getHtmlSetting(elID);
            if (setting) {
                val = setting.dependencyID;
            }

            return val;
        },

        setDependencyID(elID, dependencyID) {
            var setting = $htmleditor.getHtmlSetting(elID);
            if (setting) {
                setting.dependencyID = dependencyID;
            }
        },

        getValue(elID, meta) {
            var result = '';
            var editor = $htmleditor.getHtmlEditor(elID);
            if (editor) {
                result = editor.getContent();
                var setting = $htmleditor.getHtmlSetting(elID);
                if ($string.isNullOrEmpty(setting.limitTableWidth) == false) {
                    var tables = result.match(/<table[^>]*>(.*?)/gmi);
                    if ($string.isNullOrEmpty(tables) == false) {
                        for (var i = 0; i < tables.length; i++) {
                            var html = tables[i];
                            if (html.indexOf('width=') == -1) {
                                result = result.replace(html, html.substring(0, (html.length - 1)) + ' width="{0}">'.format(setting.limitTableWidth))
                            }
                        }
                    }
                }

                if ($string.isNullOrEmpty(setting.prefixHtml) == false) {
                    result = setting.prefixHtml + result;
                }

                if ($string.isNullOrEmpty(setting.suffixHtml) == false) {
                    result = result + setting.suffixHtml;
                }
            }

            result = result.replace(/&amp;/gm, '&');
            result = result.replace(/\<p\>\<\/p\>/gm, '\<p\>&nbsp;\<\/p\>');
            result = result.replace(/\<p style="text-align: left;"\>\<\/p\>/gm, '\<p style="text-align: left;"\>&nbsp;\<\/p\>');
            result = result.replace(/\<p style="text-align: center;"\>\<\/p\>/gm, '\<p style="text-align: center;"\>&nbsp;\<\/p\>');
            result = result.replace(/\<p style="text-align: right;"\>\<\/p\>/gm, '\<p style="text-align: right;"\>&nbsp;\<\/p\>');

            return result;
        },

        setValue(elID, value, meta) {
            var editor = $htmleditor.getHtmlEditor(elID);
            if (editor) {
                var controlOptions = syn.$l.get('{0}_hidden'.format(elID)).getAttribute('syn-options');
                if ($object.isNullOrUndefined(controlOptions) == false) {
                    var setting = JSON.parse(controlOptions);
                    if ($string.isNullOrEmpty(setting.prefixHtml) == false) {
                        if ($string.isNullOrEmpty(setting.prefixHtml) == false && value.startsWith(setting.prefixHtml) == true) {
                            value = value.replace(setting.prefixHtml, '');
                        }
                    }

                    if ($string.isNullOrEmpty(setting.suffixHtml) == false) {
                        if ($string.isNullOrEmpty(setting.suffixHtml) == false && value.endsWith(setting.suffixHtml) == true) {
                            value = value.replace(setting.suffixHtml, '');
                        }
                    }
                }

                editor.setContent(value);
            }
            else {
                syn.$l.get(elID).setAttribute("setInitValue", value);
            }
        },

        clear(elID, isControlLoad) {
            var editor = $htmleditor.getHtmlEditor(elID);
            if (editor) {
                editor.setContent('');
            }
        },

        setLocale(elID, translations, control, options) {
        }
    });
    syn.uicontrols.$htmleditor = $htmleditor;
})(globalRoot);
