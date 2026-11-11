# GoogleMap API

## 옵션

| 옵션 | 기본값 | 설명 |
|---|---|---|
| `width`, `height` | `100%`, `400px` | 컨트롤 크기. inline style 우선 |
| `apiKey` | `syn.Config.GoogleMapApiKey` | HTTP referrer 제한 Google Maps API Key |
| `mapId` | `mapOptions.mapId` 또는 `syn.Config.GoogleMapID` | Advanced Marker 필수 Map ID |
| `apiUrl`, `version` | Google Maps URL, `weekly` | SDK URL과 채널 |
| `libraries` | maps/marker/geocoding/geometry/streetView | 초기 라이브러리 |
| `language`, `region` | `ko`, `KR` | 지도·서비스 지역화 |
| `authReferrerPolicy`, `channel`, `solutionChannel` | 빈 값 | Google SDK bootstrap 옵션 |
| `loadTimeout` | `15000` | SDK 로딩 제한(ms) |
| `mapOptions` | 한국 중심, zoom 7 | `google.maps.MapOptions` 전체 |
| `selectionMode` | `single` | `single`, `multiple`, `none` |
| `clearSelectionOnMapClick` | `true` | 빈 지도 클릭 시 선택 해제 |
| `preserveSelection`, `fitBoundsOnData` | `false` | 재바인딩 선택 유지와 자동 bounds |
| `markerOptions`, `infoWindowOptions` | `{}` | Advanced Marker/InfoWindow 옵션 |
| `openInfoWindowOnSelect` | `true` | 선택 시 InfoWindow 열기 |
| `poiMapping` | `{}` | 필드별 문자열 또는 resolver |
| `dataAdapter` | `null` | `(rows, metaColumns, control)` 동기/비동기 변환 |
| `markerOptionsResolver` | `null` | POI별 Advanced Marker 옵션 |
| `infoWindowContentResolver` | `null` | POI별 InfoWindow content |
| `autoResize` | `true` | ResizeObserver 연계 |

## POI 바인딩과 결과

```js
await $googlemap.setValue('map1', {});
await $googlemap.setValue('map1', [{}, {}]);
await $googlemap.setValue('map1', []);
```

기본 별칭은 `$navermap`과 같은 `AS_NUM/ID`, `LAT/latitude`, `LNG/longitude`, `CT_NAME/title/name`, `CT_ADDRESS/description`, `Icon`, `MarkerOptions`, `InfoWindowContent`, `Visible`, `Draggable`, `ZIndex`이며 Google 전용 `PinOptions`를 추가로 지원합니다.

`getValue(id)`는 선택 원본 행/배열, `getSelection(id)`는 `{poiIndex,poiId,position,row}`/배열, `getSelectedMarkers(id)`는 `AdvancedMarkerElement[]`을 반환합니다. Row/List 요청은 `[[{prop,val}]]` 형식입니다.

## 메서드

- 접근/생명주기: `ready`, `getControl`, `getMap`, `getGoogle`, `importLibrary`, `clear`, `dispose`
- 데이터/선택: `setValue`, `getValue`, `getRawValue`, `getSelection`, `getSelectedRows`, `setSelection`, `clearSelection`
- 마커/InfoWindow: `getMarkers`, `getSelectedMarkers`, `getMarker`, `updateMarker`, `setMarkerVisible`, `getInfoWindow`, `openInfoWindow`, `closeInfoWindow`, `invokeMarker`
- 지도: `setOptions`, `getOptions`, `setCenter`, `getCenter`, `setZoom`, `getZoom`, `fitBounds`, `panTo`, `panToBounds`, `panBy`, `getBounds`, `setMapTypeId`, `resize`
- Data/GeoJSON: `addGeoJson`, `removeGeoJson`, `setDataStyle`, `overrideDataStyle`, `revertDataStyle`
- 오버레이: `addOverlay`, `getOverlay`, `removeOverlay` (`Marker`, `InfoWindow`, `Polyline`, `Polygon`, `Circle`, `Rectangle`, `GroundOverlay`)
- 레이어: `createLayer`, `getLayer`, `setLayerVisible`, `removeLayer` (`TrafficLayer`, `TransitLayer`, `BicyclingLayer`, `StreetViewCoverageLayer`; `BicycleLayer` 별칭)
- 서비스/확장: Promise `geocode`, `reverseGeocode`, `createPanorama`, `on`, `off`, `invoke`, `invokeGlobal`

`transCoord`, `createDrawingManager`, `createVisualization`, `Ellipse`, `CadastralLayer`, `LabelLayer`는 `GOOGLE_MAP_UNSUPPORTED_API` 오류를 반환합니다.

## 이벤트와 오류

이벤트 핸들러 형식은 `(elID, payload, selection)`입니다.

- 지도 네이티브: `click`, `dblclick`, `bounds_changed`, `center_changed`, `zoom_changed`, `dragstart`, `drag`, `dragend`, `idle` 등
- POI: `poiClick`, `poiDblclick`, `poiMouseover`, `poiMouseout`, `poiDragstart`, `poiDrag`, `poiDragend`
- 합성: `sdkLoaded`, `initialized`, `dataBound`, `selectionChange`, `infoWindowOpen`, `infoWindowClose`, `authFailure`, `resized`, `disposed`, `error`

오류 payload는 `{code,message,detail}`입니다. 자격 증명, SDK 충돌/시간 초과, Advanced Marker 누락, 잘못된 데이터/좌표와 미지원 API를 구분합니다.
