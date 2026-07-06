// ajax 요청 전역 함수...기본적으로 XMLHttpRequest 를 사용하며
// IE인 경우 저버전(XMLHttpRequest 지원하지 않는 브라우저) 체크하여 XMLHTTP 로 요청하는 모듈입니다.
// jQuery와 같이 AUIGrid 를 사용한다면 굳이 이 함수 사용할 필요 없습니다. jQuery 에 ajax 가 있으니 그걸 사용하세요.
function ajax(props) {
    var target = props.target ? props.target : null;
    var currentTarget = props.currentTarget ? props.currentTarget : null;
    var isLocal =  location.href.indexOf("http") >= 0  && location.href.indexOf("http") <= 3 ? false : true;
    props = {
        type: props.type || "GET", // 요청 메소드(get or post)
	    url: props.url || "", // 요청 URL
	    timeout: props.timeout || 30000, // 응답 타임아웃
	    onError: props.onError || function() {}, // 에러 핸들러
	    onSuccess: props.onSuccess || function() {}, // 성공 핸들러
	    data: props.data || "" // 요청 시 보낼 데이터(파라메터)
    };
    var i, xhr, activeXObjects = ["MSXML2.XMLHTTP.3.0", "MSXML2.XMLHTTP", "Microsoft.XMLHTTP"];
    if ("ActiveXObject" in window) {
        if (isLocal) {
            xhr = new ActiveXObject("Microsoft.XMLHTTP");
        }
    }
    if (!xhr) {
        try {
            xhr = new XMLHttpRequest();
        } catch (e) {
            for (i = 0; i < activeXObjects.length; i++) {
                try {
                    xhr = new ActiveXObject(activeXObjects[i]);
                    break;
                } catch (e) {}
            }
        }
    }
    var timeout = props.timeout;
    var isTimeout = false;
    setTimeout(function() {
        isTimeout = true;
    }, timeout);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && !isTimeout) {
            var e = {};
            if (target) {
                e.target = target;
            }
            if (currentTarget) {
                e.currentTarget = currentTarget;
            }
            if (isSuccess(xhr)) {
                var contentType = xhr.getResponseHeader("content-type");
                var resultData = null;
                if( contentType && contentType.indexOf("xml") >= 0 ) {
                    resultData = xhr.responseXML;
                } else if(xhr.responseText){
                    resultData = parseJSON(xhr.responseText);
                }
                props.onSuccess.call(xhr, resultData, e);
            } else {
                props.onError.call(xhr, xhr.status, e);
            }
            xhr = null;
        }
    };
    try {
        xhr.open(props.type, props.url, true);
        xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        xhr.send(props.data);
    } catch (e) {
        props.onError(e.message);
    }

    function isSuccess(xhr) {
        try {
            return !xhr.status && isLocal || (xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || navigator.userAgent.indexOf("Safari") >= 0 && Cs(xhr.status);
        } catch (e) {}
        return false;
    };
    
    function parseJSON(data) {
    	var obj;
		if ( window.JSON && window.JSON.parse ) {
			try {
				obj = window.JSON.parse( data + "" );
			} catch(e) {
				obj = data;
			}
		} else {
			try {
				obj = (function() { return eval(data); })();
			} catch (e) {
				obj = data;
			}
		}
    	return obj;
	};
};

