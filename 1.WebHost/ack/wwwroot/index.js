'use strict';
let context = globalThis;
let $index = {
    // 화면 구성에 필요한 환경설정
    config: {
        programID: 'HDS',
        businessID: 'ZZW',
        systemID: 'BP01',
        transactionID: 'TST030',
        dataSource: {
        },
        transactions: [
            {
                functionID: "GD01",
                inputs: [
                    {
                        requestType: "Row",
                        dataFieldID: "MainForm",
                        items: {
                            ApplicationID: {
                                fieldID: "ApplicationID",
                                dataType: "string"
                            },
                            CodeGroupID: {
                                fieldID: "CodeGroupID",
                                dataType: "string"
                            }
                        }
                    }
                ],
                outputs: [
                    {
                        responseType: "Grid",
                        dataFieldID: "MainForm",
                        items: {
                            ApplicationID: {
                                fieldID: "ApplicationID",
                                dataType: "int"
                            },
                            CodeGroupID: {
                                fieldID: "CodeGroupID",
                                dataType: "string"
                            },
                            CodeType: {
                                fieldID: "CodeType",
                                dataType: "string"
                            },
                            CodeGroupName: {
                                fieldID: "CodeGroupName",
                                dataType: "string"
                            },
                            Description: {
                                fieldID: "Description",
                                dataType: "bool"
                            },
                            Custom1: {
                                fieldID: "Custom1",
                                dataType: "string"
                            },
                            Custom2: {
                                fieldID: "Custom2",
                                dataType: "int"
                            },
                            Custom3: {
                                fieldID: "Custom3",
                                dataType: "int"
                            },
                            UseYN: {
                                fieldID: "UseYN",
                                dataType: "bool"
                            },
                            CreatePersonID: {
                                fieldID: "CreatePersonID",
                                dataType: "int"
                            },
                            CreatedAt: {
                                fieldID: "CreatedAt",
                                dataType: "string"
                            }
                        }
                    }
                ]
            }
        ]
    },

    // 화면내 전역변수 선언
    prop: {
    },

    // life cycle, 외부 이벤트 hook 선언
    hook: {
        beforeTransaction(transactConfig) {
            syn.$l.eventLog('ui_event', 'beforeTransaction - transactConfig: {0}'.format(JSON.stringify(transactConfig)));
            return true;
        },

        afterTransaction(error, functionID, responseData, addtionalData) {
            syn.$l.eventLog('ui_event', 'afterTransaction - error: {0}, functionID: {1}, response: {2}, addtionalData: {3}'.format(JSON.stringify(error), functionID, JSON.stringify(responseData), JSON.stringify(addtionalData)));
        },

        pageLoad() {
            var test = [
                {
                    id: 'EMPLOYEE_NO',
                    type: 'String',
                    length: '-1',
                    value: 'NULL'
                }, {
                    id: 'EMPLOYEE_NO',
                    type: 'String',
                    length: '-1',
                    value: 'NULL'
                }, {
                    id: 'EMPLOYEE_NO',
                    type: 'String',
                    length: '-1',
                    value: 'NULL'
                }
            ];

            var string = '<param id="@${id}" type="${type}" length="${length}" value="${value}" />';
            console.log($string.interpolate(string, test));
        }
    },

    // 사용자 이벤트 핸들러 선언
    event: {
        btnTransaction_click() {
            syn.$w.transaction('GD01', function (responseObject, variable) {
                syn.$l.eventLog('btnRetrieve_click', JSON.stringify(responseObject));
            }, {
                dynamic: 'Y',
                commandType: 'D'
            });
        }
    },

    // 데이터 원본 모델 선언
    model: {
    },

    // 거래 메서드 선언
    transaction: {
    },

    // 기능 메서드 선언
    method: {

    },

    // 외부 이벤트, 콜백 메서드 선언
    message: {
    }
};


