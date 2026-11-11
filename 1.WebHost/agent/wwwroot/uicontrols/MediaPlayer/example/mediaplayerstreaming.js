'use strict';
let $mediaplayerstreaming = {
    hook: {
        pageLoad() {
            syn.uicontrols.$mediaplayer.setValue('mpStreaming', [{
                MediaID: 'YT-01',
                Title: 'YouTube tech',
                Provider: 'youtube',
                Src: 'https://www.youtube.com/watch?v=M7lc1UVf-VE'
            },
            {
                MediaID: 'HLS-01',
                Title: 'HLS stream',
                Src: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
                Type: 'application/x-mpegURL'
            },
            {
                MediaID: 'DASH-01',
                Title: 'MPEG-DASH stream',
                Src: 'https://dash.akamaized.net/envivio/EnvivioDash3/manifest.mpd',
                Type: 'application/dash+xml'
            }]);
        }
    },
    event: {
        mpStreaming_mediaChange(elID, detail, state) {
            $this.method.print({
                event: 'mediaChange',
                detail: detail,
                state: state
            });
        },
        mpStreaming_waiting(elID, event, state) {
            $this.method.print({
                event: 'waiting',
                state: state
            });
        },
        mpStreaming_playing(elID, event, state) {
            $this.method.print({
                event: 'playing',
                state: state
            });
        },
        mpStreaming_error(elID, event, state) {
            $this.method.print({
                event: 'error',
                playerError: syn.uicontrols.$mediaplayer.getPlayer(elID).error(),
                state: state
            });
        }
    },
    method: {
        print(value) {
            syn.$l.get('preResult').textContent = JSON.stringify(value, null, 2);
        }
    }
};
