'use strict';
let $HAC000 = {
    config: {
        actionButtons: [{
            icon: 'refresh',
            action(evt) {
            }
        }]
    },

    prop: {
        chartUtils: null,
        aggregateChart: null,
    },

    transaction: {
        AF01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [
                { type: 'Form', dataFieldID: 'Exception' },
                { type: 'Grid', dataFieldID: 'Aggregate' },
                { type: 'Grid', dataFieldID: 'LineChart', clear: true }
            ],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($string.toBoolean($this.store.Exception.Error) == false) {
                    syn.$l.get('lblResponseDateTime').innerText = $date.toString(new Date(), 'n') + ' ' + $date.toString(new Date(), 't');

                    var today = $this.store.Aggregate[0];
                    syn.$l.get('lblTransactionTodayCount').textContent = `${$string.toCurrency(today.RequestCount)} / ${$string.toCurrency(today.ResponseCount)} / ${$string.toCurrency(today.ErrorCount)}`;

                    var week = $this.store.Aggregate[1];
                    syn.$l.get('lblTransactionWeekCount').textContent = `${$string.toCurrency(week.RequestCount)} / ${$string.toCurrency(week.ResponseCount)} / ${$string.toCurrency(week.ErrorCount)}`;

                    var chart = $this.prop.aggregateChart;
                    chart.data.labels.length = 0;
                    chart.data.labels = $this.store.LineChart.map((item) => { return item.DateHour.substring(8) });

                    chart.data.datasets[0].data.length = 0;
                    chart.data.datasets[1].data.length = 0;

                    var requestItems = $this.store.LineChart.map((item) => { return item.RequestCount });
                    for (var i in requestItems) {
                        chart.data.datasets[0].data.push(requestItems[i]);
                    }

                    var errorItems = $this.store.LineChart.map((item) => { return item.ErrorCount });
                    for (var i in errorItems) {
                        chart.data.datasets[1].data.push(errorItems[i]);
                    }

                    chart.update();
                }
            }
        },

        LF01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [
                { type: 'Form', dataFieldID: 'Exception' },
                { type: 'Grid', dataFieldID: 'ValidTransaction', clear: true }
            ],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($string.toBoolean($this.store.Exception.Error) == false) {

                }
            }
        },

        LF02: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [
                { type: 'Form', dataFieldID: 'Exception' },
                { type: 'Grid', dataFieldID: 'ErrorTransaction', clear: true }
            ],
            callback: (error, responseObject, addtionalData, correlationID) => {
                if ($string.toBoolean($this.store.Exception.Error) == false) {

                }
            }
        }
    },

    hook: {
        pageInit() {
            syn.$w.addUIButton();
        },

        pageLoad() {
            syn.$l.get('lblAppTitle').innerText = syn.$w.ManagedApp.ApplicationName;
            syn.$l.get('txtUserWorkID').value = syn.$w.ManagedApp.UserWorkID;
            syn.$l.get('txtApplicationID').value = syn.$w.ManagedApp.ApplicationID;
            syn.$l.get('lblResponseDateTime').innerText = $date.toString(new Date(), 'n') + ' ' + $date.toString(new Date(), 't');

            var currentDay = new Date();
            var currentHour = currentDay.getHours();
            var defaultWeekDayTime = [];
            for (var i = 0; i < 168; i++) {
                defaultWeekDayTime.push(currentHour.toString().padStart(2, '0'));

                if (currentHour >= 23) {
                    currentHour = 0;
                    currentDay = $date.addDay(currentDay, -1);
                }
                else {
                    currentHour = currentHour + 1;
                }
            }

            $this.prop.chartUtils = ChartUtils.init();
            $this.prop.aggregateChart = new Chart(syn.$l.get('chtTransactionAggregate'), {
                type: 'line',
                data: {
                    labels: defaultWeekDayTime.reverse(),
                    datasets: [
                        {
                            label: '거래',
                            yAxisID: 'y-left',
                            borderColor: $this.prop.chartUtils.transparentize($this.prop.chartUtils.CHART_COLORS.indigo, 0.5),
                            backgroundColor: $this.prop.chartUtils.transparentize($this.prop.chartUtils.CHART_COLORS.indigo, 0.5),
                            tension: 0.2
                        }, {
                            type: 'bar',
                            label: '오류',
                            yAxisID: 'y-right',
                            borderColor: $this.prop.chartUtils.transparentize($this.prop.chartUtils.CHART_COLORS.red, 0.4),
                            backgroundColor: $this.prop.chartUtils.transparentize($this.prop.chartUtils.CHART_COLORS.red, 0.4),
                            tension: 0.2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    animation: {
                        duration: 0,
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                title: () => {
                                    return '';
                                },
                                footer: (tooltipItems) => {
                                    var data = $this.store.LineChart[tooltipItems[0].dataIndex];
                                    var dateHour = data.DateHour;
                                    var dateString = `${dateHour.substring(0, 4)}년 ${dateHour.substring(4, 6)}월 ${dateHour.substring(6, 8)}일 ${dateHour.substring(8, 10)}시`;
                                    return dateString;
                                },
                            }
                        },
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    },
                    scales: {
                        'y-left': {
                            type: 'linear',
                            stepSize: 1,
                            position: 'left',
                            beginAtZero: true
                        },
                        'y-right': {
                            type: 'linear',
                            stepSize: 1,
                            position: 'right',
                            beginAtZero: true
                        }
                    },
                    onClick(evt) {
                        var point = $this.prop.aggregateChart.getElementsAtEventForMode(
                            evt,
                            'nearest',
                            { intersect: true },
                            true
                        );

                        if (point && point.length > 0) {
                            var index = point[0].index;
                            var data = $this.store.LineChart[index];

                            var featureID = point[0].datasetIndex == 0 ? 'LF01' : 'LF02';
                            syn.$l.get('txtRequestDate').value = data.DateHour.substring(0, 8);
                            syn.$l.get('txtRequestHour').value = data.DateHour.substring(8);

                            $this.store.Exception.Error = '';
                            syn.$w.transactionAction(featureID);
                        }
                    }
                }
            });
        }
    },

    event: {
        btnDataRefresh_click(evt) {
            $this.store.Exception.Error = '';
            syn.$w.transactionAction('AF01');
        },
    },

    method: {
    },
}
