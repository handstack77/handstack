'use strict';
let $mediaplayerbasic = {
    hook: {
        pageLoad() {
            syn.uicontrols.$mediaplayer.setValue('mpBasic', {
                MediaID: 'VIDEO-01',
                Title: 'Video.js Oceans',
                Description: '단일 객체 바인딩 예제',
                Src: 'https://vjs.zencdn.net/v/oceans.mp4',
                Type: 'video/mp4'
            });
        }
    },
    event: {
        mpBasic_play(elID, event, state) {
            $this.method.print({
                event: 'play',
                state: state
            });
        },
        mpBasic_pause(elID, event, state) {
            $this.method.print({
                event: 'pause',
                state: state
            });
        },
        mpBasic_ended(elID, event, state) {
            $this.method.print({
                event: 'ended',
                state: state
            });
        },
        mpBasic_mediaChange(elID, detail, state) {
            $this.method.print({
                event: 'mediaChange',
                detail: detail,
                state: state
            });
        },
        mpBasic_historyChange(elID, detail) {
            $this.method.print(detail);
        },
        btnPlay_click() {
            syn.uicontrols.$mediaplayer.play('mpBasic');
        },
        btnPause_click() {
            syn.uicontrols.$mediaplayer.pause('mpBasic');
        },
        btnBack_click() {
            const api = syn.uicontrols.$mediaplayer;
            api.currentTime('mpBasic', Math.max(0, api.currentTime('mpBasic') - 10));
        },
        btnForward_click() {
            const api = syn.uicontrols.$mediaplayer;
            api.currentTime('mpBasic', api.currentTime('mpBasic') + 10);
        },
        btnMute_click() {
            const api = syn.uicontrols.$mediaplayer;
            api.muted('mpBasic', !api.muted('mpBasic'));
        },
        btnState_click() {
            $this.method.print(syn.uicontrols.$mediaplayer.getState('mpBasic'));
        }
    },
    method: {
        print(value) {
            syn.$l.get('preResult').textContent = JSON.stringify(value, null, 2);
        }
    }
};
