'use strict';
let $echartsrenderer = {
    prop: {
        rows: [{
            NAME: 'A',
            VALUE: 31
        },
        {
            NAME: 'B',
            VALUE: 52
        },
        {
            NAME: 'C',
            VALUE: 44
        }],
        option: {
            title: {
                text: 'Renderer API'
            },
            tooltip: {
            },
            xAxis: {
                type: 'category',
                data: ['A',
                    'B',
                    'C'
                ]
            },
            yAxis: {
            },
            series: [{
                type: 'bar',
                data: [31,
                    52,
                    44
                ]
            }]
        },
        loading: false
    },
    hook: {
        pageLoad() {
            syn.uicontrols.$echarts.registerTheme('handstack-dark', {
                backgroundColor: '#202636',
                textStyle: {
                    color: '#e9efff'
                },
                title: {
                    textStyle: {
                        color: '#fff'
                    }
                },
                categoryAxis: {
                    axisLine: {
                        lineStyle: {
                            color: '#aebce0'
                        }
                    }
                },
                valueAxis: {
                    axisLine: {
                        lineStyle: {
                            color: '#aebce0'
                        }
                    }
                },
                color: ['#7ea4ff',
                    '#67d5b5'
                ]
            });
            return $this.method.render('canvas', null);
        }
    },
    event: {
        btnCanvas_click() {
            return $this.method.render('canvas', null);
        },
        btnSVG_click() {
            return $this.method.render('svg', null);
        },
        btnTheme_click() {
            return $this.method.render('canvas', 'handstack-dark');
        },
        btnResize_click() {
            syn.uicontrols.$echarts.setControlSize('chtRenderer', '100%', 430);
            $this.method.print({
                width: syn.uicontrols.$echarts.getWidth('chtRenderer'),
                height: syn.uicontrols.$echarts.getHeight('chtRenderer')
            });
        },
        btnLoading_click() {
            $this.prop.loading = !$this.prop.loading;
            if ($this.prop.loading) {
                syn.uicontrols.$echarts.showLoading('chtRenderer', 'default', {
                    text: '데이터 준비 중'
                });
            } else {
                syn.uicontrols.$echarts.hideLoading('chtRenderer');
            }
        },
        btnImage_click() {
            const url = syn.uicontrols.$echarts.getDataURL('chtRenderer', {
                type: 'png',
                pixelRatio: 1
            });
            $this.method.print({
                prefix: url ? url.slice(0, 40) : null,
                length: url ? url.length : 0
            });
        },
        chtRenderer_reinitialized(elID, params) {
            $this.method.print({
                event: 'reinitialized',
                renderer: params.initOptions.renderer,
                theme: params.theme
            });
        },
        chtRenderer_resized(elID, params) {
            $this.method.print({
                event: 'resized',
                width: syn.uicontrols.$echarts.getWidth(elID),
                height: syn.uicontrols.$echarts.getHeight(elID)
            });
        }
    },
    method: {
        render(renderer, theme) {
            return syn.uicontrols.$echarts.renderChart('chtRenderer', {
                rows: $this.prop.rows,
                option: $this.prop.option,
                theme: theme,
                locale: 'KO',
                initOptions: {
                    renderer: renderer,
                    useDirtyRect: renderer === 'canvas'
                }
            });
        },
        print(value) {
            syn.$l.get('preResult').textContent = JSON.stringify(value, null, 2);
        }
    }
};
