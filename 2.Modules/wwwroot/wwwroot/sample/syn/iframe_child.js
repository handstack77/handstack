'use strict';
let $iframe_child = {
    prop: {
        childrenChannel: null
    },

    hook: {
        pageLoad() {
            var channelID = 'channelID';
            if (window != window.parent && channelID) {
                $this.prop.childrenChannel = syn.$n.rooms.connect({
                    debugOutput: true,
                    window: window.parent,
                    origin: '*',
                    scope: channelID
                });

                $this.prop.childrenChannel.bind('request', function (transaction, params) {
                    alert('iframe_child request 수신: ' + JSON.stringify(params));
                    return 'iframe_child 응답: ' + JSON.stringify(params);
                });
            }
        }
    },

    event: {
        btnChildren2Parent_click() {
            if ($this.prop.childrenChannel != null) {
                $this.prop.childrenChannel.emit({
                    method: 'response',
                    params: ['response data']
                });
            }
            else {
                alert('부모 화면과 연결되지 않았습니다.');
            }
        }
    }
}
