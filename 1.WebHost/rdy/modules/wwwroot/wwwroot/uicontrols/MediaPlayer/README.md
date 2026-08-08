# MediaPlayer (`syn.uicontrols.$mediaplayer`)

Video.js 8 기반의 HandStack 동영상·오디오 UI 컨트롤입니다. HTML5 MP4/WebM/MP3, Video.js VHS의 HLS·MPEG-DASH, `videojs-youtube`의 YouTube 재생을 하나의 객체 행/재생목록 계약으로 처리합니다.

```html
<syn_mediaplayer id="mpCourse" syn-datafield="CourseMedia"
    syn-events="['play','ended','mediaChange','completed']"
    syn-options="{
        playlist: { visible: 'auto', position: 'right', autoAdvance: true, repeat: 'none' },
        completionThreshold: 0.9
    }"></syn_mediaplayer>
```

```js
await syn.uicontrols.$mediaplayer.setValue('mpCourse', [{
    MediaID: 'LESSON-01',
    Title: '첫 강의',
    Src: 'https://vjs.zencdn.net/v/oceans.mp4',
    Type: 'video/mp4',
    Tracks: [{ kind: 'captions', src: './captions-ko.vtt', srclang: 'ko', label: '한국어', default: true }]
}, {
    MediaID: 'YOUTUBE-01',
    Title: 'YouTube',
    Src: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
    Provider: 'youtube'
}]);
```

`setValue`는 `$auigrid`, `$grid`에서 얻은 단일 객체 `{}` 또는 객체 배열 `[{}]`을 받습니다. 기본 필드명은 `MediaID`, `Title`, `Description`, `Src`, `Type`, `Provider`, `MediaType`, `Poster`, `Thumbnail`, `Sources`, `Tracks`, `Autoplay`, `Muted`, `Loop`, `PlaybackRate`, `StartTime`이며 `mediaMapping`으로 변경할 수 있습니다.

`getValue(id)`는 현재 또는 마지막으로 실제 재생한 원본 행에 `Playback*` 상세 필드를 합쳐 반환합니다. `getValue(id, 'Row'|'List', metaColumns)`는 HandStack transaction 형식 `[[{prop,val}]]`을 반환하고, List에는 한 번 이상 재생한 항목만 재생목록 순서로 포함됩니다. 이력은 메모리에서 미디어별로 누적되며 `setValue` 때 기본 초기화됩니다.

- 고유 시청 구간을 합산하여 `completionThreshold`(기본 90%) 이상 또는 `ended`일 때 완료 처리
- `playlist.visible/position/autoAdvance/repeat`로 재생목록 UI와 진행 제어
- `setTheme`, CSS custom property, Video.js theme class로 테마 적용
- `Tracks` 및 `addTextTrack/removeTextTrack`으로 자막 연결
- `usePlugin`, `invoke`, `getPlayer`, `getVideoJS`, `on/off`로 Video.js와 플러그인 기능 확장
- `syn-events`에 Video.js 이벤트 이름을 그대로 선언하고 HandStack 합성 이벤트도 함께 사용

로더 순서는 `/lib/video.js/dist/video.min.js` → 한국어 locale → `/lib/videojs-youtube/dist/Youtube.min.js` → `MediaPlayer.js`입니다. 라이브러리는 `libman.json`에서 고정 버전으로 복원되며 번들에도 포함됩니다.

전체 계약은 `API.md`, 실행 예제는 `example/index.html`에서 확인합니다. 브라우저 autoplay 정책, 미디어 서버 CORS, DRM/인증 토큰, 라이브 스트림 장애 복구 정책은 화면과 서버 환경에서 별도로 구성해야 합니다.
