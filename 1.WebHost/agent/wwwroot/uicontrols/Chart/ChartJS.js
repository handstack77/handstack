/// <reference path="/Scripts/syn.js" />

(function (window) {
    'use strict';
    syn.uicontrols = syn.uicontrols || new syn.module();
    var $chartjs = syn.uicontrols.$chartjs || new syn.module();

    if (window.Chart) {
        Chart.defaults.font.family = "Noto Sans KR, 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
        Chart.defaults.font.size = 12;
        Chart.defaults.color = '#666';
        Chart.defaults.plugins.legend.position = 'bottom';
    }

    $chartjs.extend({
        name: 'syn.uicontrols.$chartjs',
        version: 'v2025.12.26',
        chartControls: [],
        randomSeed: Date.now(),
        defaultSetting: {
            labelID: '',
            series: [],
            type: 'line',
            data: {},
            options: null,
            dataType: 'string',
            belongID: null,
            getter: false,
            setter: false,
            controlText: null,
            validators: null,
            transactConfig: null,
            triggerConfig: null
        },

        addModuleList: function (el, moduleList, setting, controlType) {
            var elementID = el.getAttribute('id');
            var dataField = el.getAttribute('syn-datafield');
            var formDataField = el.closest('form') ? el.closest('form').getAttribute('syn-datafield') : '';

            moduleList.push({
                id: elementID,
                formDataFieldID: formDataField,
                field: dataField,
                module: this.name,
                type: controlType
            });
        },

        controlLoad: function (elID, setting) {
            var el = syn.$l.get(elID);
            setting = syn.$w.argumentsExtend($chartjs.defaultSetting, setting);
            var isDarkMode = (window.localStorage && localStorage.getItem('isDarkMode') == 'true');
            if (isDarkMode == false) {
                setting.options = syn.$w.argumentsExtend($object.clone({
                    maintainAspectRatio: false,
                    responsiveAnimationDuration: 0,
                    showLines: true,
                    layout: {
                        padding: 8
                    },
                    legend: {
                        display: true,
                        fontColor: '#ccc'
                    },
                    animation: {
                        duration: 0
                    },
                    hover: {
                        animationDuration: 0,
                        intersect: false
                    },
                    title: {
                        display: false,
                        fontSize: 16,
                        text: ''
                    },
                    tooltips: {
                        position: 'nearest',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFontColor: '#fff',
                        bodyFontColor: '#fff'
                    },
                    plugins: {
                        // colorschemes: {
                        //     scheme: 'brewer.Paired12'
                        // }
                    }
                }), setting.options);
            }
            else {
                setting.options = syn.$w.argumentsExtend($object.clone({
                    maintainAspectRatio: false,
                    responsiveAnimationDuration: 0,
                    showLines: true,
                    layout: {
                        padding: 8
                    },
                    legend: {
                        display: true,
                        fontColor: '#ccc'
                    },
                    animation: {
                        duration: 0
                    },
                    hover: {
                        animationDuration: 0,
                        intersect: false
                    },
                    title: {
                        display: false,
                        fontSize: 16,
                        text: ''
                    },
                    tooltips: {
                        position: 'nearest',
                        intersect: false,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        titleFontColor: '#000',
                        bodyFontColor: '#000'
                    },
                    plugins: {
                        // colorschemes: {
                        //     scheme: 'brewer.Paired12'
                        // }
                    }
                }), setting.options);
            }

            if (setting.type == 'line' || setting.type == 'bar' || setting.type == 'bubble' || setting.type == 'scatter') {
                if (isDarkMode == true) {
                    setting.options.scales = {
                        x: {
                            grid: {
                                color: 'rgba(0, 0, 0, 0.2)'
                            },
                            ticks: {
                                color: '#ccc'
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(0, 0, 0, 0.2)'
                            },
                            ticks: {
                                beginAtZero: true,
                                color: '#ccc'
                            }
                        }
                    };
                }
                else {
                    setting.options.scales = {
                        x: {
                            beginAtZero: true
                        },
                        y: {
                            beginAtZero: true
                        }
                    };
                }
            }

            /*
            // https://nagix.github.io/chartjs-plugin-colorschemes/colorchart.html
            controlInit: function (elID, settings) {
                if (elID == 'chtChart1' || elID == 'chtChart2' || elID == 'chtChart3') {
                    settings.options.scales.y[0].ticks.min = 0;
                    settings.options.scales.y[0].ticks.max = 100;
                }

                if (elID == 'chtChart1' || elID == 'chtChart2' || elID == 'chtChart3') {
                    settings.options.plugins.colorschemes.scheme = 'tableau.ClassicGray5';
                }

                if (elID == 'chtChart4') {
                    settings.options.plugins.colorschemes.scheme = 'tableau.ClassicBlueRed6';
                }
            },
            */
            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook.controlInit) {
                var moduleSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleSettings);
            }

            if ($string.isNullOrEmpty(setting.labelID) == true) {
                syn.$l.eventLog('$chartjs.controlLoad', 'labelID 정보 확인 필요', 'Debug');
                return;
            }

            setting.width = el.style.width || 320;
            setting.height = el.style.height || 240;

            el.setAttribute('id', el.id + '_hidden');
            el.setAttribute('syn-options', JSON.stringify(setting));
            el.style.display = 'none';

            var parent = el.parentNode;
            var wrapper = document.createElement('div');
            wrapper.style.width = setting.width;
            wrapper.style.height = setting.height;
            wrapper.style.position = 'relative';
            wrapper.className = 'chart-container';
            wrapper.innerHTML = '<canvas id="{0}"></canvas>'.format(elID);

            parent.appendChild(wrapper);

            syn.$l.addEvent(syn.$l.get(elID), 'click', function (evt) {
                var el = evt.target || evt.srcElement;
                var control = $chartjs.getChartControl(el.id);
                if (control) {
                    var chart = control.chart;
                    // chart.getElementAtEvent(evt);
                    // chart.getDatasetAtEvent(evt);
                    const activePoints = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, false);
                    if (activePoints.length > 0) {
                        var firstPoint = activePoints[0];
                        var label = chart.data.labels[firstPoint._index];
                        var value = chart.data.datasets[firstPoint._datasetIndex].data[firstPoint._index];
                        console.log(label + ": " + value);
                    }
                }
            });

            $chartjs.chartControls.push({
                id: elID,
                chart: new Chart(elID, setting),
                config: setting,
                value: null
            });

            if (setting.bindingID && syn.uicontrols.$data) {
                syn.uicontrols.$data.bindingSource(elID, setting.bindingID);
            }
        },

        getValue: function (elID, meta) {
            return '';
        },

        setValue: function (elID, value, metaColumns) {
            var error = '';
            var control = $chartjs.getChartControl(elID);
            if (control) {
                control.config.data.labels.length = 0;
                control.config.data.datasets.length = 0;
                if (value && value.length > 0) {
                    var item = value[0];

                    for (var column in item) {
                        var isTypeCheck = false;
                        var metaColumn = metaColumns[column];
                        if (metaColumn) {
                            switch (metaColumn.DataType.toLowerCase()) {
                                case 'string':
                                    isTypeCheck = $string.isNullOrEmpty(item[column]) == true || $object.isString(item[column]);
                                    break;
                                case 'bool':
                                    if ($string.isNullOrEmpty(item[column]) == true || item[column] == '1' || item[column] == '0') {
                                        isTypeCheck = true;
                                    }
                                    else {
                                        isTypeCheck = $object.isBoolean(item[column]);
                                    }
                                    break;
                                case 'number':
                                case 'int':
                                    isTypeCheck = $string.isNullOrEmpty(item[column]) == true || $string.isNumber(item[column]) || $object.isNumber(item[column]);
                                    break;
                                case 'date':
                                    isTypeCheck = $string.isNullOrEmpty(item[column]) == true || $object.isDate(item[column]);
                                    break;
                                default:
                                    isTypeCheck = false;
                                    break;
                            }

                            if (isTypeCheck == false) {
                                error = '바인딩 데이터 타입과 매핑 정의가 다름, 바인딩 ID - "{0}", 타입 - "{1}"'.format(column, metaColumn.DataType);
                                break;
                            }
                        } else {
                            continue;
                        }
                    }

                    if (error == '') {
                        var columnKeys = [];
                        for (var key in item) {
                            if (control.config.labelID != key) {
                                columnKeys.push(key);
                            }
                        }

                        var labels = value.map(function (item) { return item[control.config.labelID] });
                        control.config.data.labels = labels;

                        var length = columnKeys.length;
                        for (var i = 0; i < length; i++) {
                            var columnID = columnKeys[i];

                            if (control.config.series && control.config.series.length > 0) {
                                var series = control.config.series.find(function (item) { return item.columnID == columnID });
                                if (series) {
                                    var labelName = series.label ? series.label : series.columnID;
                                    var data = value.map(function (item) { return item[columnID] });

                                    var dataset = {
                                        label: labelName,
                                        data: data,
                                        fill: series.fill
                                    };

                                    control.config.data.datasets.push(dataset);
                                }
                            }
                            else {
                                var labelName = columnID;
                                var data = value.map(function (item) { return item[columnID] });

                                var dataset = {
                                    label: labelName,
                                    data: data,
                                    fill: false
                                };

                                control.config.data.datasets.push(dataset);
                            }
                        }
                    } else {
                        syn.$l.eventLog('$chartjs.setValue', error, 'Debug');
                    }
                }

                control.chart.update();
            }
        },

        randomScalingFactor: function (min, max) {
            min = min === undefined ? 0 : min;
            max = max === undefined ? 100 : max;
            return Math.round($chartjs.rand(min, max));
        },

        rand: function (min, max) {
            var seed = $chartjs.randomSeed;
            min = min === undefined ? 0 : min;
            max = max === undefined ? 1 : max;
            $chartjs.randomSeed = (seed * 9301 + 49297) % 233280;
            return min + ($chartjs.randomSeed / 233280) * (max - min);
        },

        toImage: function (elID, fileID) {
            var control = $chartjs.getChartControl(elID);
            if (control) {
                var fileName = '{0}.png'.format(fileID || elID);
                var base64Image = control.chart.toBase64Image();

                if (download) {
                    download(base64Image, fileName, 'image/png');
                }
                else {
                    var a = document.createElement('a');
                    a.href = base64Image
                    a.download = fileName;
                    a.click();
                }
            }
        },

        getChartControl: function (elID) {
            var result = null;

            var length = $chartjs.chartControls.length;
            for (var i = 0; i < length; i++) {
                var item = $chartjs.chartControls[i];
                if (item.id == elID) {
                    result = item;
                    break;
                }
            }

            return result;
        },

        clear: function (elID, isControlLoad) {
            var control = $chartjs.getChartControl(elID);
            if (control) {
                control.config.data.labels.length = 0;
                control.config.data.datasets.length = 0;
                control.chart.update();
            }
        },

        setLocale: function (elID, translations, control, options) {
        }
    });
    syn.uicontrols.$chartjs = $chartjs;
})(window);
