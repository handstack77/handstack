syn.bundle.css를 새로 가져올 때 주요 아이콘 경로를 로컬환경에 맞게 수정 해야함
수정 대상
background: url("/Contents/Images/icon/ico_alert.png") 0 0 no-repeat;
background: url("/bundle/img/icon/ico_alert.png") 0 0 no-repeat;

background-image: url('/Contents/Images/icon/uikit-icon-set.png');
background-image: url('/bundle/img/icon/uikit-icon-set.png');

background: url(/Contents/Images/btn/btn_popClose.png) no-repeat;
background: url(/bundle/img/btn/btn_popClose.png) no-repeat;

/Contents/Images/
/assets/img/

/Contents/Fonts/
/assets/font/

/Contents/UIControls/LoadingPage/
/assets/img/

//# sourceMappingURL
// 
---------------------------------------------------------------------------------------------------

syn.bundle.js, syn.controls.js 를 새로 가져올 때 주요 아이콘 경로를 로컬환경에 맞게 수정 해야함
$w.showUIDialog('/Views/Shared/codehelp/index.html?parameterID={0}'.format(parameterID), dialogOptions, function (result) {
$w.showUIDialog('/Shared/codehelp/index.html?parameterID={0}'.format(parameterID), dialogOptions, function (result) {

$grid.js 기본 설정 변경
stretchH: 'none', > stretchH: 'last',

sortIndicator: true,
columnSorting: {
    sortOrder: 'none',
    sortEmptyCells: true
},
>
sortIndicator: false,
columnSorting: false,