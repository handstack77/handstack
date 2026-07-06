'use strict';
let $browser = {
    extends: [
        'parsehtml'
    ],

    hook: {
        pageLoad() {
            syn.$l.get('txt_appName').value = syn.$b.appName;
            syn.$l.get('txt_appCodeName').value = syn.$b.appCodeName;
            syn.$l.get('txt_appVersion').value = syn.$b.appVersion;
            syn.$l.get('txt_cookieEnabled').value = syn.$b.cookieEnabled;
            syn.$l.get('txt_pdfViewerEnabled').value = syn.$b.pdfViewerEnabled;
            syn.$l.get('txt_platform').value = syn.$b.platform;
            syn.$l.get('txt_devicePlatform').value = syn.$b.devicePlatform;
            syn.$l.get('txt_userAgent').value = syn.$b.userAgent;
            syn.$l.get('txt_effectiveType').value = syn.$b.effectiveType;
            syn.$l.get('txt_devicePixelRatio').value = syn.$b.devicePixelRatio;
            syn.$l.get('txt_isExtended').value = syn.$b.isExtended;
            syn.$l.get('txt_screenWidth').value = syn.$b.screenWidth;
            syn.$l.get('txt_screenHeight').value = syn.$b.screenHeight;
            syn.$l.get('txt_language').value = syn.$b.language;
            syn.$l.get('txt_isWebkit').value = syn.$b.isWebkit;
            syn.$l.get('txt_isMac').value = syn.$b.isMac;
            syn.$l.get('txt_isLinux').value = syn.$b.isLinux;
            syn.$l.get('txt_isWindow').value = syn.$b.isWindow;
            syn.$l.get('txt_isOpera').value = syn.$b.isOpera;
            syn.$l.get('txt_isIE').value = syn.$b.isIE;
            syn.$l.get('txt_isChrome').value = syn.$b.isChrome;
            syn.$l.get('txt_isEdge').value = syn.$b.isEdge;
            syn.$l.get('txt_isFF').value = syn.$b.isFF;
            syn.$l.get('txt_isSafari').value = syn.$b.isSafari;
        }
    },

    event: {
        btn_getSystemFonts_click() {
            syn.$l.get('txt_getSystemFonts').value = syn.$b.getSystemFonts().split(',').map((item) => {
                return item.trim();
            }).join('\n');
        },

        btn_getCanvas2dRender_click() {
            syn.$l.get('img_getCanvas2dRender').src = syn.$b.getCanvas2dRender();
        },

        btn_getWebglRender_click() {
            syn.$l.get('img_getWebglRender').src = syn.$b.getWebglRender();
        },

        btn_getPlugins_click() {
            syn.$l.get('txt_getPlugins').value = syn.$b.getPlugins().split(',').map((item) => {
                return item.trim();
            }).join('\n');
        },

        async btn_fingerPrint_click() {
            syn.$l.get('txt_fingerPrint').value = await syn.$b.fingerPrint();
        },

        btn_windowWidth_click() {
            syn.$l.get('txt_windowWidth').value = syn.$b.windowWidth();
        },

        btn_windowHeight_click() {
            syn.$l.get('txt_windowHeight').value = syn.$b.windowHeight();
        },

        async btn_getIpAddress_click() {
            syn.$l.get('txt_getIpAddress').value = await syn.$b.getIpAddress();
        },

        btn_canShare_click() {
            syn.$l.get('txt_canShare').value = String(syn.$b.canShare());
        },

        async btn_share_click() {
            const shareData = {
                title: 'HandStack',
                text: 'HandStack의 목표는 개발자가 좋아하고 기업이 신뢰하는 비즈니스 앱 시스템을 제공하는 것입니다.',
                url: 'https://handstack.kr'
            };

            try {
                await syn.$b.share(shareData);
                syn.$l.get('txt_share').value = '공유 요청이 처리되었습니다';
            } catch (error) {
                syn.$l.get('txt_share').value = `공유 실패: ${error.message}`;
            }
        },

        btn_getPerformanceEntries_click() {
            syn.$l.get('txt_getPerformanceEntries').value = JSON.stringify(syn.$b.getPerformanceEntries({ type: 'navigation' }));
        },

        btn_markPerformance_click() {
            syn.$b.markPerformance('sample-mark');
            syn.$l.get('txt_markPerformance').value = JSON.stringify(syn.$b.getPerformanceEntries({ type: 'mark', name: 'sample-mark' }));
        },

        btn_measurePerformance_click() {
            syn.$b.markPerformance('sample-start');
            syn.$b.markPerformance('sample-end');
            const entry = syn.$b.measurePerformance('sample-measure', 'sample-start', 'sample-end');
            syn.$l.get('txt_measurePerformance').value = JSON.stringify(entry);
        },

        btn_isMobile_click() {
            syn.$l.get('txt_isMobile').value = String(syn.$b.isMobile());
        }
    },
};
