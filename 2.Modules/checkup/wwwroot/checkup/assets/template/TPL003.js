var fs = require('fs');
var syn = require('syn');

module.exports = {
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    {{#commands}}
    {{featureID}}: async (moduleID, parameters, dataContext) => {
        var result = {
            DataTable1: [
                {
                    VALUE1: '',
                    VALUE2: '',
                    VALUE3: ''
                }
            ]
        };

        var functionName = "{{applicationID}}.{{projectID}}.{{transactionID}}.{{featureID}}";
        {{#params}}
        var {{variableID}} = $array.getValue(parameters, '{{id}}');
        {{/params}}

        var moduleConfig = syn.getModuleLibrary(moduleID).config;
        syn.$l.moduleEventLog(moduleID, '{{featureID}}', 'functionName {0} 시작'.format(functionName), 'Debug');

        await module.exports.sleep(100);

        var directObject = {
            programID: '{{applicationID}}',
            businessID: '{{projectID}}',
            transactionID: '{{transactionID}}',
            functionID: 'LD01',
            dataMapInterface: 'Row|Form',
            transactionResult: true,
            inputObjects: [
                {{#params}}
                { prop: '{{id}}', val: {{variableID}} }{{#comma}},{{/comma}}
                {{/params}}
            ]
        };

        syn.$w.transactionDirect(directObject, function (responseData, addtionalData) {
            debugger;
        });

        syn.$l.moduleEventLog(moduleID, '{{featureID}}', 'functionName {0} 완료'.format(functionName), 'Debug');
        return result;
    }{{#comma}},{{/comma}}
    {{/commands}}
}
