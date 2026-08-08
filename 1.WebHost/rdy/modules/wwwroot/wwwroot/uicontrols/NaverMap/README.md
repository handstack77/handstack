# NaverMap (`syn.uicontrols.$navermap`)

NAVER Maps JavaScript API V3를 HandStack의 객체 행 바인딩 계약으로 사용하는 지도 UI 컨트롤입니다. 지도 옵션, POI 마커, 선택 정보, InfoWindow를 기본 제공하고 NAVER 지도 객체를 그대로 반환하는 확장 API로 Data/GeoJSON, 도형, 레이어, 지오코딩, Drawing, Panorama, Visualization을 사용할 수 있습니다.

## 준비

NAVER Cloud Platform에서 Maps JavaScript API용 `ncpKeyId`를 발급하고 허용 Web 서비스 URL을 등록합니다. 키는 코드에 저장하지 말고 애플리케이션 설정에서 제공합니다.

```js
syn.Config.NaverMapApiKey = 'YOUR_NAVER_MAP_NCP_KEY_ID';
```

컨트롤별 `apiKey` 옵션이 있으면 전역 설정보다 우선합니다. SDK는 컨트롤이 처음 생성될 때 `https://oapi.map.naver.com/openapi/v3/maps.js`에서 비동기로 한 번만 로드됩니다.

```html
<syn_navermap id="mapStore" syn-datafield="Stores"
    syn-events="['click','poiClick','selectionChange','error']"
    syn-options="{
        height: '480px',
        selectionMode: 'multiple',
        fitBoundsOnData: true,
        mapOptions: { center:{lat:37.5665,lng:126.9780}, zoom:12 }
    }"></syn_navermap>
```

```js
await syn.uicontrols.$navermap.setValue('mapStore', [{
    AS_NUM: 'STORE-01', LAT: 37.5665, LNG: 126.9780,
    CT_NAME: '서울점', CT_ADDRESS: '서울특별시 중구'
}]);

const row = syn.uicontrols.$navermap.getValue('mapStore');
const list = syn.uicontrols.$navermap.getValue('mapStore', 'List');
```

`setValue`는 단일 객체 `{}` 또는 객체 배열 `[{}]`을 받습니다. 좌표가 잘못된 행이 하나라도 있으면 새 데이터 전체를 거절하고 기존 마커를 유지합니다. `getValue(id)`는 선택한 POI의 원본 행을 single 모드에서는 Row로, multiple 모드에서는 List로 반환합니다. `getValue(id, 'Row'|'List', metaColumns)`는 HandStack transaction 형식 `[[{prop,val}]]`을 반환합니다.

기본 별칭은 `AS_NUM/id`, `LAT/lat/latitude`, `LNG/lng/longitude`, `CT_NAME/title/name`, `CT_ADDRESS/description`, `Icon`, `MarkerOptions`, `InfoWindowContent`, `Visible`, `Draggable`, `ZIndex`입니다. 다른 데이터 모델은 `poiMapping`이나 비동기 `dataAdapter`로 연결합니다.

마커 클릭은 선택 상태와 InfoWindow만 관리하며 마커 색상·크기·zIndex 등 별도 포커스 효과를 넣지 않습니다. 선택 시각화가 필요하면 `poiClick`/`selectionChange`에서 `updateMarker`를 호출해 화면 정책에 맞게 직접 구현합니다.

기본 서브모듈은 `panorama`, `geocoder`, `drawing`, `visualization`입니다. MarkerClustering은 NAVER Maps SDK 본체가 아니므로 번들하지 않습니다. 필요한 화면에서 `getMap()`, `getMarkers()`와 별도 클러스터링 구현을 연결합니다.

전체 속성·메서드·이벤트는 [API.md](API.md), 실행 예제는 [example/index.html](example/index.html)을 참고합니다.
