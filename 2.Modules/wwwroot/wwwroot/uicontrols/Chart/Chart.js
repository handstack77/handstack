/// <reference path="/js/syn.js" />

(function (window) {
    syn.uicontrols = syn.uicontrols || new syn.module();
    var $chart = syn.uicontrols.$chart || new syn.module();

    $chart.extend({
        name: 'syn.uicontrols.$chart',
        version: '1.0',
        chartControls: [],
        randomSeed: Date.now(),
        defaultSetting: {
            chart: {
                type: 'column'
            },
            title: {
                text: ''
            },
            xAxis: {
                categories: ['A', 'B', 'C']
            },
            yAxis: {
                title: {
                    text: 'Values'
                }
            },
            series: [{
                name: 'Series 1',
                data: [1, 0, 4]
            }, {
                name: 'Series 2',
                data: [5, 7, 3]
            }],
            dataType: 'string',
            belongID: null,
            controlText: null,
            validators: null,
            transactConfig: null,
            triggerConfig: null
        },

        addModuleList(el, moduleList, setting, controlType) {
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

            setting = syn.$w.argumentsExtend($chart.defaultSetting, setting);

            var mod = window[syn.$w.pageScript];
            if (mod && mod.hook.controlInit) {
                var moduleSettings = mod.hook.controlInit(elID, setting);
                setting = syn.$w.argumentsExtend(setting, moduleSettings);
            }

            setting.width = el.style.width || 320;
            setting.height = el.style.height || 240;

            el.setAttribute('id', el.id + '_hidden');
            el.setAttribute('syn-options', JSON.stringify(setting));
            el.style.display = 'none';

            var parent = el.parentNode;
            var wrapper = document.createElement('div');
            wrapper.style.width = setting.width
            wrapper.style.height = setting.height
            wrapper.id = elID;

            parent.appendChild(wrapper);

            syn.$l.addEvent(syn.$l.get(elID), 'click', function (evt) {
                var el = evt.target || evt.srcElement;
                // var control = $chart.getChartControl(el.id);
                // if (control) {
                //     var chart = control.chart;
                //     // chart.getElementAtEvent(evt);
                //     // chart.getDatasetAtEvent(evt);
                //     var activePoints = chart.getElementsAtEventForMode(evt, 'point', control.config);
                //     if (activePoints.length > 0) {
                //         var firstPoint = activePoints[0];
                //         var label = chart.data.labels[firstPoint._index];
                //         var value = chart.data.datasets[firstPoint._datasetIndex].data[firstPoint._index];
                //         console.log(label + ": " + value);
                //     }
                // }
            });

            $chart.chartControls.push({
                id: elID,
                chart: Highcharts.chart(elID, setting),
                setting: $object.clone(setting)
            });

            if (setting.bindingID && syn.uicontrols.$data) {
                syn.uicontrols.$data.bindingSource(elID, setting.bindingID);
            }
        },

        getValue: function (elID, meta) {
            var result = null;
            var chart = $chart.getChartControl(elID);
            if (chart) {
                result = [];
                var length = chart.series.length;
                for (var i = 0; i < length; i++) {
                    var serie = chart.series[i];
                    result.push({
                        name: serie.name,
                        data: serie.yData
                    });
                }
            }
            return result;
        },

        setValue: function (elID, value, meta) {
            var chart = $chart.getChartControl(elID);
            if (chart) {
                var seriesLength = chart.series.length;
                for (var i = seriesLength - 1; i > -1; i--) {
                    chart.series[i].remove();
                }
            }

            var length = value.length;
            for (var i = 0; i < length; i++) {
                var item = value[i];
                chart.addSeries(item);
            }

            var columnKeys = [];
            for (var key in item) {
                if (control.config.labelID != key) {
                    columnKeys.push(key);
                }
            }

            // var labels = value.map(function (item) { return item[control.config.labelID] });
            // control.config.data.labels = labels;
            // 
            // var length = columnKeys.length;
            // for (var i = 0; i < length; i++) {
            //     var columnID = columnKeys[i];
            // 
            //     if (control.config.series && control.config.series.length > 0) {
            //         var series = control.config.series.find(function (item) { return item.columnID == columnID });
            //         if (series) {
            //             var labelName = series.label ? series.label : series.columnID;
            //             var data = value.map(function (item) { return item[columnID] });
            // 
            //             var dataset = {
            //                 label: labelName,
            //                 data: data,
            //                 fill: series.fill
            //             };
            // 
            //             control.config.data.datasets.push(dataset);
            //         }
            //     }
            //     else {
            //         var labelName = columnID;
            //         var data = value.map(function (item) { return item[columnID] });
            // 
            //         var dataset = {
            //             label: labelName,
            //             data: data,
            //             fill: false
            //         };
            // 
            //         control.config.data.datasets.push(dataset);
            //     }
            // }
            // control.chart.update();|| chart.redraw();
        },

        randomScalingFactor: function (min, max) {
            min = min === undefined ? 0 : min;
            max = max === undefined ? 100 : max;
            return Math.round($chart.rand(min, max));
        },

        rand: function (min, max) {
            var seed = $chart.randomSeed;
            min = min === undefined ? 0 : min;
            max = max === undefined ? 1 : max;
            $chart.randomSeed = (seed * 9301 + 49297) % 233280;
            return min + ($chart.randomSeed / 233280) * (max - min);
        },

        toImage: function (elID, fileID) {
            var control = $chart.getChartControl(elID);
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

            var length = $chart.chartControls.length;
            for (var i = 0; i < length; i++) {
                var item = $chart.chartControls[i];
                if (item.id == elID) {
                    result = item.chart;
                    break;
                }
            }

            return result;
        },

        clear: function (elID, isControlLoad) {
            var chart = $chart.getChartControl(elID);
            while (chart.series.length > 0) {
                chart.series[0].remove(true);
            }
        },

        setLocale: function (elID, translations, control, options) {
        }
    });
    syn.uicontrols.$chart = $chart;
})(window);
