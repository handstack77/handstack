'use strict';

// OpenGrid 개별 예제 페이지가 공유하는 헬퍼 · 샘플 데이터 생성기.
// 각 예제 .html은 <syn_opengrid syn-options="{...}"> 선언형 태그(또는 rangeSelection/masterDetail/
// checkColumn처럼 controlLoad가 전달하지 않는 raw 옵션이 필요한 경우 createRawGrid)로 그리드를 만들고,
// 짝을 이루는 .js가 이 파일의 함수들을 사용해 데이터 주입·이벤트 배선을 담당한다.

function log(message) {
    var el = document.getElementById('divLog');
    if (!el) {
        return;
    }
    el.textContent = '[' + new Date().toLocaleTimeString() + '] ' + message + '\n' + el.textContent;
}

function byId(id) {
    return document.getElementById(id);
}

function on(id, evt, handler) {
    var el = byId(id);
    if (el) {
        el.addEventListener(evt, handler);
    }
}

// <syn_opengrid>는 DOMContentLoaded 시점에 syn.js가 스캔해 비동기로 초기화하므로,
// 뒤이어 로드되는 예제별 .js가 곧바로 $opengrid.setValue 등을 호출하면 그리드가 아직 없을 수 있다.
// 그리드 인스턴스가 등록될 때까지 폴링한 뒤 콜백을 실행한다.
function whenGridReady(elID, callback, timeoutMs) {
    var $opengrid = syn.uicontrols.$opengrid;
    var waited = 0;
    var limit = timeoutMs || 5000;
    (function poll() {
        var grid = $opengrid.getGridControl(elID);
        if (grid) {
            callback(grid);
            return;
        }
        waited += 50;
        if (waited >= limit) {
            log('오류: ' + elID + ' 그리드 초기화 대기 시간 초과');
            return;
        }
        setTimeout(poll, 50);
    })();
}

// getGridData(total=true 경로)는 편집된 행에 대해 원본(Flag:R)과 변경본(Flag:U)을
// 별도 항목으로 함께 돌려줄 수 있다. key(보통 PK 필드) 기준으로 마지막(최신) 값만 남긴다.
function dedupeByKey(rows, key) {
    var indexByKey = {};
    var result = [];
    rows.forEach(function (r) {
        if (Object.prototype.hasOwnProperty.call(indexByKey, r[key])) {
            result[indexByKey[r[key]]] = r;
        } else {
            indexByKey[r[key]] = result.length;
            result.push(r);
        }
    });
    return result;
}

var echartInstances = {};
function initChart(elID, option) {
    if (typeof echarts == 'undefined') {
        var el = byId(elID);
        if (el) {
            el.textContent = 'ECharts 라이브러리를 불러오지 못했습니다(CDN 차단 또는 오프라인 환경).';
        }
        return null;
    }
    var chart = echarts.init(byId(elID));
    chart.setOption(option);
    echartInstances[elID] = chart;
    return chart;
}

// OpenGrid.js는 vendor 엔진을 동적 import()로 비동기 로드하므로, window.OpenGrid는 스크립트가
// 실행된 직후에는 아직 없을 수 있다. createRawGrid를 페이지 로드 직후(<syn_opengrid> 태그 없이)
// 바로 호출하는 데모는 이 헬퍼로 감싸 엔진 로딩을 기다린다.
function whenOpenGridReady(callback, timeoutMs) {
    var waited = 0;
    var limit = timeoutMs || 5000;
    (function poll() {
        if (window.OpenGrid) {
            callback();
            return;
        }
        waited += 50;
        if (waited >= limit) {
            log('오류: OpenGrid 엔진 로딩 대기 시간 초과');
            return;
        }
        setTimeout(poll, 50);
    })();
}

// controlLoad는 columns/height/width/rowHeight/autoHeight/editable/selectionMode/contextMenu/
// messages/locale 외의 raw open-grid 옵션(rangeSelection, masterDetail, checkColumn 등)을 전달하지
// 않는다. <syn_opengrid syn-options="...">도 동일한 controlLoad 경로를 타므로 마찬가지다.
// 이 헬퍼는 $opengrid의 컬럼 변환 파이프라인은 그대로 재사용하면서, 그 외 옵션은 raw OpenGrid
// 생성자로 직접 전달하고 $opengrid.gridControls에 등록해 이후 $opengrid.* 래퍼 API가 계속 동작하게 한다.
function createRawGrid(elID, columns, extraOptions) {
    var $opengrid = syn.uicontrols.$opengrid;
    var initCols = $opengrid.getInitializeColumns(elID, columns, extraOptions.editable);
    var gridSetup = Object.assign({
        columns: $opengrid.toColumnDefs(initCols),
        height: '360px',
        width: '100%',
        selectionMode: 'single',
        contextMenu: true
    }, extraOptions);
    var grid = new window.OpenGrid(byId(elID), gridSetup);
    var existing = $opengrid.getControl(elID);
    if (existing) {
        existing.grid = grid;
        existing.setting = gridSetup;
        existing.columnInfoList = initCols;
    } else {
        $opengrid.gridControls.push({ id: elID, grid: grid, setting: gridSetup, columnInfoList: initCols });
    }
    return grid;
}

// ------------------------------------------------------------------
// 샘플 데이터 생성기
// ------------------------------------------------------------------
var ROLES = [
    { CodeID: 'Admin', CodeValue: '관리자' },
    { CodeID: 'Manager', CodeValue: '매니저' },
    { CodeID: 'Member', CodeValue: '회원' }
];
var DEPARTMENTS = ['개발팀', '영업팀', '지원팀', '경영지원팀'];

function sampleMembers(count) {
    var result = [];
    for (var i = 1; i <= count; i++) {
        var role = ROLES[i % ROLES.length];
        result.push({
            MemberNo: i,
            MemberName: '사용자 ' + i,
            Email: 'user' + i + '@handstack.kr',
            RoleID: role.CodeID,
            RoleName: role.CodeValue,
            Department: DEPARTMENTS[i % DEPARTMENTS.length],
            Point: Math.floor(Math.random() * 10000),
            Salary: 3000000 + Math.floor(Math.random() * 4000000),
            ChangeRate: (Math.random() * 20 - 10),
            UseYN: i % 4 !== 0 ? '1' : '0',
            JoinDate: '2024-0' + ((i % 9) + 1) + '-1' + (i % 9),
            Memo: '자기소개가 다소 길게 들어갈 수 있는 메모 필드 샘플 텍스트입니다. 사용자 ' + i + '.',
            Avatar: 'https://i.pravatar.cc/40?img=' + ((i % 70) + 1)
        });
    }
    return result;
}

function sampleProducts(count) {
    var cats = ['음료', '스낵', '생활용품', '문구'];
    var result = [];
    for (var i = 1; i <= count; i++) {
        result.push({
            ProdID: 'P' + String(i).padStart(4, '0'),
            ProdName: '상품 ' + i,
            Category: cats[i % cats.length],
            Price: 1000 + (i % 50) * 500,
            Qty: Math.floor(Math.random() * 200),
            Rating: (i % 5) + 1
        });
    }
    return result;
}

function sampleOrgTree(count) {
    var result = [{ id: 0, parentId: null, name: '대표이사', title: 'CEO' }];
    var teams = ['개발본부', '영업본부', '지원본부'];
    var nextId = 1;
    for (var t = 0; t < teams.length; t++) {
        var teamId = nextId++;
        result.push({ id: teamId, parentId: 0, name: teams[t] + '장', title: '본부장' });
        for (var i = 0; i < count; i++) {
            result.push({ id: nextId++, parentId: teamId, name: teams[t] + ' 팀원 ' + (i + 1), title: '팀원' });
        }
    }
    return result;
}

function sampleOrders(count) {
    var statuses = ['결제완료', '배송중', '배송완료', '취소'];
    var result = [];
    for (var i = 1; i <= count; i++) {
        var itemCount = 1 + (i % 4);
        var details = [];
        var total = 0;
        for (var d = 0; d < itemCount; d++) {
            var price = 5000 + (d * 3700) % 40000;
            var qty = 1 + (d % 3);
            details.push({ ProdName: '상품 ' + (d + 1), Price: price, Qty: qty, Amount: price * qty });
            total += price * qty;
        }
        result.push({
            OrderNo: 'ORD' + String(10000 + i),
            OrderDate: '2026-0' + ((i % 6) + 1) + '-1' + (i % 9),
            CustomerName: '고객 ' + i,
            Status: statuses[i % statuses.length],
            TotalAmount: total,
            Details: details
        });
    }
    return result;
}

function sampleReviewHistory(memberNo) {
    var result = [];
    for (var i = 1; i <= 4; i++) {
        result.push({ Round: i + '차', Evaluator: '평가자' + i, Score: 60 + ((memberNo * i * 7) % 40), Comment: memberNo + '번 사용자 ' + i + '차 평가 코멘트' });
    }
    return result;
}

function sampleRegionSales() {
    var regions = ['서울', '부산', '대구', '인천', '광주', '대전', '울산'];
    return regions.map(function (r, i) { return { name: r, value: 3000 + (i * 977) % 9000 }; });
}

function sampleTimeSeries(days) {
    var result = [];
    var base = 500;
    for (var i = 0; i < days; i++) {
        base += Math.round((Math.random() - 0.45) * 60);
        base = Math.max(50, base);
        var d = new Date(2026, 0, 1 + i);
        result.push({ date: d.toISOString().slice(0, 10), value: base });
    }
    return result;
}

function sampleCategoryShare() {
    return [
        { name: '음료', value: 335 },
        { name: '스낵', value: 234 },
        { name: '생활용품', value: 154 },
        { name: '문구', value: 135 },
        { name: '기타', value: 98 }
    ];
}

function samplePriceQty(count) {
    var result = [];
    for (var i = 0; i < count; i++) {
        var price = 10 + Math.round(Math.random() * 90);
        var qty = Math.round(price * 1.4 + (Math.random() - 0.5) * 40);
        result.push([price, Math.max(1, qty)]);
    }
    return result;
}

function sampleHeatMatrix() {
    var days = ['월', '화', '수', '목', '금', '토', '일'];
    var hours = ['09', '12', '15', '18', '21'];
    var result = [];
    for (var h = 0; h < hours.length; h++) {
        for (var d = 0; d < days.length; d++) {
            result.push([d, h, Math.round(Math.random() * 10)]);
        }
    }
    return { days: days, hours: hours, data: result };
}

function sampleBudgetTree() {
    return [
        { name: '개발', value: 0, children: [{ name: '인건비', value: 4200 }, { name: '장비', value: 800 }, { name: '외주', value: 1200 }] },
        { name: '영업', value: 0, children: [{ name: '인건비', value: 2600 }, { name: '마케팅', value: 1800 }] },
        { name: '지원', value: 0, children: [{ name: '인건비', value: 1400 }, { name: '운영', value: 600 }] }
    ];
}

function sampleSankeyFlow() {
    return {
        nodes: [{ name: '유입' }, { name: '홈' }, { name: '상품목록' }, { name: '장바구니' }, { name: '결제' }, { name: '이탈' }],
        links: [
            { source: '유입', target: '홈', value: 1000 },
            { source: '홈', target: '상품목록', value: 700 },
            { source: '홈', target: '이탈', value: 300 },
            { source: '상품목록', target: '장바구니', value: 420 },
            { source: '상품목록', target: '이탈', value: 280 },
            { source: '장바구니', target: '결제', value: 260 },
            { source: '장바구니', target: '이탈', value: 160 }
        ]
    };
}

function sampleStocks(days) {
    var result = [];
    var price = 50000;
    for (var i = 0; i < days; i++) {
        var open = price;
        var close = open + Math.round((Math.random() - 0.5) * 2000);
        var low = Math.min(open, close) - Math.round(Math.random() * 500);
        var high = Math.max(open, close) + Math.round(Math.random() * 500);
        var volume = 1000 + Math.round(Math.random() * 5000);
        var d = new Date(2026, 0, 1 + i);
        result.push({ date: d.toISOString().slice(0, 10), open: open, close: close, low: low, high: high, volume: volume });
        price = close;
    }
    return result;
}

function sampleRadarScore() {
    return {
        indicator: [{ name: '속도', max: 100 }, { name: '정확도', max: 100 }, { name: '안정성', max: 100 }, { name: '확장성', max: 100 }, { name: '문서화', max: 100 }],
        values: [82, 74, 90, 68, 77]
    };
}

function sampleFunnel() {
    return [
        { name: '방문', value: 1000 },
        { name: '상품조회', value: 720 },
        { name: '장바구니', value: 420 },
        { name: '결제시작', value: 260 },
        { name: '결제완료', value: 180 }
    ];
}

function sampleBoxplotData() {
    function group() {
        var arr = [];
        for (var i = 0; i < 40; i++) { arr.push(Math.round(Math.random() * 100)); }
        return arr;
    }
    return { 'A그룹': group(), 'B그룹': group(), 'C그룹': group(), 'D그룹': group() };
}

function sampleParallelData(count) {
    var result = [];
    for (var i = 0; i < count; i++) {
        result.push([
            Math.round(20 + Math.random() * 80),
            Math.round(10 + Math.random() * 90),
            Math.round(1000 + Math.random() * 9000),
            Math.round(Math.random() * 5)
        ]);
    }
    return result;
}

function sampleGeoRegions() {
    return [
        { name: '서울', coord: [50, 82], value: 820 },
        { name: '인천', coord: [30, 78], value: 340 },
        { name: '대전', coord: [48, 58], value: 260 },
        { name: '대구', coord: [68, 42], value: 300 },
        { name: '광주', coord: [32, 36], value: 240 },
        { name: '부산', coord: [72, 22], value: 410 },
        { name: '울산', coord: [76, 34], value: 190 }
    ];
}

function sampleNetworkGraph() {
    var categories = [{ name: '고객' }, { name: '상품' }, { name: '카테고리' }];
    var nodes = [
        { name: '고객A', category: 0, symbolSize: 40, value: 40 },
        { name: '고객B', category: 0, symbolSize: 30, value: 30 },
        { name: '고객C', category: 0, symbolSize: 20, value: 20 },
        { name: '음료', category: 2, symbolSize: 50, value: 50 },
        { name: '스낵', category: 2, symbolSize: 40, value: 40 },
        { name: '상품 1', category: 1, symbolSize: 18, value: 18 },
        { name: '상품 2', category: 1, symbolSize: 18, value: 18 },
        { name: '상품 3', category: 1, symbolSize: 18, value: 18 }
    ];
    var links = [
        { source: '고객A', target: '상품 1' }, { source: '고객A', target: '상품 2' },
        { source: '고객B', target: '상품 2' }, { source: '고객C', target: '상품 3' },
        { source: '상품 1', target: '음료' }, { source: '상품 2', target: '음료' },
        { source: '상품 3', target: '스낵' }
    ];
    return { categories: categories, nodes: nodes, links: links };
}

function sampleCalendarData(year) {
    var result = [];
    var start = new Date(year, 0, 1);
    var end = new Date(year, 11, 31);
    for (var d = start; d <= end; d.setDate(d.getDate() + 1)) {
        result.push([new Date(d).toISOString().slice(0, 10), Math.round(Math.random() * 8)]);
    }
    return result;
}
