'use strict';
let $scaleOptions = {
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
            $chartjs.setConfig('chtCenter', {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: '전월 대비 증감(%)',
                        data: $this.method.randomData(months.length, -40, 40),
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgb(255, 99, 132)'
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Center'
                        }
                    },
                    scales: {
                        x: {
                            position: 'center'
                        },
                        y: {
                            position: 'center'
                        }
                    }
                }
            });
            $chartjs.setConfig('chtGrid', {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [{
                        label: '매출',
                        data: $this.method.randomData(months.length, 20, 90),
                        backgroundColor: 'rgb(54, 162, 235)'
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Grid'
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 99, 132, 0.35)',
                                tickColor: 'rgb(255, 99, 132)'
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(54, 162, 235, 0.35)',
                                lineWidth: 2,
                                drawTicks: false
                            },
                            border: {
                                dash: [4,
                                    4
                                ]
                            }
                        }
                    }
                }
            });
            $chartjs.setConfig('chtTicks', {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: '누적 매출(원)',
                        data: $this.method.randomData(months.length, 500, 9000).map((value) => value * 1000),
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgb(75, 192, 192)'
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Ticks (콜백으로 천단위 콤마 + 원 표시)'
                        }
                    },
                    scales: {
                        y: {
                            ticks: {
                                color: '#334155',
                                padding: 8,
                                callback: (value) => Number(value).toLocaleString('ko-KR') + '원'
                            }
                        }
                    }
                }
            });
            $chartjs.setConfig('chtTitles', {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [{
                        label: '방문자수',
                        data: $this.method.randomData(months.length, 20, 90),
                        backgroundColor: 'rgb(153, 102, 255)'
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Titles'
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: '월',
                                color: '#334155',
                                font: {
                                    weight: 'bold'
                                }
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: '방문자수(명)',
                                color: '#334155',
                                font: {
                                    weight: 'bold'
                                }
                            }
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
