// 데이터 요청
function requestData(url) {

	// ajax 요청 전 그리드에 로더 표시
	AUIGrid.showAjaxLoader(myGridID);
	
	// ajax (XMLHttpRequest) 로 그리드 데이터 요청
	ajax({
		url : url,
		onSuccess : function(data) {
			
			//console.log(data);
			
			// 그리드에 데이터 세팅
			// data 는 JSON 을 파싱한 Array-Object 입니다.
			AUIGrid.setGridData(myGridID, data);

			// 로더 제거
			AUIGrid.removeAjaxLoader(myGridID);
		},
		onError : function(status, e) {
			alert("데이터 요청에 실패하였습니다.\r status : " + status);
			// 로더 제거
			AUIGrid.removeAjaxLoader(myGridID);
		}
	});
};

var timerId = null;

// 리사이즈 이벤트
window.onresize = function() {
	
	// 200ms 보다 빠르게 리사이징 된다면..
	if(timerId !== null) {
		clearTimeout(timerId);
	}
	
	timerId = setTimeout(function() {
		// 그리드 리사이징
		if(typeof myGridID != "undefined" ) {
			AUIGrid.resize(myGridID);
		}
		if(typeof myGridID2 != "undefined") {
			AUIGrid.resize(myGridID2);
		}
	}, 200);  // 현재 200ms 민감도....환경에 맞게 조절하세요.
};

// async confirm
function asyncConfirm(text) {
	return new Promise(function (resolve) {
		var wrapper = document.createElement('div');
		wrapper.className = 'popup-layer';
		var popup = document.createElement('div');
		popup.className = 'popup-confirm';
		wrapper.appendChild(popup);

		var textDiv = document.createElement('div');
		textDiv.textContent = text;
		popup.appendChild(textDiv);

		var footerDiv = document.createElement('div');
		footerDiv.className = 'popup-confirm-footer';
		var okBtn = document.createElement('button');
		var cancelBtn = document.createElement('button');
		okBtn.className = 'btn';
		cancelBtn.className = 'btn';
		okBtn.textContent = '확인';
		cancelBtn.textContent = '취소';

		footerDiv.appendChild(okBtn);
		footerDiv.appendChild(cancelBtn);
		popup.appendChild(footerDiv);
		window.document.body.appendChild(wrapper);

		var onClickOk = function () {
			okBtn.removeEventListener('click', onClickOk);
			cancelBtn.removeEventListener('click', onClickCancel);
			resolve(true);
			wrapper.remove();
		};
		
		var onClickCancel = function() {
			okBtn.removeEventListener('click', onClickOk);
			cancelBtn.removeEventListener('click', onClickCancel);
			resolve(false);
			wrapper.remove();
		};
		
		okBtn.addEventListener('click', onClickOk);
		cancelBtn.addEventListener('click', onClickCancel);
	});
};