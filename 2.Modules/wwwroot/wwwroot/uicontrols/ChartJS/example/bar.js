'use strict';
let $bar = {
    prop: {
        months: ['1월',
            '2월',
            '3월',
            '4월',
            '5월',
            '6월',
            '7월'
        ],
        colors: {
            red: 'rgb(255, 99, 132)',
            orange: 'rgb(255, 159, 64)',
            yellow: 'rgb(255, 205, 86)',
            green: 'rgb(75, 192, 192)',
            blue: 'rgb(54, 162, 235)',
            purple: 'rgb(153, 102, 255)',
            grey: 'rgb(201, 203, 207)'
        }
    },
    hook: {
        pageLoad() {
            const $chartjs = syn.uicontrols.$chartjs;
            $chartjs.setConfig('chtVertical', {
                type: 'bar',
                data: {
                    labels: $this.prop.months,
                    datasets: [{
                        label: '방문자수',
                        data: $this.method.randomData($this.prop.months.length, 20, 90),
                        backgroundColor: $this.prop.colors.blue
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Vertical Bar Chart'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
            $chartjs.setConfig('chtHorizontal', {
                type: 'bar',
                data: {
                    labels: $this.prop.months,
                    datasets: [{
                        label: '판매수량',
                        data: $this.method.randomData($this.prop.months.length, 10, 60),
                        backgroundColor: $this.prop.colors.green
                    }]
                },
                options: {
                    indexAxis: 'y',
                    plugins: {
                        title: {
                            display: true,
                            text: 'Horizontal Bar Chart'
                        }
                    }
                }
            });
            $chartjs.setConfig('chtFloating', {
                type: 'bar',
                data: {
                    labels: $this.prop.months,
                    datasets: [{
                        label: '일교차 범위(℃)',
                        data: $this.prop.months.map(() => {
                            const low = Math.round(Math.random() * 10);
                            return [low,
                                low + Math.round(Math.random() * 15) + 5
                            ];
                        }),
                        backgroundColor: $this.prop.colors.orange
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Floating Bar Chart (min~max 범위)'
                        }
                    }
                }
            });
            $chartjs.setConfig('chtStacked', {
                type: 'bar',
                data: {
                    labels: $this.prop.months,
                    datasets: [{
                        label: '소정근무',
                        data: $this.method.randomData($this.prop.months.length, 120, 160),
                        backgroundColor: $this.prop.colors.blue
                    },
                    {
                        label: '연장근무',
                        data: $this.method.randomData($this.prop.months.length, 0, 30),
                        backgroundColor: $this.prop.colors.red
                    },
                    {
                        label: '휴일근무',
                        data: $this.method.randomData($this.prop.months.length, 0, 10),
                        backgroundColor: $this.prop.colors.grey
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Stacked Bar Chart'
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
            $chartjs.setConfig('chtStackedGroups', {
                type: 'bar',
                data: {
                    labels: $this.prop.months,
                    datasets: [{
                        label: 'A팀 오전',
                        data: $this.method.randomData($this.prop.months.length, 5, 20),
                        backgroundColor: $this.prop.colors.blue,
                        stack: 'A팀'
                    },
                    {
                        label: 'A팀 오후',
                        data: $this.method.randomData($this.prop.months.length, 5, 20),
                        backgroundColor: $this.prop.colors.purple,
                        stack: 'A팀'
                    },
                    {
                        label: 'B팀 오전',
                        data: $this.method.randomData($this.prop.months.length, 5, 20),
                        backgroundColor: $this.prop.colors.green,
                        stack: 'B팀'
                    },
                    {
                        label: 'B팀 오후',
                        data: $this.method.randomData($this.prop.months.length, 5, 20),
                        backgroundColor: $this.prop.colors.yellow,
                        stack: 'B팀'
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Stacked Groups (stack 키로 그룹핑)'
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
            $chartjs.setConfig('chtBorderRadius', {
                type: 'bar',
                data: {
                    labels: $this.prop.months,
                    datasets: [{
                        label: '진행률(%)',
                        data: $this.method.randomData($this.prop.months.length, 30, 100),
                        backgroundColor: $this.prop.colors.purple,
                        borderRadius: 8,
                        borderSkipped: false
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Border Radius Bar Chart'
                        },
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
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
