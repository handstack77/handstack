/* eslint-disable */
/*
 * AUIGrid 사용자 정의 렌더러
 * 아파치 echarts MIT License
 * https://echarts.apache.org/en/index.html
 */
window.AUIGrid.ChartRenderer = window.AUIGrid.Class({
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

	/* echart  객체 */
	__chart: null,

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

		// 실제 echart  출력
		this.__drawChart();
	},

	/*
	 * @Overriden public destroy
	 *
	 * 여기서 해제할 것 모두 해제 하십시오.
	 * 메모리 누수를 유발하는 코드들을 모두 해제 하십시오.
	 */
	destroy: function (unload) {
		// echart  제거
		this.__chart.clear();
		this.__chart = null;

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

		// echarts 초기화
		this.__chart = echarts.init(this.element, '', {
			width: this.width,
			height: 100
		});
	},

	/****************************************************************
	 *
	 * Private Methods
	 *
	 * Rule : Private Methods 는 반드시 __ 로 시작하십시오
	 * 즉, 사용자가 추가하는 속성, 메소드는 __ 로 시작하십시오.
	 *
	 ****************************************************************/

	/* echart 출력하기 */
	__drawChart: function () {
		const item = this.data;

		// 다음 참고하여 작성함.
		// https://echarts.apache.org/examples/en/editor.html?c=pie-simple
		const option = {
			tooltip: {
				confine: true,
				trigger: 'item'
			},
			series: [
				{
					name: item.region,
					type: 'pie',
					radius: '50%',
					data: [
						{ value: item.q1, name: 'Q1' },
						{ value: item.q2, name: 'Q2' },
						{ value: item.q3, name: 'Q3' },
						{ value: item.q4, name: 'Q4' }
					],
					emphasis: {
						itemStyle: {
							shadowBlur: 10,
							shadowOffsetX: 0,
							shadowColor: 'rgba(0, 0, 0, 0.5)'
						}
					}
				}
			]
		};

		option && this.__chart.setOption(option);
	}
}).extend(window.AUIGrid.RendererBase);
