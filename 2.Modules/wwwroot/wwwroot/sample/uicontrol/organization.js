'use strict';
let $organization = {
    event: {
        orgChartView_nodeTemplate(data) {
            return '<div class="title">' + data.data.name + '</div><div class="content">' + data.title + '</div>';
        },

        orgChartView_createNode($node, data) {
            console.log(data);
            // $node[0].id = ['organID + elID'];
            // $node.html('custom html template');
            // $node.children('.title').html('custom html template');

            // $node.on('click', function (event) {
            //     if (!$(event.target).is('.edge, .toggleBtn')) {
            //         var that = $(this);
            //         var $chart = that.closest('.orgchart');
            //         console.log(data);
            //     }
            // });
            // 
            var secondMenuIcon = $('<i>', {
                'class': 'oci oci-info-circle second-menu-icon',
                click() {
                    $(this).siblings('.second-menu').toggle();
                }
            });
            var secondMenu = '<div class="second-menu"><img class="avatar" src="https://dabeng.github.io/OrgChart/img/avatar/' + data.id + '.jpg"></div>';
            $node.append(secondMenuIcon).append(secondMenu);
        },

        orgChartView_nodedrop(evt, params) {
            syn.$l.eventLog('orgChartView_nodedrop', 'draggedNode:' + params.draggedNode.children('.title').text()
                + ', dragZone:' + params.dragZone.children('.title').text()
                + ', dropZone:' + params.dropZone.children('.title').text());
        },

        orgChartView_select(evt, node) {
            debugger;
            var nodeText = node.find('.title').text();
            syn.$l.eventLog('orgChartView_select', nodeText);
        },

        orgChartView_click(evt, focusNodes) {
            debugger;
            syn.$l.eventLog('orgChartView_click', focusNodes);
        },

        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(syn.uicontrols.$organization.getValue('orgChartView')));
        },

        btnSetValue_click() {
            var dataSource = JSON.parse(syn.$l.get('txtSourceData').value);
            syn.uicontrols.$organization.setValue('orgChartView', dataSource);
        },

        btnClear_click() {
            syn.uicontrols.$organization.clear('orgChartView');
        },

        btnGetControl_click() {
            var orgChartView = syn.uicontrols.$organization.getControl('orgChartView');
            // https://github.com/dabeng/OrgChart
            // https://dabeng.github.io/OrgChart/
        },
    }
}
