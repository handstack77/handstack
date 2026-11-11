# `$mediaplayer` API

## 데이터 계약

`setValue(id, value, metaColumns)`의 `value`는 `null`, `{}`, `[{}]` 중 하나입니다. 빈 값은 플레이어를 초기화합니다. 각 행은 단일 `Src`/`Type` 또는 다중 대체 소스 `Sources`를 사용할 수 있습니다.

```js
{
  MediaID: 'MEDIA-01',
  Title: '과정 소개',
  Description: '선택 설명',
  Src: 'https://example.test/intro.m3u8',
  Type: 'application/x-mpegURL',
  Provider: 'html5',             // html5 | youtube
  MediaType: 'video',            // video | audio
  Poster: '/img/poster.png',
  Thumbnail: '/img/thumb.png',
  Sources: [{ src: '...', type: 'video/mp4' }],
  Tracks: [{ kind: 'captions', src: './ko.vtt', srclang: 'ko', label: '한국어', default: true }],
  Autoplay: false,
  Muted: false,
  Loop: false,
  PlaybackRate: 1,
  StartTime: 0
}
```

확장자는 MP4, WebM, Ogg, MP3, WAV, AAC, M3U8, MPD를 추론합니다. 확장자 없는 URL은 `Type`을 명시합니다. YouTube URL 또는 `Provider: 'youtube'`는 `video/youtube`로 정규화됩니다. `dataAdapter(rows, metaColumns, control)`는 동기 배열 또는 Promise 배열을 반환할 수 있으며, 겹친 비동기 바인딩은 마지막 호출만 반영됩니다.

## Options

| 속성 | 기본값 | 설명 |
|---|---|---|
| `controls`, `preload`, `autoplay`, `muted`, `loop`, `playsinline` | Video.js 일반값 | 기본 재생 동작 |
| `fluid`, `responsive`, `aspectRatio` | `true`, `true`, `'16:9'` | 반응형 크기 |
| `language`, `playbackRates` | `'ko'`, 0.5~2 | locale와 속도 메뉴 |
| `techOrder` | `['youtube','html5']` | Video.js tech 우선순위 |
| `html5`, `youtube`, `plugins`, `playerOptions` | `{}` | Video.js/VHS, YouTube tech, plugin, 원시 player option |
| `themeClass` | `'vjs-theme-handstack'` | wrapper와 player에 붙일 테마 class |
| `playlist.visible` | `'auto'` | `true`, `false`, `'always'`, `'auto'`; auto는 2개 이상일 때 표시 |
| `playlist.position` | `'right'` | `'right'`, `'left'`, `'bottom'` |
| `playlist.autoAdvance`, `playlist.repeat` | `false`, `'none'` | 종료 후 이동과 `'none'|'one'|'all'` 반복 |
| `mediaMapping` | 기본 필드 매핑 | 업무 행의 필드명을 미디어 속성에 연결 |
| `dataAdapter` | `null` | `(rows,metaColumns,control)` 변환 함수 또는 전역 함수명 |
| `startIndex` | `0` | 바인딩 직후 선택할 항목 |
| `completionThreshold` | `0.9` | 고유 시청 시간 기준 완료 비율 |
| `preserveHistory` | `false` | 재바인딩 시 같은 `historyKey`의 메모리 이력 유지 |
| `historyKey` | `'MediaID'` | 이력 항목 식별 필드. 중복이면 playlist index로 분리 |
| `historyUpdateInterval` | `1000` | `historyChange` timeupdate 알림 최소 간격(ms) |
| `autoResize` | `true` | ResizeObserver로 Video.js resize event 전달 |

## 반환값

원본 행에 다음 필드가 추가됩니다.

`PlaybackPlaylistIndex`, `PlaybackProvider`, `PlaybackMediaType`, `PlaybackSource`, `PlaybackPlayCount`, `PlaybackFirstStartedAt`, `PlaybackLastStartedAt`, `PlaybackLastPausedAt`, `PlaybackLastEndedAt`, `PlaybackLastPlayedAt`, `PlaybackCurrentTime`, `PlaybackDuration`, `PlaybackWatchedSeconds`, `PlaybackProgressPercent`, `PlaybackCompletedYN`, `PlaybackEndedYN`, `PlaybackVolume`, `PlaybackMutedYN`, `PlaybackRate`, `PlaybackLastEvent`, `PlaybackErrorCode`, `PlaybackErrorMessage`.

```js
const rawRow = $mediaplayer.getValue('mp');
const transactRow = $mediaplayer.getValue('mp', 'Row', metaColumns);
const transactList = $mediaplayer.getValue('mp', 'List', metaColumns);
const details = $mediaplayer.getPlaybackDetails('mp', 'List');
```

재생을 시작하지 않았으면 Row는 빈 transaction 배열이며, List에는 `play`가 한 번 이상 발생한 항목만 포함됩니다. seek로 건너뛴 구간은 시청 시간으로 계산하지 않습니다. 이력은 서버로 자동 전송하거나 영구 저장하지 않습니다.

## Methods

| 메서드 | 설명 |
|---|---|
| `getControl`, `getPlayer`, `getVideoJS` | HandStack wrapper, Video.js player, 전역 namespace |
| `setValue`, `getValue`, `getRawValue` | 업무 행 바인딩, Row/List 결과, 원본 입력 조회 |
| `getPlaylist`, `getCurrentMedia`, `getPlaybackDetails`, `getState` | 정규화 재생목록·현재 미디어·상세 이력·상태 |
| `selectMedia(id,indexOrKey,autoplay,reason)` | index, history key, MediaID로 항목 선택 |
| `play`, `pause`, `stop`, `load`, `next`, `previous` | 재생 제어 |
| `currentTime`, `duration`, `volume`, `muted`, `playbackRate` | getter/setter 제어 |
| `setTheme` | 기존 theme class를 교체 |
| `addTextTrack`, `removeTextTrack` | 원격 자막 추가/제거 |
| `requestFullscreen`, `exitFullscreen`, `requestPictureInPicture` | 화면 모드 제어 |
| `usePlugin(id,name,options)` | player에 등록된 Video.js plugin 실행 |
| `invoke(id,method,args)` | Video.js player 원시 메서드 호출 |
| `on`, `off` | runtime Video.js 이벤트 등록/해제 |
| `resetHistory`, `resize`, `clear`, `dispose` | 이력·크기·데이터·수명주기 관리 |

## Events

`syn-events`에 `play`, `playing`, `pause`, `timeupdate`, `seeking`, `seeked`, `ratechange`, `volumechange`, `waiting`, `stalled`, `ended`, `error`, `fullscreenchange`, `enterpictureinpicture`, `leavepictureinpicture` 등 Video.js 이벤트를 그대로 선언할 수 있습니다. 그 밖의 Video.js/플러그인 이벤트도 이름 제한 없이 연결합니다.

```js
mpCourse_play(elID, event, state) {}
mpCourse_mediaChange(elID, detail, state) {}
```

네이티브와 합성 이벤트 handler는 `(elID, eventOrDetail, state)`를 받습니다. 합성 이벤트는 다음과 같습니다.

- `initialized`: player 준비
- `dataBound`: 입력 행과 정규화 playlist 반영
- `mediaChange`, `playlistChange`: 현재 항목 또는 목록 변경
- `historyChange`: 미디어별 상세 이력 갱신
- `completed`: `ended` 또는 완료 임계값 최초 달성
- `playlistEnded`: 자동 이동 불가 또는 마지막 항목 종료
- `disposed`: 컨트롤 폐기

## 스트리밍과 확장 범위

Video.js 8 번들의 VHS로 브라우저가 지원하는 HLS와 MPEG-DASH를 처리하고, `videojs-youtube`로 YouTube URL을 처리합니다. DRM, 광고, 분석, 품질 선택 UI, 오프라인 다운로드, 서버측 토큰 갱신은 포함하지 않습니다. 필요한 Video.js plugin을 로드한 뒤 `plugins` option, `usePlugin`, `getPlayer` 또는 `invoke`로 연결합니다.
