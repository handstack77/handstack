'use strict';
let $animations = {
    prop: {
        months: ['1월',
            '2월',
            '3월',
            '4월',
            '5월',
            '6월',
            '7월'
        ],
        loopTimer: null,
        loopRunning: false
    },
    hook: {
        pageLoad() {
            $this.method.playDelay();
            $this.method.playDrop();
            $this.method.setupLoop();
            $this.method.playProgressive();
            $this.method.playEasing();
        }
    },
    event: {
        btnReplayDelay_click() {
            $this.method.playDelay();
        },
        btnReplayDrop_click() {
            $this.method.playDrop();
        },
        btnReplayProgressive_click() {
            $this.method.playProgressive();
        },
        btnReplayEasing_click() {
            $this.method.playEasing();
        },
        btnLoopToggle_click() {
            const button = syn.$l.get('btnLoopToggle');
            if ($this.prop.loopRunning) {
                clearInterval($this.prop.loopTimer);
                $this.prop.loopRunning = false;
                button.value = '시작';
            } else {
                $this.prop.loopRunning = true;
                button.value = '정지';
                $this.prop.loopTimer = setInterval(() => {
                    $this.method.stepLoop();
                }, 900);
            }
        }
    },
    method: {
        randomData(count, min, max) {
            return Array.from({
                length: count
            }, () => Math.round(min + Math.random() * (max - min)));
        },
        playDelay() {
            const months = $this.prop.months;
            syn.uicontrols.$chartjs.setConfig('chtAnimDelay', {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [{
                        label: '방문자수',
                        data: $this.method.randomData(months.length, 20, 90),
                        backgroundColor: 'rgb(54, 162, 235)'
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Delay'
                        },
                        legend: {
                            display: false
                        }
                    },
                    animation: {
                        delay: (ctx) => (ctx.type === 'data' ? ctx.dataIndex * 150 : 0),
                        duration: 700,
                        easing: 'easeOutQuart'
                    }
                }
            });
        },
        playDrop() {
            const months = $this.prop.months;
            syn.uicontrols.$chartjs.setConfig('chtAnimDrop', {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: '판매량',
                        data: $this.method.randomData(months.length, 20, 90),
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgb(255, 99, 132)',
                        pointRadius: 6
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Drop'
                        },
                        legend: {
                            display: false
                        }
                    },
                    animation: {
                        y: {
                            duration: 1400,
                            easing: 'easeOutBounce',
                            from: (ctx) => (ctx.type === 'data' ? ctx.chart.scales.y.getPixelForValue(100) : undefined)
                        },
                        delay: (ctx) => (ctx.type === 'data' ? ctx.dataIndex * 80 : 0)
                    }
                }
            });
        },
        setupLoop() {
            const months = $this.prop.months;
            syn.uicontrols.$chartjs.setConfig('chtAnimLoop', {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: '실시간 값',
                        data: $this.method.randomData(months.length, 20, 90),
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgb(75, 192, 192)',
                        tension: 0.35
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Loop (시작 버튼을 눌러보세요)'
                        },
                        legend: {
                            display: false
                        }
                    },
                    animation: {
                        duration: 750,
                        easing: 'linear'
                    }
                }
            });
        },
        stepLoop() {
            const chart = syn.uicontrols.$chartjs.getChartInstance('chtAnimLoop');
            if (!chart) {
                return;
            }
            const dataset = chart.data.datasets[0];
            dataset.data = dataset.data.slice(1).concat(Math.round(20 + Math.random() * 70));
            chart.update();
        },
        playProgressive() {
            const months = $this.prop.months;
            syn.uicontrols.$chartjs.setConfig('chtAnimProgressive', {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: '누적 매출',
                        data: $this.method.randomData(months.length, 20, 90),
                        borderColor: 'rgb(153, 102, 255)',
                        backgroundColor: 'rgb(153, 102, 255)'
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Progressive Line'
                        },
                        legend: {
                            display: false
                        }
                    },
                    animation: {
                        x: {
                            type: 'number',
                            easing: 'linear',
                            from: NaN,
                            delay(ctx) {
                                return ctx.type === 'data' && ctx.mode === 'default' && !ctx.dropped ? ctx.dataIndex * 200 : 0;
                            },
                            duration(ctx) {
                                return ctx.type === 'data' && ctx.mode === 'default' && !ctx.dropped ? 200 : 0;
                            }
                        }
                    }
                }
            });
        },
        playEasing() {
            const months = $this.prop.months;
            const data = $this.method.randomData(months.length, 20, 90);
            ['Linear',
                'Quart'
            ].forEach((label) => {
                const easing = label === 'Linear' ? 'linear' : 'easeInOutQuart';
                syn.uicontrols.$chartjs.setConfig('chtEasing' + label, {
                    type: 'line',
                    data: {
                        labels: months,
                        datasets: [{
                            label: easing,
                            data,
                            borderColor: 'rgb(255, 159, 64)',
                            backgroundColor: 'rgb(255, 159, 64)'
                        }]
                    },
                    options: {
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        animation: {
                            x: {
                                type: 'number',
                                easing,
                                from: NaN,
                                delay(ctx) {
                                    return ctx.type === 'data' && ctx.mode === 'default' && !ctx.dropped ? ctx.dataIndex * 250 : 0;
                                },
                                duration(ctx) {
                                    return ctx.type === 'data' && ctx.mode === 'default' && !ctx.dropped ? 250 : 0;
                                }
                            }
                        }
                    }
                });
            });
        }
    }
}
