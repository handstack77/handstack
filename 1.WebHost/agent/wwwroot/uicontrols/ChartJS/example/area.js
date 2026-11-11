'use strict';
let $area = {
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
            $chartjs.setConfig('chtLineBoundaries', {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: "fill: 'origin'",
                        data: $this.method.randomData(months.length, -20, 60),
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.25)',
                        fill: 'origin'
                    },
                    {
                        label: "fill: 'start'",
                        data: $this.method.randomData(months.length, -20, 60),
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgba(54, 162, 235, 0.25)',
                        fill: 'start'
                    },
                    {
                        label: "fill: {value:20}",
                        data: $this.method.randomData(months.length, -20, 60),
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.25)',
                        fill: {
                            value: 20
                        }
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Line Boundaries'
                        }
                    }
                }
            });
            $chartjs.setConfig('chtLineDatasets', {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: '최저 기준선',
                        data: $this.method.randomData(months.length, 10, 30),
                        borderColor: 'rgb(153, 102, 255)',
                        backgroundColor: 'rgba(153, 102, 255, 0.15)',
                        fill: false
                    },
                    {
                        label: "최고값 (fill: '-1' 로 앞 데이터셋과 사이 채움)",
                        data: $this.method.randomData(months.length, 40, 80),
                        borderColor: 'rgb(255, 159, 64)',
                        backgroundColor: 'rgba(255, 159, 64, 0.35)',
                        fill: '-1'
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Line Datasets'
                        }
                    }
                }
            });
            const drawTimeData = $this.method.randomData(months.length, 10, 60);
            const drawTimeDataset = () => ([{
                label: '값',
                data: drawTimeData,
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.45)',
                fill: 'origin'
            }]);
            $chartjs.setConfig('chtDrawTimeBefore', {
                type: 'line',
                data: {
                    labels: months,
                    datasets: drawTimeDataset()
                },
                options: {
                    plugins: {
                        legend: {
                            display: false
                        },
                        filler: {
                            drawTime: 'beforeDatasetsDraw'
                        }
                    }
                }
            });
            $chartjs.setConfig('chtDrawTimeEarly', {
                type: 'line',
                data: {
                    labels: months,
                    datasets: drawTimeDataset()
                },
                options: {
                    plugins: {
                        legend: {
                            display: false
                        },
                        filler: {
                            drawTime: 'beforeDraw'
                        }
                    }
                }
            });
            $chartjs.setConfig('chtLineStacked', {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: '검색 유입',
                        data: $this.method.randomData(months.length, 20, 60),
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: '직접 유입',
                        data: $this.method.randomData(months.length, 20, 60),
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'SNS 유입',
                        data: $this.method.randomData(months.length, 20, 60),
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.5)',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Line Stacked (Area)'
                        }
                    },
                    scales: {
                        y: {
                            stacked: true
                        }
                    }
                }
            });
            $chartjs.setConfig('chtRadarArea', {
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
                        backgroundColor: 'rgba(255, 99, 132, 0.4)',
                        fill: true
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Radar (채움)'
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
