'use strict';
let $signin = {
    prop: {
        clientIP: '',
        tabOrderControls: null,
    },

    hook: {
        async pageLoad() {
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

            $this.prop.clientIP = await syn.$b.getIpAddress();
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

            var password = syn.$l.get('txtPassword').value.trim();
            if ($string.isNullOrEmpty(password) == true) {
                syn.$w.alert('비밀번호를 입력하세요');
                return;
            }

            $this.method.handleLoginCredentialMail(loginID, password);
        }
    },

    method: {
        async handleLoginCredentialMail(loginID, password) {
            var result = await syn.$w.apiHttp(`/checkup/api/account/login?userID=${loginID}&password=${syn.$c.sha256(password)}&clientIP=${$this.prop.clientIP}`).send();
            if (result && $string.isNullOrEmpty(result.error) == true) {
                location.href = result.message;
            }
            else {
                syn.$w.alert('로그인 이메일 주소 또는 비밀번호를 확인하세요');
            }
        }
    }
}
