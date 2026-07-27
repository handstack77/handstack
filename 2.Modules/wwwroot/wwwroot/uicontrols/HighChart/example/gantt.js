'use strict';
let $gantt = {
    prop: {
        rows: [{
            ID: 'design',
            NAME: '설계',
            START: Date.UTC(2026, 6, 1),
            END: Date.UTC(2026, 6, 6),
            OWNER: '아키텍트'
        },
        {
            ID: 'build',
            NAME: '구현',
            START: Date.UTC(2026, 6, 6),
            END: Date.UTC(2026, 6, 15),
            OWNER: '개발자',
            DEPENDENCY: 'design'
        },
        {
            ID: 'test',
            NAME: '검증',
            START: Date.UTC(2026, 6, 15),
            END: Date.UTC(2026, 6, 20),
            OWNER: 'QA',
            DEPENDENCY: 'build'
        },
        {
            ID: 'deploy',
            NAME: '배포',
            START: Date.UTC(2026, 6, 20),
            END: Date.UTC(2026, 6, 22),
            OWNER: '운영',
            DEPENDENCY: 'test'
        }]
    },
    hook: {
        pageLoad() {
            const rows = $this.prop.rows;
            return syn.uicontrols.$chart.renderChart('chtGantt', {
                constructorType: 'ganttChart',
                rows,
                selectionResolver(point, event, sourceRows) {
                    return sourceRows.findIndex(row => row.ID === point.id);
                },
                option: {
                    title: {
                        text: '릴리스 일정'
                    },
                    xAxis: {
                        currentDateIndicator: true
                    },
                    yAxis: {
                        type: 'treegrid',
                        uniqueNames: true
                    },
                    tooltip: {
                        pointFormat: '<b>{point.name}</b><br>{point.owner}'
                    },
                    plotOptions: {
                        gantt: {
                            dragDrop: {
                                draggableX: true,
                                dragPrecisionX: 24 * 3600 * 1000
                            }
                        }
                    },
                    series: [{
                        name: '계획',
                        data: rows.map((row, index) => ({
                            id: row.ID,
                            name: row.NAME,
                            start: row.START,
                            end: row.END,
                            dependency: row.DEPENDENCY,
                            owner: row.OWNER,
                            custom: {
                                handstackRowIndex: index
                            }
                        }))
                    }]
                }
            });
        }
    },
    event: {
        chtGantt_selectionChange(elID, params, selections) {
            $this.method.print(selections);
        },
        chtGantt_pointDrop(elID, params, selections) {
            $this.method.print({
                event: 'pointDrop',
                selections
            });
        }
    },
    method: {
        print(value) {
            syn.$l.get('preResult').textContent = JSON.stringify(value, null, 2);
        }
    }
};
