'use strict';
let $tooltip = {
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
            if (window.Chart && Chart.Tooltip && Chart.Tooltip.positioners && !Chart.Tooltip.positioners.topLeft) {
                Chart.Tooltip.positioners.topLeft = function () {
                    return {
                        x: this.chart.chartArea.left + 12,
                        y: this.chart.chartArea.top + 12
                    };
                };
            }
            $chartjs.setConfig('chtTooltipContent', {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [{
                        label: '접수',
                        data: $this.method.randomData(months.length, 20, 60),
                        backgroundColor: 'rgb(54, 162, 235)'
                    },
                    {
                        label: '처리완료',
                        data: $this.method.randomData(months.length, 10, 50),
                        backgroundColor: 'rgb(75, 192, 192)'
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Content'
                        },
                        tooltip: {
                            callbacks: {
                                title: (items) => '📅 ' + items[0].label,
                                label: (item) => item.dataset.label + ': ' + item.formattedValue + '건',
                                footer: (items) => '합계: ' + items.reduce((sum, item) => sum + item.parsed.y, 0) + '건'
                            }
                        }
                    }
                }
            });
            $chartjs.setConfig('chtTooltipHtml', {
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
                            text: 'HTML Tooltip'
                        },
                        tooltip: {
                            enabled: false,
                            external: $this.method.externalTooltip
                        }
                    }
                }
            });
            const interactionDatasets = () => ([{
                label: 'A',
                data: $this.method.randomData(months.length, 20, 60),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgb(255, 99, 132)'
            },
            {
                label: 'B',
                data: $this.method.randomData(months.length, 20, 60),
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgb(54, 162, 235)'
            }]);
            const interactionModes = [{
                id: 'chtInteractIndex',
                mode: 'index',
                intersect: false
            },
            {
                id: 'chtInteractNearest',
                mode: 'nearest',
                intersect: true
            },
            {
                id: 'chtInteractPoint',
                mode: 'point',
                intersect: true
            },
            {
                id: 'chtInteractDataset',
                mode: 'dataset',
                intersect: true
            }];
            interactionModes.forEach((item) => {
                $chartjs.setConfig(item.id, {
                    type: 'line',
                    data: {
                        labels: months,
                        datasets: interactionDatasets()
                    },
                    options: {
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        interaction: {
                            mode: item.mode,
                            intersect: item.intersect
                        }
                    }
                });
            });
            $chartjs.setConfig('chtTooltipPointStyle', {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: '동그라미',
                        data: $this.method.randomData(months.length, 10, 40),
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgb(255, 99, 132)',
                        pointStyle: 'circle',
                        pointRadius: 6
                    },
                    {
                        label: '세모',
                        data: $this.method.randomData(months.length, 10, 40),
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgb(54, 162, 235)',
                        pointStyle: 'triangle',
                        pointRadius: 6
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Point Style'
                        },
                        tooltip: {
                            usePointStyle: true,
                            boxPadding: 4
                        }
                    }
                }
            });
            const positionData = () => ({
                labels: months,
                datasets: [{
                    label: '매출',
                    data: $this.method.randomData(months.length, 20, 90),
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgb(75, 192, 192)'
                }]
            });
            $chartjs.setConfig('chtTooltipPosAverage', {
                type: 'line',
                data: positionData(),
                options: {
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            position: 'average'
                        }
                    }
                }
            });
            $chartjs.setConfig('chtTooltipPosCustom', {
                type: 'line',
                data: positionData(),
                options: {
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            position: 'topLeft'
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
        externalTooltip(context) {
            const tooltipEl = syn.$l.get('htmlTooltip');
            const tooltip = context.tooltip;
            if (!tooltipEl) {
                return;
            }
            if (tooltip.opacity === 0) {
                tooltipEl.style.opacity = 0;
                return;
            }
            if (tooltip.body) {
                let html = '<table>';
                (tooltip.title || []).forEach((title) => {
                    html += '<thead><tr><th>' + title + '</th></tr></thead>';
                });
                html += '<tbody>';
                tooltip.body.forEach((bodyItem, index) => {
                    const color = tooltip.labelColors[index];
                    html += '<tr><td><span style="display:inline-block;width:8px;height:8px;background:' + color.backgroundColor + ';margin-right:4px;"></span>' + bodyItem.lines.join(' ') + '</td></tr>';
                });
                html += '</tbody></table>';
                tooltipEl.innerHTML = html;
            }
            const canvasRect = context.chart.canvas.getBoundingClientRect();
            const parentRect = tooltipEl.offsetParent.getBoundingClientRect();
            tooltipEl.style.opacity = 1;
            tooltipEl.style.left = (canvasRect.left - parentRect.left + tooltip.caretX) + 'px';
            tooltipEl.style.top = (canvasRect.top - parentRect.top + tooltip.caretY) + 'px';
        }
    }
}
