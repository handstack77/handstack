/// <summary>
/// (개발용) 신규 모듈 개발 템플릿입니다.
/// </summary>
(function (context) {
    'use strict';
    const $templete = context.$templete || new syn.module();
    let doc = context.document;

    $templete.extend({
        method() {
            return $templete;
        }
    });
    context.$templete = syn.$t = context.$templete || $templete;
})(globalRoot);

if (typeof module === 'object' && module.exports) {
    module.exports = global.$templete;
}

/// <summary>
/// (개발용) 기존 모듈 확장 개발 템플릿입니다.
/// </summary>
(function ($templete) {
    if (!$templete) {
        $templete = new syn.module();
    }

    let doc = null;
    if (typeof module === 'object' && module.exports) {
    }
    else {
        doc = window.document;
    }

    $templete.extend({
        extendVersion: "v년.월.일",

        method() {
            return $templete;
        }
    });
})($templete || globalRoot.$templete);
