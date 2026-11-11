'use strict';
let $otherCharts = {
    prop: {
        months: ['1월',
            '2월',
            '3월',
            '4월',
            '5월',
            '6월',
            '7월'
        ],
        colors: ['rgb(255, 99, 132)',
            'rgb(255, 159, 64)',
            'rgb(255, 205, 86)',
            'rgb(75, 192, 192)',
            'rgb(54, 162, 235)',
            'rgb(153, 102, 255)',
            'rgb(201, 203, 207)'
        ]
    },
    hook: {
        pageLoad() {
            const $chartjs = syn.uicontrols.$chartjs;
            const months = $this.prop.months;
            const colors = $this.prop.colors;
            $chartjs.setConfig('chtBubble', {
                type: 'bubble',
                data: {
                    datasets: [{
                        label: '팀 A',
                        data: $this.method.randomBubble(8),
                        backgroundColor: 'rgba(255, 99, 132, 0.6)'
                    },
                    {
                        label: '팀 B',
                        data: $this.method.randomBubble(8),
                        backgroundColor: 'rgba(54, 162, 235, 0.6)'
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Bubble'
                        }
                    }
                }
            });
            $chartjs.setConfig('chtDoughnut', {
                type: 'doughnut',
                data: {
                    labels: ['빨강',
                        '주황',
                        '노랑',
                        '초록',
                        '파랑'
                    ],
                    datasets: [{
                        data: $this.method.randomData(5, 10, 60),
                        backgroundColor: colors
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Doughnut'
                        }
                    }
                }
            });
            $chartjs.setConfig('chtPie', {
                type: 'pie',
                data: {
                    labels: ['빨강',
                        '주황',
                        '노랑',
                        '초록',
                        '파랑'
                    ],
                    datasets: [{
                        data: $this.method.randomData(5, 10, 60),
                        backgroundColor: colors
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Pie'
                        }
                    }
                }
            });
            $chartjs.setConfig('chtMultiSeriesPie', {
                type: 'pie',
                data: {
                    labels: ['빨강',
                        '주황',
                        '노랑',
                        '초록',
                        '파랑'
                    ],
                    datasets: [{
                        data: $this.method.randomData(5, 10, 30),
                        backgroundColor: colors,
                        label: '2025'
                    },
                    {
                        data: $this.method.randomData(5, 10, 30),
                        backgroundColor: colors,
                        label: '2026'
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Multi Series Pie (동심원)'
                        }
                    }
                }
            });
            $chartjs.setConfig('chtPolarArea', {
                type: 'polarArea',
                data: {
                    labels: ['빨강',
                        '주황',
                        '노랑',
                        '초록',
                        '파랑'
                    ],
                    datasets: [{
                        data: $this.method.randomData(5, 10, 60),
                        backgroundColor: colors
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Polar Area'
                        }
                    }
                }
            });
            const polarCenterData = $this.method.randomData(4, 10, 40);
            $chartjs.setConfig('chtPolarCenter', {
                type: 'polarArea',
                data: {
                    labels: ['1분기',
                        '2분기',
                        '3분기',
                        '4분기'
                    ],
                    datasets: [{
                        data: polarCenterData,
                        backgroundColor: colors
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Polar Area Center Labels'
                        }
                    }
                },
                plugins: [{
                    id: 'centerLabel',
                    afterDraw(chart) {
                        const total = chart.data.datasets[0].data.reduce((sum, value) => sum + value, 0);
                        const ctx = chart.ctx;
                        const area = chart.chartArea;
                        const centerX = (area.left + area.right) / 2;
                        const centerY = (area.top + area.bottom) / 2;
                        ctx.save();
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.font = 'bold 16px sans-serif';
                        ctx.fillStyle = '#334155';
                        ctx.fillText('합계 ' + total, centerX, centerY);
                        ctx.restore();
                    }
                }]
            });
            $chartjs.setConfig('chtRadar', {
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
                        data: $this.method.randomData(6, 40, 100),
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.25)'
                    },
                    {
                        label: '모델 B',
                        data: $this.method.randomData(6, 40, 100),
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgba(54, 162, 235, 0.25)'
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Radar'
                        }
                    }
                }
            });
            const radarSkipData = $this.method.randomData(6, 40, 100);
            radarSkipData[2] = null;
            $chartjs.setConfig('chtRadarSkip', {
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
                        label: '모델 A (값 없음 포함)',
                        data: radarSkipData,
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.25)',
                        spanGaps: true
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Radar Skip Points'
                        }
                    }
                }
            });
            $chartjs.setConfig('chtScatter', {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: '측정값',
                        data: $this.method.randomScatter(24),
                        backgroundColor: 'rgb(54, 162, 235)'
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Scatter'
                        }
                    }
                }
            });
            $chartjs.setConfig('chtScatterMultiAxis', {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: '온도(℃)',
                        data: $this.method.randomScatter(16),
                        backgroundColor: 'rgb(255, 99, 132)',
                        yAxisID: 'y'
                    },
                    {
                        label: '습도(%)',
                        data: $this.method.randomScatter(16).map((point) => ({
                            x: point.x,
                            y: point.y * 5
                        })),
                        backgroundColor: 'rgb(54, 162, 235)',
                        yAxisID: 'y1'
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Scatter Multi Axis'
                        }
                    },
                    scales: {
                        y: {
                            type: 'linear',
                            position: 'left'
                        },
                        y1: {
                            type: 'linear',
                            position: 'right',
                            grid: {
                                drawOnChartArea: false
                            }
                        }
                    }
                }
            });
            $chartjs.setConfig('chtComboBarLine', {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [{
                        type: 'bar',
                        label: '매출',
                        data: $this.method.randomData(months.length, 40, 100),
                        backgroundColor: 'rgb(54, 162, 235)'
                    },
                    {
                        type: 'line',
                        label: '목표',
                        data: $this.method.randomData(months.length, 60, 90),
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgb(255, 99, 132)',
                        tension: 0.3
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Combo Bar/Line'
                        }
                    }
                }
            });
            $chartjs.setConfig('chtStackedBarLine', {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [{
                        type: 'bar',
                        label: '소정근무',
                        data: $this.method.randomData(months.length, 120, 160),
                        backgroundColor: 'rgb(54, 162, 235)',
                        stack: 'stack1'
                    },
                    {
                        type: 'bar',
                        label: '연장근무',
                        data: $this.method.randomData(months.length, 0, 30),
                        backgroundColor: 'rgb(255, 159, 64)',
                        stack: 'stack1'
                    },
                    {
                        type: 'line',
                        label: '목표시간',
                        data: $this.method.randomData(months.length, 140, 170),
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgb(255, 99, 132)',
                        tension: 0.3
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Stacked Bar + Line'
                        }
                    },
                    scales: {
                        x: {
                            stacked: true
                        },
                        y: {
                            stacked: true
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
        },
        randomBubble(count) {
            return Array.from({
                length: count
            }, () => ({
                x: Math.round(Math.random() * 100),
                y: Math.round(Math.random() * 100),
                r: Math.round(4 + Math.random() * 16)
            }));
        },
        randomScatter(count) {
            return Array.from({
                length: count
            }, () => ({
                x: Math.round(Math.random() * 100),
                y: Math.round(Math.random() * 100)
            }));
        }
    }
}
