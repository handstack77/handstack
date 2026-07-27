'use strict';
let $mediaplayerextension = {
    hook: {
        pageLoad() {
            syn.uicontrols.$mediaplayer.setValue('mpExtension', {
                MediaID: 'CAPTION-01',
                Title: '자막 예제',
                Src: 'https://vjs.zencdn.net/v/oceans.mp4',
                Type: 'video/mp4',
                Tracks: [{
                    kind: 'captions',
                    src: 'captions-ko.vtt',
                    srclang: 'ko',
                    label: '한국어',
                    default: true
                },
                {
                    kind: 'captions',
                    src: 'captions-en.vtt',
                    srclang: 'en',
                    label: 'English'
                }]
            });
        }
    },
    event: {
        mpExtension_initialized(elID) {
            const videojs = syn.uicontrols.$mediaplayer.getVideoJS();
            if (!videojs.getPlugin('captionAudit')) {
                videojs.registerPlugin('captionAudit', function (options) {
                    this.trigger({
                        type: 'captionaudit',
                        detail: options
                    });
                    return {
                        playerID: this.id(),
                        options: options
                    };
                });
            }
        },
        mpExtension_mediaChange(elID, detail) {
            $this.method.print(detail);
        },
        mpExtension_captionaudit(elID, event, state) {
            $this.method.print({
                event: 'captionaudit',
                detail: event.detail,
                state: state
            });
        },
        btnTheme_click() {
            syn.uicontrols.$mediaplayer.setTheme('mpExtension', 'vjs-theme-monitoring');
        },
        btnDefaultTheme_click() {
            syn.uicontrols.$mediaplayer.setTheme('mpExtension', 'vjs-theme-handstack');
        },
        btnPlugin_click() {
            $this.method.print(syn.uicontrols.$mediaplayer.usePlugin('mpExtension', 'captionAudit', {
                screen: 'education'
            }));
        },
        btnPip_click() {
            syn.uicontrols.$mediaplayer.requestPictureInPicture('mpExtension').catch((error) => $this.method.print({
                error: error.message
            }));
        }
    },
    method: {
        print(value) {
            syn.$l.get('preResult').textContent = JSON.stringify(value, null, 2);
        }
    }
};
