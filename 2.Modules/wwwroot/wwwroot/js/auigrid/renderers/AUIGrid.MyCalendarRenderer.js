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
	 * 이 메소드에서 DOM 검색이나, jQuery 객체 생성 등은 자제하십시오.
	 * DOM 검색이나 jQuery 객체는 initialize() 메소드에서 하십시오.
	 */
	update: function () {
		var data = this.data; // 행 전체 아이템
		if (!data) return;

		var ownData = data[this.dataField]; // 현재 칼럼 아이템

		if (!ownData) {
			// 칼럼 데이터가 없는 경우
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
		var element = this.element;
		// 중요!!!! child 들이 absolute 포지션을 갖기 때문에 relative 해줘야 함.
		this.__setStyle(element, 'position', 'relative');

		var c1 = (this.__childEle = document.createElement('div'));
		c1.className = 'my-child1';

		var c2 = (this.__childEle2 = document.createElement('div'));
		c2.className = 'my-child2';

		var self = this;
		//-- 아이콘 클릭
		c2.onclick = function (event) {
			var date = self.data[self.dataField].date;
			var value = self.data[self.dataField].value;
			alert('rowIndex : ' + self.rowIndex + ', columnIndex : ' + self.columnIndex + ', 날짜 : ' + date + ', 값 : ' + value + ' 아이콘 클릭');
		};

		element.appendChild(c1);
		element.appendChild(c2);

		// 차트 생성
		this.__createBarChart();

		// IE 메모리 누수 방지
		c1 = c2 = null;
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
		var el, ownValue;

		var data = this.data; // 행 전체 아이템
		var ownItem = data[this.dataField]; // 현재 칼럼 아이템

		// 달력에 날짜 출력
		if (data && ownItem) {
			el = this.__childEle;
			ownValue = ownItem.date;
			el.textContent != null ? (el.textContent = ownValue) : (el.innerText = ownValue);
		}
		el = null;
	},

	// 차트를 생성합니다.
	__createBarChart: function () {
		var chartBase = (this.__chartBase = document.createElement('div'));
		chartBase.className = 'my-chart-base';

		var chart = (this.__chart = document.createElement('div'));
		chart.className = 'my-chart';

		var chartLabel = (this.__chartLabel = document.createElement('div'));
		chartLabel.className = 'my-chart-label';

		chartBase.appendChild(chart);
		this.element.appendChild(chartLabel);
		this.element.appendChild(chartBase);

		// IE 메모리 누수 방지
		chartLabel = chartBase = chart = null;
	},

	// 차트 값 갱신
	__updateBarChart: function (value) {
		var el = this.__chartLabel;

		// 값 % 출력
		var text = value + ' %';
		el.textContent != null ? (el.textContent = text) : (el.innerText = text);

		//-- 차트 value 에 맞게 크기 조절

		var chartWidth = 90; // 차트 전체 width

		var pos = ((chartWidth * value) / 100).toFixed(2) + 'px';
		var bgColor = '#000000';
		if (value < 20) {
			bgColor = '#FF0000';
		} else if (value < 50) {
			bgColor = '#FFBB00';
		} else if (value < 75) {
			bgColor = '#ABF200';
		} else {
			bgColor = '#1DDB16';
		}

		this.__setStyle(this.__chart, 'width', pos);
		this.__setStyle(this.__chart, 'background', bgColor);
	},

	/* 생성된 자식들 엘리먼트 보이기/ 감추기 설정 */
	__setChildrenVisible: function (visible) {
		if (visible) {
			this.__childEle.style.display = 'block';
			this.__childEle2.style.display = 'block';
			this.__chartBase.style.display = 'block';
			this.__chartLabel.style.display = 'block';
		} else {
			this.__childEle.style.display = 'none';
			this.__childEle2.style.display = 'none';
			this.__chartBase.style.display = 'none';
			this.__chartLabel.style.display = 'none';
		}
	},

	/* element (엘리먼트) 에 styles 을 설정합니다. */
	__setStyle: function (element, name, value) {
		element.style[name] = value;
	}
}).extend(window.AUIGrid.RendererBase);
