/* eslint-disable */
/*
 * AUIGrid 사용자 정의 렌더러
 */
window.AUIGrid.MyCalendarRenderer = window.AUIGrid.Class({
	/****************************************************************
	 *
	 * Overriden Properties
	 *
	 ****************************************************************/

	/* 생성될 HTML Tag 명 */
	tagName: 'div',

	/* 렌더러 HTML 엘리먼트 */
	element: null,

	/* CSS 스타일 클래스 */
	cssClass: 'aui-grid-renderer-base aui-grid-renderer-custom',

	/* 행 아이템 */
	data: null,

	/* 렌더러의 칼럼 레이아웃 데이터 */
	columnData: null,

	/* 칼럼 인덱스 */
	columnIndex: -1,

	/* 행 인덱스 */
	rowIndex: -1,

	/* 헤더 텍스트 */
	headerText: '',

	/* 데이터 필드명 */
	dataField: '',

	/* 초기화 여부 */
	initialized: false,

	/* 현재 렌더링되는 주체의 그리드 pid. 그리드 생성 후 주입됨 */
	pid: '',

	/****************************************************************
	 *
	 * Private Properties
	 *
	 * Rule : Private Properties 는 반드시 __ 로 시작하십시오
	 * 즉, 사용자가 추가하는 속성, 메소드는 __ 로 시작하십시오.
	 *
	 ****************************************************************/

	/* 사용자가 작성할 엘리먼트*/
	__childEle: null,

	/* 사용자가 작성할 엘리먼트*/
	__childEle2: null,

	__chartBase: null,

	__chart: null,

	__chartLabel: null,

	/****************************************************************
	 *
	 * Overriden Methods
	 *
	 ****************************************************************/

	/*
	 * @Overriden public update
	 *
	 * 그리드에 의해 호출되는 메소드이며 빈번히 호출됩니다.
	 * 이 메소드에서 DOM 검색이나 조작은 자제하십시오.
	 */
	update: function () {
		// 행 아이템
		const data = this.data;
		if (!data) return;

		const ownData = data[this.dataField];
		if (!ownData) {
			if (this.initialized) {
				this.__setChildrenVisible(false);
			}
			return;
		}

		// 최초 1회만 실행해야 할 것들.
		if (!this.initialized) {
			this.initialize();
		} else {
			this.__setChildrenVisible(true);
		}
		// 실제 element 에 값 출력
		this.__displayMyValues();
		// 바차트 값 갱신
		this.__updateBarChart(ownData.value);
	},

	/*
	 * @Overriden public destroy
	 *
	 * 여기서 해제할 것 모두 해제 하십시오.
	 * 메모리 누수를 유발하는 코드들을 모두 해제 하십시오.
	 */
	destroy: function (unload) {
		if (this.__childEle2) this.__childEle2.onclick = null;

		this.__childEle = null;
		this.__childEle2 = null;
		this.__chartBase = null;
		this.__chart = null;
		this.__chartLabel = null;

		// 필수 : 반드시 아래 코드는 추가 해야 합니다.
		this.$super.destroy(unload);
	},

	/*
	 * @Overriden public initialize
	 *
	 * 최초 1번만 실행되므로 설정할 사항이 있으면 여기서 설정하십시오.
	 */
	initialize: function () {
		if (this.initialized) return;
		this.initialized = true;

		this.setHeight(this.rowHeight - 2);

		// 렌더러 자체 HTML Element(Div)
		const element = this.element;

		// 필수: 자식이 absolute 이므로 relative 필요
		this.__setStyle(element, 'position', 'relative');

		// 값 표시 영역
		const c1 = document.createElement('div');
		c1.className = 'my-child1';
		this.__childEle = c1;

		// 클릭 가능한 아이콘
		const c2 = document.createElement('div');
		c2.className = 'my-child2';
		this.__childEle2 = c2;

		// 아이콘 클릭 핸들러
		c2.onclick = (event) => {
			const { date, value } = this.data[this.dataField];
			// 원하는 작업 작성
			alert(`rowIndex: ${this.rowIndex}, columnIndex: ${this.columnIndex}, 날짜: ${date}, 값: ${value} 아이콘 클릭`);
		};

		// DOM 구성
		element.appendChild(c1);
		element.appendChild(c2);

		// 차트 생성
		this.__createBarChart();
	},

	/****************************************************************
	 *
	 * Private Methods
	 *
	 * Rule : Private Methods 는 반드시 __ 로 시작하십시오
	 * 즉, 사용자가 추가하는 속성, 메소드는 __ 로 시작하십시오.
	 *
	 ****************************************************************/

	/* 값을 실제로 element 에 출력함*/
	__displayMyValues: function () {
		const data = this.data;
		const ownItem = data[this.dataField];

		if (!data || !ownItem) return;

		const el = this.__childEle;
		const value = ownItem.date ?? '';

		el.textContent = value;
	},

	// 차트를 생성합니다.
	__createBarChart: function () {
		// 차트 베이스 생성
		const chartBase = document.createElement('div');
		chartBase.className = 'my-chart-base';
		this.__chartBase = chartBase;

		// 실제 바차트 (채워질 부분)
		const chart = document.createElement('div');
		chart.className = 'my-chart';
		this.__chart = chart;

		// 차트 값 텍스트 표시용 라벨
		const chartLabel = document.createElement('div');
		chartLabel.className = 'my-chart-label';
		this.__chartLabel = chartLabel;

		// DOM 구성
		chartBase.appendChild(chart);
		this.element.appendChild(chartLabel);
		this.element.appendChild(chartBase);
	},

	// 차트 값 갱신
	__updateBarChart: function (value) {
		const labelEl = this.__chartLabel;
		const chartEl = this.__chart;

		// 값 보정 (숫자 아닌 경우 대비)
		const percent = Number(value);
		if (isNaN(percent)) {
			labelEl.textContent = '';
			this.__setStyle(chartEl, 'width', '0px');
			return;
		}

		// % 텍스트 출력
		labelEl.textContent = `${percent} %`;

		// 전체 너비 대비 차트 비율 계산
		const chartWidth = 90; // 차트 전체 width
		const width = `${((chartWidth * percent) / 100).toFixed(2)}px`;

		// 구간별 색상 정의
		const getBarColor = (val) => {
			if (val < 20) return '#FF0000'; // 빨강
			if (val < 50) return '#FFBB00'; // 주황
			if (val < 75) return '#ABF200'; // 연두
			return '#1DDB16'; // 초록
		};

		this.__setStyle(chartEl, 'width', width);
		this.__setStyle(chartEl, 'background', getBarColor(percent));
	},

	/* 생성된 자식들 엘리먼트 보이기/ 감추기 설정 */
	__setChildrenVisible: function (visible) {
		const displayValue = visible ? 'block' : 'none';

		[this.__childEle, this.__childEle2, this.__chartBase, this.__chartLabel].forEach((el) => {
			if (el) el.style.display = displayValue;
		});
	},

	/* element (엘리먼트) 에 styles 을 설정합니다. */
	__setStyle: function (element, name, value) {
		element.style[name] = value;
	}
}).extend(window.AUIGrid.RendererBase);
