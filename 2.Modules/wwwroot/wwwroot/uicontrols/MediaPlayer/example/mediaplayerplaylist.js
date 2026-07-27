'use strict';
let $mediaplayerplaylist = {
    prop: {
        rows: [{
            MediaID: 'VIDEO-01',
            Title: 'Oceans video',
            Description: 'MP4',
            Src: 'https://vjs.zencdn.net/v/oceans.mp4',
            Type: 'video/mp4'
        },
        {
            MediaID: 'AUDIO-01',
            Title: 'Sample audio',
            Description: 'MP3',
            MediaType: 'audio',
            Src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            Type: 'audio/mpeg'
        }],
        metaColumns: {
            MediaID: {
                FieldID: 'MediaID',
                DataType: 'string'
            },
            Title: {
                FieldID: 'Title',
                DataType: 'string'
            },
            PlaybackPlayCount: {
                FieldID: 'PlaybackPlayCount',
                DataType: 'number'
            },
            PlaybackCurrentTime: {
                FieldID: 'PlaybackCurrentTime',
                DataType: 'number'
            },
            PlaybackWatchedSeconds: {
                FieldID: 'PlaybackWatchedSeconds',
                DataType: 'number'
            },
            PlaybackProgressPercent: {
                FieldID: 'PlaybackProgressPercent',
                DataType: 'number'
            },
            PlaybackCompletedYN: {
                FieldID: 'PlaybackCompletedYN',
                DataType: 'string'
            }
        }
    },
    hook: {
        pageLoad() {
            syn.uicontrols.$mediaplayer.setValue('mpPlaylist', $this.prop.rows, $this.prop.metaColumns);
        }
    },
    event: {
        mpPlaylist_dataBound(elID, detail) {
            $this.method.print({
                event: 'dataBound',
                count: detail.rows.length
            });
        },
        mpPlaylist_mediaChange(elID, detail, state) {
            $this.method.print({
                event: 'mediaChange',
                detail: detail,
                currentIndex: state.currentIndex
            });
        },
        mpPlaylist_completed(elID, detail) {
            $this.method.print({
                event: 'completed',
                detail: detail
            });
        },
        mpPlaylist_playlistEnded(elID, detail) {
            $this.method.print({
                event: 'playlistEnded',
                detail: detail
            });
        },
        mpPlaylist_historyChange(elID, detail) {
            if (detail && detail.PlaybackLastEvent !== 'timeupdate') {
                $this.method.print(detail);
            }
        },
        btnPrevious_click() {
            syn.uicontrols.$mediaplayer.previous('mpPlaylist', true);
        },
        btnNext_click() {
            syn.uicontrols.$mediaplayer.next('mpPlaylist', true);
        },
        btnRow_click() {
            $this.method.print(syn.uicontrols.$mediaplayer.getValue('mpPlaylist', 'Row', $this.prop.metaColumns));
        },
        btnList_click() {
            $this.method.print(syn.uicontrols.$mediaplayer.getValue('mpPlaylist', 'List', $this.prop.metaColumns));
        },
        btnDetails_click() {
            $this.method.print(syn.uicontrols.$mediaplayer.getPlaybackDetails('mpPlaylist', 'List'));
        },
        btnReset_click() {
            syn.uicontrols.$mediaplayer.resetHistory('mpPlaylist');
            $this.method.print([]);
        }
    },
    method: {
        print(value) {
            syn.$l.get('preResult').textContent = JSON.stringify(value, null, 2);
        }
    }
};
