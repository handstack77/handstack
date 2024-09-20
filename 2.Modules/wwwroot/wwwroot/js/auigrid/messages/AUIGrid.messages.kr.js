/* eslint-disable */
/**
 * AUIGrid 에서 사용되는 메세지들을 정의합니다. - 한국어
 * 마지막 추가된 버전 : v3.0.13
 */
var AUIGridMessages = {
	/*
	 * 그리드에 출력시킬 데이터가 없는 메세지
	 */
	noDataMessage: '출력할 데이터가 없습니다.',

	/*
	 * 그룹핑 패널 메세지
	 */
	groupingMessage: '여기에 칼럼을 드래그하면 그룹핑이 됩니다.',

	/*
	 * 필터 메뉴 메세지들
	 */
	filterNoValueText: '(필드 값 없음)',
	filterCheckAllText: '(전체선택)',
	filterClearText: '필터 초기화',
	filterSearchCheckAllText: '(검색 전체선택)',
	filterSearchCheckAddText: '(현재 선택 필터에 누적하여 적용)',
	filterSearchPlaceholder: '검색', // 필터 검색 플레이홀더 텍스트
	filterOkText: '확 인',
	filterCancelText: '취 소',
	filterCloseText: '닫기',

	filterItemMoreMessage: 'Too many items...Search words',
	filterNumberOperatorList: ['같다(=)', '크다(>)', '크거나 같다(>=)', '작다(<)', '작거나 같다(<=)', '같지 않다(!=)'],

	filterExMenuTextLabel: '텍스트 사용자 필터',
	filterExMenuNumberLabel: '숫자 사용자 필터',
	filterModalTitle: '사용자 정의 필터',
	filterModalFieldText: '필드명',
	filterModalAndLabel: '그리고',
	filterModalOrLabel: '또는',
	filterExMenuTextList: ['같음', '같지 않음', '_$line', '시작 문자', '끝 문자', '_$line', '포함', '포함하지 않음'],
	filterExMenuNumberList: ['같음(=)', '같지 않음(!=)', '_$line', '보다 큼(>)', '크거나 같음(>=)', '보다 작음(<)', '작거나 같음(<=)', '해당 범위', '_$line', '상위 10', '평균 초과', '평균 미만'],

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
	summaryText: '합계',

	/*
	 * 행번호 칼럼의 헤더 텍스트
	 */
	rowNumHeaderText: 'No.',

	/*
	 * 원격(리모트) 리스트 렌더러 검색 텍스트
	 */
	remoterPlaceholder: '검색어를 입력하세요.',

	/*
	 * 드랍다운리스트 전체 선택 텍스트
	 */
	dropDownCheckAllTxt: '( 전체 선택 )',

	/*
	 * 기본 컨텍스트 메뉴
	 */
	contextTexts: ['$value 만 보기', '$value 제거하고 다 보기', '$value 제거하고 보기', '모든 필터링 초기화', '칼럼 틀 고정', '칼럼 틀 고정 초기화'],

	/*
	 * 달력
	 */
	calendar: {
		titles: ['일', '월', '화', '수', '목', '금', '토'],
		formatYearString: 'yyyy년',
		monthTitleString: 'm월',
		formatMonthString: 'yyyy년 mm월',
		todayText: '오늘 선택',
		uncheckDateText: '날짜 선택 해제',
		firstDay: 0,
		confirmText: '확 인'
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
	dayNames: ['일', '월', '화', '수', '목', '금', '토', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],

	/*
	 * date 의 formatString t tt T TT
	 */
	meridiems: ['오전', '오후', 'am', 'pm', 'A', 'P', 'AM', 'PM'],

	/*
	 * 내보내기 진행 표시
	 */
	exportProgress: {
		init: '내보내기 초기화 중...',
		progress: '내보내기 진행 중...',
		complete: '내보내기가 곧 완료됩니다.'
	},

	/*
	 * 행 드래그 시 나타나는 기본 메세지
	 */
	dragRowsText: '$value 행(들)',
	
	/*
	 * 체크박스 헤더 텍스트
	 */
	checkHeaderText: ''
};
if (typeof window !== "undefined") window.AUIGridMessages = AUIGridMessages;