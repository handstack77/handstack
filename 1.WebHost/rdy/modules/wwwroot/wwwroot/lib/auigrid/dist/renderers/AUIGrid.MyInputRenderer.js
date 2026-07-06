/* eslint-disable */
/*
 * AUIGrid 사용자 정의 렌더러
 * input 렌더러 (자체 수정 기능을 갖춘 렌더러)
 */
window.AUIGrid.MyInputRenderer = window.AUIGrid.Class({
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

	/* 사용자가 작성할 엘리먼트. input 엘리먼트*/
	__inputEle: null,

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

		// input 엘리먼트에 값 설정
		this.__inputEle.value = data[this.dataField];
	},

	/*
	 * @Overriden public destroy
	 *
	 * 여기서 해제할 것 모두 해제 하십시오.
	 * 메모리 누수를 유발하는 코드들을 모두 해제 하십시오.
	 */
	destroy: function (unload) {
		// 이벤트 제거 및 참조 해제
		if (this.__inputEle) {
			this.__inputEle.removeEventListener('blur', this.__inputBlurHandler);
			this.__inputEle.removeEventListener('keydown', this.__inputKeyDownHandler);
			this.__inputEle = null;
		}

		// 핸들러 자체도 null로 해제
		this.__inputBlurHandler = null;
		this.__inputKeyDownHandler = null;

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

		// 렌더러 자체 HTML Element(Div) 스타일 지정
		this.__setStyles(this.element, {
			display: 'flex',
			alignItems: 'center'
		});

		// input 입력 필드 생성
		const input = document.createElement('input');
		input.className = 'aui-grid-custom-renderer-input';
		input.setAttribute('enterkeyhint', 'done');

		// 참조 저장
		this.__inputEle = input;

		// 이벤트 핸들러 바인딩 및 등록
		this.__inputBlurHandler = this.__inputBlurHandler.bind(this);
		this.__inputKeyDownHandler = this.__inputKeyDownHandler.bind(this);

		input.addEventListener('blur', this.__inputBlurHandler);
		input.addEventListener('keydown', this.__inputKeyDownHandler);

		this.element.appendChild(input);
	},

	/****************************************************************
	 *
	 * Private Methods
	 *
	 * Rule : Private Methods 는 반드시 __ 로 시작하십시오
	 * 즉, 사용자가 추가하는 속성, 메소드는 __ 로 시작하십시오.
	 *
	 ****************************************************************/

	__inputBlurHandler: function (event) {
		// Blur (포커스를 잃은 경우) 해당 값으로 수정 적용 시킴
		this.__updateValue(event.currentTarget.value);
	},

	__inputKeyDownHandler: function (event) {
		const { pid, rowIndex, columnIndex } = this;

		// 엔터나 탭을 직접 입력한 경우
		// event.keycode deprecated 되었기 때문에 event.key 도 사용
		const isNextKey = event.key === 'Enter' || event.keyCode === 13 || event.key === 'Tab' || event.keyCode === 9;

		if (!isNextKey) return;

		event.preventDefault(); // 기본 행위 금지

		// 다음 행의 셀에 셀렉션 처리
		window.AUIGrid.setSelectionByIndex(pid, rowIndex + 1, columnIndex);

		// 다음 셀의 input에 포커스 이동 (비동기)
		setTimeout(() => {
			const ele = window.AUIGrid.getCellElementByIndex(pid, rowIndex + 1, columnIndex);
			if (ele) {
				const input = ele.getElementsByTagName('input')[0]; // 첫 번째 'input' 요소를 가져옴
				if (input) input.focus();
			}
		}, 0);
	},

	/* 실제 그리드 데이터 모델에 값 수정을 지시합니다. */
	__updateValue: function (value) {
		window.AUIGrid.setCellValue(this.pid, this.rowIndex, this.dataField, value);
	},

	/* element (엘리먼트) 에 styles 을 설정합니다. */
	__setStyles: function (element, obj) {
		for (let n in obj) {
			element.style[n] = obj[n];
		}
	}
}).extend(window.AUIGrid.RendererBase);
