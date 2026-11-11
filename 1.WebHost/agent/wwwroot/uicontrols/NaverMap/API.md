# NaverMap API

## 옵션

| 옵션 | 기본값 | 설명 |
|---|---|---|
| `width`, `height` | `100%`, `400px` | 컨트롤 크기. 태그의 inline style이 우선합니다. |
| `apiKey` | `syn.Config.NaverMapApiKey` | NAVER Cloud Platform Maps의 `ncpKeyId` |
| `apiUrl` | NAVER Maps V3 URL | SDK URL |
| `submodules` | panorama/geocoder/drawing/visualization | SDK 서브모듈 |
| `language`, `loadTimeout` | `ko`, `15000` | SDK 언어와 로딩 제한(ms) |
| `mapOptions` | 한국 중심, zoom 7 | `naver.maps.MapOptions` 전체 |
| `selectionMode` | `single` | `single`, `multiple`, `none` |
| `clearSelectionOnMapClick` | `true` | 빈 지도 클릭 시 선택 해제 |
| `preserveSelection` | `false` | 재바인딩 시 같은 ID 선택 유지 |
| `fitBoundsOnData` | `false` | 바인딩 후 모든 POI가 보이도록 이동 |
| `markerOptions`, `infoWindowOptions` | `{}` | NAVER Marker/InfoWindow 옵션 |
| `openInfoWindowOnSelect` | `true` | 선택 시 InfoWindow 열기 |
| `poiMapping` | `{}` | 필드별 문자열 또는 resolver 함수 |
| `dataAdapter` | `null` | `(rows, metaColumns, control)` 동기/비동기 변환 |
| `markerOptionsResolver` | `null` | `(row, index, control)`별 Marker 옵션 |
| `infoWindowContentResolver` | `null` | `(row, index, control)`별 content |
| `autoResize` | `true` | ResizeObserver로 지도 resize 이벤트 전달 |

함수 옵션은 함수 자체 또는 전역 경로 문자열을 사용할 수 있습니다. HTML의 `syn-options`에 함수가 필요하면 페이지 모듈의 `hook.controlInit`에서 반환하는 방식을 권장합니다.

## POI 바인딩

```js
await $navermap.setValue('map1', {});       // 단일 POI
await $navermap.setValue('map1', [{}, {}]); // POI 목록
await $navermap.setValue('map1', []);       // 모두 제거
```

| 의미 | 기본 필드 별칭 |
|---|---|
| ID | `AS_NUM`, `POIID`, `PoiID`, `id`, `ID` |
| 위도 | `LAT`, `lat`, `latitude`, `Latitude` |
| 경도 | `LNG`, `lng`, `longitude`, `Longitude` |
| 제목 | `CT_NAME`, `Title`, `title`, `Name`, `name` |
| 설명 | `CT_ADDRESS`, `Description`, `description`, `Address`, `address` |
| 표시 | `Icon`, `MarkerOptions`, `InfoWindowContent`, `Visible`, `Draggable`, `ZIndex` |

`getValue(id)`는 선택 원본 행 또는 원본 행 배열을 반환합니다. `getSelection(id)`는 직렬화 가능한 `{poiIndex, poiId, position, row}` 또는 배열을 반환합니다. `getSelectedMarkers(id)`는 NAVER Marker 인스턴스를 반환합니다.

## 메서드

- 생명주기/접근: `ready`, `getControl`, `getMap`, `getNaver`, `clear`, `dispose`
- 데이터/선택: `setValue`, `getValue`, `getRawValue`, `getSelection`, `getSelectedRows`, `setSelection`, `clearSelection`
- 마커/InfoWindow: `getMarkers`, `getSelectedMarkers`, `getMarker`, `updateMarker`, `setMarkerVisible`, `getInfoWindow`, `openInfoWindow`, `closeInfoWindow`, `invokeMarker`
- 지도: `setOptions`, `getOptions`, `setCenter`, `getCenter`, `setZoom`, `getZoom`, `fitBounds`, `panTo`, `panToBounds`, `panBy`, `getBounds`, `setMapTypeId`, `resize`
- Data/GeoJSON: `addGeoJson`, `removeGeoJson`, `setDataStyle`, `overrideDataStyle`, `revertDataStyle`
- 오버레이: `addOverlay`, `getOverlay`, `removeOverlay` (`Marker`, `InfoWindow`, `Polyline`, `Polygon`, `Circle`, `Ellipse`, `Rectangle`, `GroundOverlay`)
- 레이어: `createLayer`, `getLayer`, `setLayerVisible`, `removeLayer` (`TrafficLayer`, `BicycleLayer`, `CadastralLayer`, `StreetLayer`, `LabelLayer`)
- 서비스: Promise 기반 `geocode`, `reverseGeocode`, `transCoord`
- 서브모듈: `createDrawingManager`, `createPanorama`, `createVisualization` (`HeatMap`, `DotMap`)
- 확장: `on`, `off`, `invoke`, `invokeGlobal`

`getMap`, `getNaver`, `invoke`는 래퍼가 아직 제공하지 않는 현재/향후 NAVER Maps API를 사용하는 escape hatch입니다. `addOverlay`와 `createLayer`는 안전한 생성자 allowlist를 사용합니다.

## 이벤트

핸들러 형식은 `(elID, payload, selection)`입니다.

- 지도 네이티브 이벤트: `syn-events`에 `click`, `dblclick`, `bounds_changed`, `center_changed`, `zoom_changed`, `dragstart`, `drag`, `dragend`, `idle` 등 NAVER 이벤트명을 선언
- POI 이벤트: `poiClick`, `poiDblclick`, `poiMouseover`, `poiMouseout`, `poiDragstart`, `poiDrag`, `poiDragend`
- 합성 이벤트: `sdkLoaded`, `initialized`, `dataBound`, `selectionChange`, `infoWindowOpen`, `infoWindowClose`, `authFailure`, `resized`, `disposed`, `error`

`error` payload는 `{code,message,detail}`입니다. 주요 코드는 `NAVER_MAP_API_KEY_REQUIRED`, `NAVER_MAP_SDK_CONFLICT`, `NAVER_MAP_SDK_TIMEOUT`, `NAVER_MAP_AUTH_FAILURE`, `INVALID_POI_DATA`, `INVALID_POI_COORDINATE`입니다.
