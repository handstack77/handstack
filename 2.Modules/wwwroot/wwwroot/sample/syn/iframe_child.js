'use strict';
let $iframe_child = {
    prop: {
        childrenChannel: null
    },

    hook: {
        pageLoad() {
            var channelID = 'channelID';
            if (window != window.parent && channelID) {
                $this.prop.childrenChannel = syn.$n.rooms.connect({ window: window.parent, origin: '*', scope: channelID });
                $this.prop.childrenChannel.bind('request', function (evt, params) {
                    alert('iframe_child ' + params);
                });
            }
        }
    },

    event: {
        btnChildren2Parent_click() {
            if ($this.prop.childrenChannel != null) {
                $this.prop.childrenChannel.emit({
                    method: 'response',
                    params: ['response data'],
                    error(error, message) {
                        alert('iframe_child response ERROR: ' + error + ' (' + message + ')');
                    },
                    success(val) {
                        alert('iframe_child response function returns: ' + val);
                    }
                });
            }
        }
    }
}
