/* eslint-disable */
/*
 * AUIGrid 사용자 정의 에디트 렌더러
 * textarea 에디트 렌더러
 */
window.AUIGrid.TextareaEditor = window.AUIGrid.Class({
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
	cssClass: 'aui-grid-edit-renderer-custom aui-grid-edit-renderer-custom-textarea',

	/* 행 아이템 */
	data: null,

	/* 렌더러의 칼럼 레이아웃 데이터 */
	columnData: null,

	/* 칼럼 인덱스 */
	columnIndex: -1,

	/* 행 인덱스 */
	rowIndex: -1,

	/* 데이터 필드명 */
	dataField: '',

	/* 사용자가 설정한 여분의 속성 */
	extraProps: null,

	/****************************************************************
	 *
	 * Private Properties
	 *
	 * Rule : Private Properties 는 반드시 __ 로 시작하십시오
	 * 즉, 사용자가 추가하는 속성, 메소드는 __ 로 시작하십시오.
	 *
	 ****************************************************************/

	// textarea 엘리먼트
	__textareaEle: null,

	/****************************************************************
	 *
	 * Overriden Methods
	 *
	 ****************************************************************/

	/*
	 * @Overriden public destroy
	 * @param {boolean} unload 실제 DOM 에서 제거할지 여부
	 *
	 * 셀 수정 완료(취소) 될 때 마지막에 호출됩니다.
	 * 여기서 해제할 것 모두 해제 하십시오.
	 * 메모리 누수를 유발하는 코드들을 모두 해제 하십시오.
	 */
	destroy: function (unload) {
		this.__textarea.removeEventListener('keyup', this.__textareaKeyUpHandler);
		this.__confirmBtn.removeEventListener('click', this.__confirmBtnClickHandler);
		this.__cancelBtn.removeEventListener('click', this.__cancelBtnClickHandler);

		this.__textarea = null;
		this.__confirmBtn = null;
		this.__cancelBtn = null;

		// 필수 : 반드시 아래 코드는 추가 해야 합니다.
		this.$super.destroy(unload);
	},

	/*
	 * @Overriden public create
	 *
	 * 셀 수정 진입할 때 동적으로 에디트렌더러가 생성되며 그리드에 의해 호출됩니다.
	 * 초기 엘리먼트 생성 및 이벤트를 설정하십시오.
	 */
	create: function () {
		var extraProps = this.extraProps;

		// textare
		this.__textarea = document.createElement('textarea');
		this.__textarea.value = this.data[this.dataField]; // 값 설정
		this.__textareaKeyUpHandler = this.__textareaKeyUpHandler.bind(this);
		this.__textarea.addEventListener('keyup', this.__textareaKeyUpHandler);
		this.element.appendChild(this.__textarea);

		// 확인 버튼
		this.__confirmBtn = document.createElement('button');
		this.__confirmBtn.className = 'custom-textarea-confirm-btn';
		this.__confirmBtn.innerText = extraProps.confirm || '확 인';
		this.__confirmBtnClickHandler = this.__confirmBtnClickHandler.bind(this);
		this.__confirmBtn.addEventListener('click', this.__confirmBtnClickHandler);

		// 취소 버튼
		this.__cancelBtn = document.createElement('button');
		this.__cancelBtn.className = 'custom-textarea-cancel-btn';
		this.__cancelBtn.innerText = extraProps.cancel || '취 소';
		this.__cancelBtnClickHandler = this.__cancelBtnClickHandler.bind(this);
		this.__cancelBtn.addEventListener('click', this.__cancelBtnClickHandler);

		this.element.appendChild(this.__confirmBtn);
		this.element.appendChild(this.__cancelBtn);

		// textarea 선택 시키기
		setTimeout(
			function () {
				this.__textarea.focus();
				this.__textarea.select();
			}.bind(this)
		);
	},

	/*
	 * @Overriden public triggerEditEndEvent
	 * @param {object} newValue 에디팅 완료로 적용 시킬 새로운 값
	 * @param {string} which 에디팅 완료를 발생 시킨 행위에 대한 정의
	 *
	 * 에디팅 완료(cellEditEnd) 이벤트를 발생 시키고 실제로 에디팅 종료시킵니다.
	 */
	triggerEditEndEvent: function (newValue, which) {
		this.$super.triggerEditEndEvent(newValue, which);
	},

	/*
	 * @Overriden public triggerEditCancelEvent
	 * @param {string} which 에디팅 취소를 발생 시킨 행위에 대한 정의
	 *
	 * 에디팅 취소(cellEditCancel) 이벤트를 발생 시키고 에디팅 취소시킵니다.
	 */
	triggerEditCancelEvent: function (which) {
		this.$super.triggerEditCancelEvent(which);
	},

	/*
	 * @Overriden public injectValue
	 * @param {obejct} value 새로운 값
	 *
	 * 외부에 의해 에디팅이 완료될 경우를 위해 값을 주입 시켜 놓습니다.
	 * 에디트렌더러의 정상적인 종료가 아닌 외부 특정 요인에 의해 수정 완료 처리될 때 여기서 주입시켜 놓은 값이 적용됩니다.
	 */
	injectValue: function (value) {
		this.$super.injectValue(value);
	},

	/****************************************************************
	 *
	 * Private Methods
	 *
	 * Rule : Private Methods 는 반드시 __ 로 시작하십시오
	 * 즉, 사용자가 추가하는 속성, 메소드는 __ 로 시작하십시오.
	 *
	 ****************************************************************/

	__textareaKeyUpHandler: function (event) {
		if (event.keyCode == 13 && event.ctrlKey) {
			// Ctrl + Enter
			event.preventDefault();
			// 에디팅 완료 시킴
			this.triggerEditEndEvent(this.__textarea.value); // ESC
			return;
		} else if (event.keyCode == 27) {
			event.preventDefault();
			// 에디팅 취소 시킴.
			this.triggerEditCancelEvent();
			return;
		}

		// 외부에 의해 에디팅이 완료될 경우를 위해 값을 주입 시켜 놓습니다.
		// 에디트렌더러의 정상적인 종료가 아닌 외부 특정 요인에 의해 수정 완료 처리될 때 여기서 주입시켜 놓은 값이 적용됩니다.
		if (event.keyCode != 13) this.injectValue(this.__textarea.value);
	},

	__confirmBtnClickHandler: function (evet) {
		// 에디팅 완료 시킴
		this.triggerEditEndEvent(this.__textarea.value);
	},

	__cancelBtnClickHandler: function (event) {
		// 에디팅 취소 시킴.
		this.triggerEditCancelEvent();
	}
}).extend(window.AUIGrid.EditRendererBase);
