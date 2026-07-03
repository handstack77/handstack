'use strict';
let $iframe_main = {
    event: {
        btnChildrenConnect_click() {
            var channelID = 'channelID';
            var iframeChannel = syn.$w.channels.find(function (item) { return item.id == channelID });
            if (iframeChannel == undefined) {
                var iframe = syn.$l.get('ifmChildren');
                var contentWindow = iframe.contentWindow;
                var frameMessage = {
                    id: channelID,
                    channel: syn.$n.rooms.connect({
                        debugOutput: true,
                        window: contentWindow,
                        origin: '*',
                        scope: channelID
                    })
                };

                frameMessage.channel.bind('response', function (evt, val) {
                    alert('iframe_main ' + val);
                });

                syn.$w.channels.push(frameMessage);
            }
        },

        btnChildrenLoad_click() {
            var iframe = syn.$l.get('ifmChildren');
            iframe.src = 'iframe_child.html';
        },

        btnParent2Children_click() {
            var channelID = 'channelID';
            var length = syn.$w.channels.length;
            for (var i = 0; i < length; i++) {
                var frameMessage = syn.$w.channels[i];

                if (channelID == frameMessage.id) {
                    frameMessage.channel.call({
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
    }
}
