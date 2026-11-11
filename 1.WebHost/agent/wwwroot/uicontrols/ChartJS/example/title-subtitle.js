'use strict';
let $titleSubtitle = {
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
            const sample = () => ({
                labels: months,
                datasets: [{
                    label: '매출',
                    data: $this.method.randomData(months.length, 20, 90),
                    backgroundColor: 'rgb(54, 162, 235)'
                }]
            });
            ['start',
                'center',
                'end'
            ].forEach((align) => {
                $chartjs.setConfig('chtTitle' + align.charAt(0).toUpperCase() + align.slice(1), {
                    type: 'bar',
                    data: sample(),
                    options: {
                        plugins: {
                            legend: {
                                display: false
                            },
                            title: {
                                display: true,
                                text: "align: '" + align + "'",
                                align
                            }
                        }
                    }
                });
            });
            $chartjs.setConfig('chtSubtitle', {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: '방문자수',
                        data: $this.method.randomData(months.length, 20, 90),
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgb(255, 99, 132)'
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: '월별 방문자수'
                        },
                        subtitle: {
                            display: true,
                            text: '(2026년 상반기, 자동 생성 표본 데이터)',
                            color: '#888',
                            font: {
                                size: 12,
                                style: 'italic'
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
