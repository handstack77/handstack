/* eslint-disable */
/*
 * AUIGrid 사용자 정의 렌더러
 */
window.AUIGrid.MyStockRenderer = window.AUIGrid.Class({
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

	/* 사용자가 작성할 엘리먼트*/
	__childEle3: null,

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

		// 최초 1회만 실행해야 할 것들.
		if (!this.initialized) {
			this.initialize();
		}

		const ele = this.element;
		const varsEle = this.__childEle2;
		// 등락 대비값
		const vars = Number(data.vars);

		// 색상 및 배경 이미지 설정
		const styles = {
			color: '#000000',
			background: 'transparent'
		};

		if (vars > 0) {
			styles.color = '#D90400';
			styles.background = "url('./assets/ico_up.gif') 0% 50% no-repeat";
		} else if (vars < 0) {
			styles.color = '#005DDE';
			styles.background = "url('./assets/ico_down.gif') 0% 50% no-repeat";
		}

		this.__setStyle(ele, 'color', styles.color);
		this.__setStyle(varsEle, 'background', styles.background);

		// 실제 element 에 값 출력
		this.__displayMyValues();
	},

	/*
	 * @Overriden public destroy
	 *
	 * 여기서 해제할 것 모두 해제 하십시오.
	 * 메모리 누수를 유발하는 코드들을 모두 해제 하십시오.
	 */
	destroy: function (unload) {
		this.__childEle = null;
		this.__childEle2 = null;
		this.__childEle3 = null;

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

		// 자식 요소 생성
		const createChildDiv = (className) => {
			const div = document.createElement('div');
			div.className = className;
			element.appendChild(div);
			return div;
		};

		// 각 자식 div 생성 및 참조 보관
		this.__childEle = createChildDiv('my-child1');
		this.__childEle2 = createChildDiv('my-child2');
		this.__childEle3 = createChildDiv('my-child3');
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
		if (!this.data) return;

		const setText = (el, value) => {
			if (el) el.textContent = value;
		};

		setText(this.__childEle, this.data.close); // 종가
		setText(this.__childEle2, this.data.vars + '%'); // 등락률
		setText(this.__childEle3, this.data.gap); // 등락 차이
	},

	/* element (엘리먼트) 에 styles 을 설정합니다. */
	__setStyle: function (element, name, value) {
		element.style[name] = value;
	}
}).extend(window.AUIGrid.RendererBase);
