'use strict';
let $signin = {
    prop: {
        clientIP: '',
        tabOrderControls: null,
    },

    hook: {
        async pageLoad() {
            // https://developers.google.com/identity/gsi/web/reference/html-reference?hl=ko
            window.googleLoginCallback = function (response) {
                var token = response.credential;
                var base64Url = token.split('.')[1];
                var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                $this.method.handleLoginCredentialMail(JSON.parse(syn.$c.base64Decode(base64)));
            };

            syn.$w.loadScript('https://accounts.google.com/gsi/client', null, true);

            syn.$m.insertAfter(syn.$m.create({
                tag: 'div',
                id: 'g_id_onload',
                attributes: {
                    'data-client_id': '368671882552-bng2l9m6lkd10jv87gsubl6p6ifqujcc.apps.googleusercontent.com',
                    'data-callback':'googleLoginCallback'
                }
            }), document.body);

            var tokenID = syn.$w.getStorage('program_token', true);
            if (tokenID && syn.$r.getCookie('HandStack.TokenID')) {
                var cookieTokenID = syn.$r.getCookie('HandStack.TokenID');
                if (tokenID == cookieTokenID) {
                    location.href = '../main.html';
                    return;
                }
            }

            syn.$r.deleteCookie('HandStack.TokenID', '/');
            syn.$r.deleteCookie('HandStack.Cookies', '/');
            syn.$r.deleteCookie('HandStack.Member', '/');
            syn.$r.deleteCookie('HandStack.Variable', '/');
            syn.$r.deleteCookie('HandStack.BearerToken', '/');

            localStorage.removeItem('program_token');
            sessionStorage.clear();

            var cacheConfig = JSON.parse(sessionStorage.getItem('synConfig'));
            if (cacheConfig) {
                sessionStorage.setItem('synConfig', JSON.stringify(cacheConfig));
            }

            syn.$l.addEvent(window, 'storage', $this.event.window_storage);

            if (syn.Config.DomainAPIServer != null) {
                var apiService = syn.Config.DomainAPIServer;
                var apiServices = {};
                if (window.bearerToken) {
                    apiServices.BearerToken = window.bearerToken;
                }
                apiServices[syn.Config.SystemID + syn.Config.Environment.substring(0, 1)] = apiService;
                syn.$w.setStorage('apiServices', apiServices, false);
            }

            syn.$l.get('txtLoginID').focus();

            $this.prop.tabOrderControls = [
                { elID: "txtLoginID", tagName: "INPUT", formID: "form1", type: "textbox", top: 0, left: 0 },
                { elID: "btnLogin", tagName: "BUTTON", formID: "form1", type: "button", top: 0, left: 0 },
            ];

            $this.prop.clientIP = await syn.$w.apiHttp('/checkup/api/index/client-ip').send();
        },
    },

    event: {
        window_storage(evt) {
            if (evt.key == 'program_token' && evt.newValue != '') {
                location.reload();
            }
        },

        async btnLogin_click() {
            var loginID = syn.$l.get('txtLoginID').value.trim();

            if ($string.isNullOrEmpty(loginID) == true) {
                syn.$w.alert('로그인 이메일 주소를 입력하세요');
                return;
            }

            $this.method.handleLoginCredentialMail({
                name: '',
                email: loginID,
            });
        }
    },

    method: {
        async handleLoginCredentialMail(payload) {
            if (payload) {
                if (payload.iss && payload.iss.indexOf('google') > -1) {
                    var result = await syn.$w.apiHttp(`/checkup/api/account/checkin?userID=${payload.email}&userName=${payload.name}&clientIP=${$this.prop.clientIP}`).send();
                    if (result && $string.isNullOrEmpty(result.error) == true && $string.isNullOrEmpty(result.message) == false) {
                        location.href = result.message;
                    }
                    else {
                        syn.$w.alert(`로그인을 할 수 없습니다.<br/>${result.error}`);
                    }
                }
                else {
                    var result = await syn.$w.apiHttp(`/checkup/api/account/email?userID=${payload.email}&userName=${payload.name}&clientIP=${$this.prop.clientIP}`).send();
                    if (result && $string.isNullOrEmpty(result.error) == true) {
                        syn.$l.get('txtLoginID').value = '';
                        syn.$w.alert(`"${payload.email}"에 로그인 인증 메일을 전송했습니다. 메일 수신함을 확인하세요`);
                    }
                    else {
                        syn.$w.alert(`로그인 인증 메일을 발송하지 못했습니다.<br/>${result.error}`);
                    }
                }
            }
            else {
                syn.$w.alert(`이메일 주소 확인이 필요합니다`);
            }
        }
    }
}
