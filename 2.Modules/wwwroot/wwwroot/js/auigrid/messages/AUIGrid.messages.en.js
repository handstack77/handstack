/* eslint-disable */
/**
 * AUIGrid 에서 사용되는 메세지들을 정의합니다. - 미국 영어
 * 마지막 추가된 버전 : v3.0.13
 */
var AUIGridMessages = {
	/*
	 * 그리드에 출력시킬 데이터가 없는 메세지
	 */
	noDataMessage: 'No Data to display',

	/*
	 * 그룹핑 패널 메세지
	 */
	groupingMessage: 'Drag a column header and drop here to group by that',

	/*
	 * 필터 메뉴 메세지들
	 */
	filterNoValueText: '( Empty Value )',
	filterCheckAllText: '( Check All )',
	filterClearText: 'Clear Filter',
	filterSearchCheckAllText: '( Check All Found )',
	filterSearchCheckAddText: '( Add Current Selection to Filter )',
	filterSearchPlaceholder: 'Search', // 필터 검색 플레이홀더 텍스트
	filterOkText: 'Okay',
	filterCancelText: 'Cancel',
	filterCloseText: 'Close',

	filterItemMoreMessage: 'Too many items...Search words',
	filterNumberOperatorList: ['Equal(=)', 'Greater than(>)', 'Greater than or Equal(>=)', 'Less than(<)', 'Less than or Equal(<=)', 'Not Equal(!=)'],

	filterExMenuTextLabel: 'Text Custom Filter',
	filterExMenuNumberLabel: 'Number Custom Filter',
	filterModalTitle: 'Custom Filter',
	filterModalFieldText: 'Field Name',
	filterModalAndLabel: 'AND',
	filterModalOrLabel: 'OR',
	filterExMenuTextList: ['Equal', 'Not Equal', '_$line', 'Starts with', 'Ends width', '_$line', 'Contains', 'Do Not Contains'],
	filterExMenuNumberList: [
		'Equal(=)',
		'Not Equal(!=)',
		'_$line',
		'Greater than(>)',
		'Greater than or Equal(>=)',
		'Less than(<)',
		'Less than or Equal(<=)',
		'Applicable range',
		'_$line',
		'Top 10',
		'Above average',
		'Below average'
	],

	/*
	 * 천 단위 구분자
	 */
	thousandSeparator: ',',

	/*
	 * 소수점 구분자
	 */
	decimalSeparator: '.',

	/*
	 * 그룹핑 썸머리 합계 메세지
	 */
	summaryText: 'Summary',

	/*
	 * 행번호 칼럼의 헤더 텍스트
	 */
	rowNumHeaderText: 'No.',

	/*
	 * 원격(리모트) 리스트 렌더러 검색 텍스트
	 */
	remoterPlaceholder: 'Input your text',

	/*
	 * 드랍다운리스트 전체 선택 텍스트
	 */
	dropDownCheckAllTxt: '( Select All )',

	/*
	 * 기본 컨텍스트 메뉴
	 */
	contextTexts: ['Show only $value', 'Show all except $value', 'Hide $value', 'Clear Filtering All', 'Fixed Columns', 'Clear Fixed Columns all'],

	/*
	 * 달력
	 */
	calendar: {
		titles: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
		formatYearString: 'yyyy',
		monthTitleString: 'mmm',
		formatMonthString: 'mmm, yyyy',
		todayText: 'Today',
		uncheckDateText: 'Delete the date',
		firstDay: 0,
		confirmText: 'Okay'
	},

	/*
	 * date 의 formatString mmm, mmmm
	 */
	monthNames: [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec',
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	],

	/*
	 * date 의 formatString ddd, dddd
	 */
	dayNames: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],

	/*
	 * date 의 formatString t tt T TT
	 */
	meridiems: ['a', 'p', 'am', 'pm', 'A', 'P', 'AM', 'PM'],

	/*
	 * 내보내기 진행 표시
	 */
	exportProgress: {
		init: 'Initializing Exporting...',
		progress: 'Exporting in progress...',
		complete: 'Almost Complete...',
	},

	/*
	 * 행 드래그 시 나타나는 기본 메세지
	 */
	dragRowsText: '$value Row(s)',
	
	/*
	 * 체크박스 헤더 텍스트
	 */
	checkHeaderText: ''
};
if (typeof window !== "undefined") window.AUIGridMessages = AUIGridMessages;