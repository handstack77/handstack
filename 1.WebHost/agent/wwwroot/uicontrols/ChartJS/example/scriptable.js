'use strict';
let $scriptable = {
    prop: {
        months: ['1월',
            '2월',
            '3월',
            '4월',
            '5월',
            '6월',
            '7월'
        ]
    },
    hook: {
        pageLoad() {
            const $chartjs = syn.uicontrols.$chartjs;
            const months = $this.prop.months;
            $chartjs.setConfig('chtScriptBar', {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [{
                        label: '전월 대비 증감',
                        data: $this.method.randomData(months.length, -30, 30),
                        backgroundColor: (ctx) => (ctx.raw < 0 ? 'rgb(255, 99, 132)' : 'rgb(75, 192, 192)')
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Bar (값 부호로 색 계산)'
                        },
                        legend: {
                            display: false
                        }
                    }
                }
            });
            const bubbleData = Array.from({
                length: 10
            }, () => ({
                x: Math.round(Math.random() * 100),
                y: Math.round(Math.random() * 100),
                r: Math.round(4 + Math.random() * 20)
            }));
            $chartjs.setConfig('chtScriptBubble', {
                type: 'bubble',
                data: {
                    datasets: [{
                        label: '측정값',
                        data: bubbleData,
                        backgroundColor: (ctx) => {
                            const value = ctx.raw ? ctx.raw.r : 0;
                            const alpha = Math.min(1, 0.2 + value / 30);
                            return 'rgba(54, 162, 235, ' + alpha.toFixed(2) + ')';
                        }
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Bubble (반지름 비례 투명도)'
                        },
                        legend: {
                            display: false
                        }
                    }
                }
            });
            const lineData = $this.method.randomData(months.length, 20, 90);
            const maxValue = Math.max(...lineData);
            $chartjs.setConfig('chtScriptLine', {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: '방문자수',
                        data: lineData,
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgb(54, 162, 235)',
                        pointRadius: (ctx) => (ctx.raw === maxValue ? 9 : 3),
                        pointBackgroundColor: (ctx) => (ctx.raw === maxValue ? 'rgb(255, 99, 132)' : 'rgb(54, 162, 235)')
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Line (최댓값 강조)'
                        }
                    }
                }
            });
            const pieData = [12,
                19,
                30,
                8,
                22
            ];
            const maxPie = Math.max(...pieData);
            $chartjs.setConfig('chtScriptPie', {
                type: 'pie',
                data: {
                    labels: ['빨강',
                        '주황',
                        '노랑',
                        '초록',
                        '파랑'
                    ],
                    datasets: [{
                        data: pieData,
                        backgroundColor: ['rgb(255, 99, 132)',
                            'rgb(255, 159, 64)',
                            'rgb(255, 205, 86)',
                            'rgb(75, 192, 192)',
                            'rgb(54, 162, 235)'
                        ],
                        offset: (ctx) => (ctx.raw === maxPie ? 24 : 0)
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Pie (최댓값 조각 offset)'
                        }
                    }
                }
            });
            const polarData = $this.method.randomData(5, 10, 60);
            const polarAvg = polarData.reduce((sum, value) => sum + value, 0) / polarData.length;
            $chartjs.setConfig('chtScriptPolar', {
                type: 'polarArea',
                data: {
                    labels: ['1분기',
                        '2분기',
                        '3분기',
                        '4분기',
                        '5분기'
                    ],
                    datasets: [{
                        data: polarData,
                        backgroundColor: (ctx) => (ctx.raw > polarAvg ? 'rgba(255, 99, 132, 0.7)' : 'rgba(201, 203, 207, 0.5)')
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Polar Area (평균 초과 강조)'
                        }
                    }
                }
            });
            const radarData = $this.method.randomData(6, 40, 100);
            $chartjs.setConfig('chtScriptRadar', {
                type: 'radar',
                data: {
                    labels: ['속도',
                        '내구성',
                        '편의성',
                        '가격',
                        '디자인',
                        '안전성'
                    ],
                    datasets: [{
                        label: '모델 A',
                        data: radarData,
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        pointBackgroundColor: (ctx) => (ctx.raw < 70 ? 'rgb(255, 99, 132)' : 'rgb(54, 162, 235)'),
                        pointRadius: (ctx) => (ctx.raw < 70 ? 7 : 4)
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Radar (기준치 미달 강조)'
                        }
                    }
                }
            });
        }
    },
    method: {
        randomData(count, min, max) {
            return Array.from({
                length: count
            }, () => Math.round(min + Math.random() * (max - min)));
        }
    }
}
