'use strict';
let $scales = {
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
            $chartjs.setConfig('chtLinearMinMax', {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: '점유율(%)',
                        data: $this.method.randomData(months.length, 30, 70),
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgb(255, 99, 132)'
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Linear Min/Max (0~100 고정)'
                        }
                    },
                    scales: {
                        y: {
                            min: 0,
                            max: 100
                        }
                    }
                }
            });
            $chartjs.setConfig('chtLinearSuggested', {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: '점유율(%)',
                        data: $this.method.randomData(months.length, 30, 70),
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgb(54, 162, 235)'
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Linear Min/Max Suggested (0~100 권장, 데이터가 넘으면 확장)'
                        }
                    },
                    scales: {
                        y: {
                            suggestedMin: 0,
                            suggestedMax: 100
                        }
                    }
                }
            });
            $chartjs.setConfig('chtStepSize', {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: '점수',
                        data: $this.method.randomData(months.length, 10, 90),
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgb(75, 192, 192)'
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Linear Step Size (20 간격)'
                        }
                    },
                    scales: {
                        y: {
                            min: 0,
                            max: 100,
                            ticks: {
                                stepSize: 20
                            }
                        }
                    }
                }
            });
            $chartjs.setConfig('chtLogarithmic', {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: '누적 사용자수',
                        data: [10,
                            45,
                            220,
                            1500,
                            8600,
                            42000,
                            190000
                        ],
                        borderColor: 'rgb(153, 102, 255)',
                        backgroundColor: 'rgb(153, 102, 255)'
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Logarithmic Scale'
                        }
                    },
                    scales: {
                        y: {
                            type: 'logarithmic'
                        }
                    }
                }
            });
            $chartjs.setConfig('chtScaleStacked', {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [{
                        label: '온라인',
                        data: $this.method.randomData(months.length, 20, 60),
                        backgroundColor: 'rgb(255, 159, 64)'
                    },
                    {
                        label: '오프라인',
                        data: $this.method.randomData(months.length, 20, 60),
                        backgroundColor: 'rgb(75, 192, 192)'
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Stacked Scale'
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
            const dailyPoints = $this.method.dailySeries(30, 100, 400);
            $chartjs.setConfig('chtTimeLine', {
                type: 'line',
                data: {
                    datasets: [{
                        label: '일별 방문자수',
                        data: dailyPoints,
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgb(54, 162, 235)',
                        tension: 0.25
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Time Line (실제 날짜 간격 X축)'
                        }
                    },
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'day'
                            },
                            title: {
                                display: true,
                                text: '날짜'
                            }
                        }
                    }
                }
            });
            $chartjs.setConfig('chtTimeCombo', {
                type: 'line',
                data: {
                    datasets: [{
                        label: '일별 표본',
                        data: $this.method.dailySeries(14, 50, 150),
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgb(255, 99, 132)'
                    },
                    {
                        label: '3일 간격 표본',
                        data: $this.method.everyNDaysSeries(14, 3, 50, 150),
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgb(75, 192, 192)',
                        stepped: true
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Time Combo (표본 간격이 다른 두 시계열)'
                        }
                    },
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'day'
                            }
                        }
                    }
                }
            });
            const wideRange = $this.method.dailySeries(90, 100, 400);
            const spanStart = wideRange[30].x;
            const spanEnd = wideRange[60].x;
            $chartjs.setConfig('chtTimeMaxSpan', {
                type: 'line',
                data: {
                    datasets: [{
                        label: '일별 방문자수(90일 데이터)',
                        data: wideRange,
                        borderColor: 'rgb(153, 102, 255)',
                        backgroundColor: 'rgb(153, 102, 255)'
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Time Max Span (표시 구간만 30일로 제한)'
                        }
                    },
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'day'
                            },
                            min: spanStart,
                            max: spanEnd
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
        dailySeries(days, min, max) {
            const today = new Date();
            return Array.from({
                length: days
            }, (_, index) => {
                const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - index));
                return {
                    x: date,
                    y: Math.round(min + Math.random() * (max - min))
                };
            });
        },
        everyNDaysSeries(days, step, min, max) {
            const today = new Date();
            const points = [];
            for (let index = 0; index < days; index += step) {
                const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - index));
                points.push({
                    x: date,
                    y: Math.round(min + Math.random() * (max - min))
                });
            }
            return points;
        }
    }
}
