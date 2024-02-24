'use strict';
let $redirection = {
    hook: {
        pageLoad() {
            var linkData = null;
            var cookieValue = syn.$r.getCookie('HandStack.LinkData');
            if (cookieValue) {
                linkData = JSON.parse(cookieValue);
                syn.$r.deleteCookie('HandStack.LinkData');
            }

            var message = '페이지를 찾을 수 없습니다';
            if ($object.isNullOrUndefined(linkData) == true) {
                message = '만료된 요청 이거나 요청한 정보를 찾지 못했습니다';
            }
            else {
                switch (linkData.LinkType) {
                    case '1':
                        message = '요청 정보를 검증하는 도중 오류가 발생했습니다';
                        break;
                    case '2':
                    case '4':
                        syn.$w.setStorage('handstack_linkData', syn.$c.base64Encode(cookieValue), true);
                        location.href = '/';
                        return;
                        break;
                    case '3':
                        message = '현재 로그인 계정과 링크의 계정이 다릅니다.<br />"{0}" 계정으로 로그인 해야 합니다'.format(linkData.ReceiverID);
                        break;
                    case '5':
                        message = '요청 정보를 인증하는 도중 오류가 발생했습니다';
                        break;
                }
            }

            syn.$l.querySelector('#notfound').style.display = 'block';
            syn.$l.querySelector('div.notfound h2').innerHTML = message;
        }
    }
};
