'use strict';
let $iframe_main = {
    event: {
        btnChildrenLoad_click() {
            var iframe = syn.$l.get('ifmChildren');
            iframe.src = 'iframe_child.html';
        },

        btnChildrenConnect_click() {
            var channelID = 'channelID';
            var connection = syn.$n.findChannel(channelID);
            if (connection == undefined) {
                var iframe = syn.$l.get('ifmChildren');
                var contentWindow = iframe.contentWindow;

                connection = syn.$n.rooms.connect({
                    debugOutput: true,
                    window: contentWindow,
                    origin: '*',
                    scope: channelID
                });

                connection.bind('response', function (origin, params) {
                    alert('iframe_main response 수신: ' + JSON.stringify(params));
                });
            }
            else {
                alert('이미 연결된 channelID 입니다: ' + channelID);
            }
        },

        btnParent2Children_click() {
            var channelID = 'channelID';
            var connection = syn.$n.findChannel(channelID);

            if (connection == undefined) {
                alert('먼저 "iframe 화면 로드", "iframe 연결" 버튼을 순서대로 클릭하세요.');
                return;
            }

            connection.call({
                method: 'request',
                params: ['request data'],
                error(error, message) {
                    alert('iframe_main request ERROR: ' + error + ' (' + message + ')');
                },
                success(val) {
                    alert('iframe_main request function returns: ' + val);
                }
            });
        }
    }
}
