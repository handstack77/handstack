# GoogleMap (`syn.uicontrols.$googlemap`)

Google Maps JavaScript API를 `$navermap`과 같은 HandStack 객체 행·POI 선택 계약으로 사용하는 지도 UI 컨트롤입니다. Google의 최신 `AdvancedMarkerElement`만 사용하며 Map, Data/GeoJSON, 도형, 교통 레이어, Geocoder, Street View와 네이티브 확장 API를 제공합니다.

## 준비

Google Cloud에서 Maps JavaScript API와 필요한 API를 활성화하고 HTTP referrer 제한 API Key와 Map ID를 구성합니다. 자격 증명은 소스에 저장하지 않습니다.

```js
syn.Config.GoogleMapApiKey = 'YOUR_GOOGLE_MAPS_API_KEY';
syn.Config.GoogleMapID = 'YOUR_GOOGLE_MAP_ID';
```

컨트롤별 `apiKey`, `mapId` 옵션이 전역 설정보다 우선하며 `mapOptions.mapId`도 사용할 수 있습니다. Advanced Marker 전용이므로 Map ID가 없으면 컨트롤은 명시적인 오류 상태가 됩니다.

```html
<syn_googlemap id="mapStore" syn-datafield="Stores"
    syn-events="['click','poiClick','selectionChange','error']"
    syn-options="{
        height: '480px',
        selectionMode: 'multiple',
        fitBoundsOnData: true,
        mapOptions: { center:{lat:37.5665,lng:126.9780}, zoom:12 }
    }"></syn_googlemap>
```

```js
await syn.uicontrols.$googlemap.setValue('mapStore', [{
    AS_NUM: 'STORE-01', LAT: 37.5665, LNG: 126.9780,
    CT_NAME: '서울점', CT_ADDRESS: '서울특별시 중구'
}]);

const row = syn.uicontrols.$googlemap.getValue('mapStore');
const list = syn.uicontrols.$googlemap.getValue('mapStore', 'List');
```

`setValue`는 `{}` 또는 `[{}]`을 받고 좌표가 잘못된 행이 하나라도 있으면 새 데이터 전체를 거절해 기존 마커를 유지합니다. `getValue(id)`는 선택한 원본 행 또는 행 배열을, `getValue(id, 'Row'|'List', metaColumns)`는 HandStack transaction 형식 `[[{prop,val}]]`을 반환합니다.

기본 필드 별칭, `poiMapping`, `dataAdapter`, 선택 모드, InfoWindow 및 이벤트 계약은 `$navermap`과 같습니다. `Icon`은 URL·`{url}`·HTML·DOM Node를 받을 수 있고 `PinOptions`는 Google `PinElement` 옵션으로 사용됩니다. 컨트롤은 클릭 시 별도 포커스 스타일을 넣지 않습니다.

Google Maps에서 제거된 DrawingManager와 Heatmap 및 Google에 대응 기능이 없는 `transCoord`는 호환 메서드명을 유지하면서 `GOOGLE_MAP_UNSUPPORTED_API` 오류를 반환합니다. MarkerClusterer는 번들하지 않으며 `getMarkers()`와 `importLibrary()`/`getGoogle()`로 화면에서 별도 연결할 수 있습니다.

전체 계약은 [API.md](API.md), 실행 예제는 [example/index.html](example/index.html)을 참고합니다.
