var fs = require('fs');
var syn = require('syn');

module.exports = {
    GF01: (callback, moduleID, parameters, dataContext) => {
        var typeMember = "TST.JSF010.GF01";
        var serverDate = $array.getValue(parameters, 'ServerDate');
        var serverName = $array.getValue(parameters, 'ServerName');

        var result = {
            DataTable1: [
                {
                    FunctionResult: `typeMember: ${typeMember}, moduleID: ${moduleID}, serverDate: ${serverDate}, serverName: ${serverName}`
                }
            ]
        };

        callback(null, result);
    }
}
