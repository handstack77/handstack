// node --inspect featureTest.js 8080

var express = require('express');
var app = express();
var syn = require('syn');
var path = require('path');
var fs = require('fs');

var executeFunction = (req, res) => {
    var functionID = req.query.functionID || 'TST.JSF010.GF01';

    var parameters = req.body || [
        {
            "ParameterName": "ApplicationID",
            "Value": "HDS",
            "DbType": "String",
            "Length": 0
        }
    ];

    var dataContext = {
        accessToken: null,
        loadOptions: null,
        globalID: `OD00000HDS${functionID.replaceAll('.', '')}F${syn.$l.random(6) + $date.toString(new Date(), 's').substring(0, 6)}`,
        environment: 'D',
        platform: 'Windows', // Windows, Linux, MacOS
        dataProvider: null, // SQLite, SqlServer, MySql, Oracle, PostgreSql, MariaDB
        connectionString: null,
        workingDirectoryPath: '../tmp/HDS/function/HDS_FN00',
        featureMeta: null
    };

    var headerFilePath = path.join(process.cwd(), 'featureTest.json');
    if (fs.existsSync(headerFilePath) == true) {
        var data = fs.readFileSync(headerFilePath, 'utf8');
        var functionScriptContract = JSON.parse(data);
        var header = functionScriptContract.Header;
        dataContext.functionHeader = header;

        var item = functionScriptContract.Commands.find((p) => { return p.ID == functionID.Split('.')[2] });
        if (item == null) {
            throw `${functionID} Commands 확인 필요`;
        }

        var moduleScriptMap = {};
        moduleScriptMap.ApplicationID = header.ApplicationID;
        moduleScriptMap.ProjectID = header.ProjectID;
        moduleScriptMap.TransactionID = header.TransactionID;
        moduleScriptMap.ScriptID = item.ID + item.Seq.toString().padStart(2, '0');
        moduleScriptMap.ExportName = item.ID;
        moduleScriptMap.Seq = item.Seq;
        moduleScriptMap.IsHttpContext = header.IsHttpContext;
        moduleScriptMap.ReferenceModuleID = header.ReferenceModuleID;

        if (!item.EntryType) {
            moduleScriptMap.EntryType = `${header.ApplicationID}.Function.${header.ProjectID}.${header.TransactionID}`;
        }
        else {
            moduleScriptMap.EntryType = item.EntryType;
        }

        if (!item.EntryType) {
            moduleScriptMap.EntryMethod = item.ID;
        }
        else {
            moduleScriptMap.EntryMethod = item.EntryMethod;
        }

        moduleScriptMap.DataSourceID = header.DataSourceID;
        moduleScriptMap.LanguageType = header.LanguageType;
        moduleScriptMap.ProgramPath = 'featureTest.js';
        moduleScriptMap.Timeout = item.Timeout;
        moduleScriptMap.BeforeTransactionCommand = item.BeforeTransaction;
        moduleScriptMap.AfterTransactionCommand = item.AfterTransaction;
        moduleScriptMap.FallbackTransactionCommand = item.FallbackTransaction;
        moduleScriptMap.Comment = item.Comment;

        moduleScriptMap.ModuleParameters = [];
        let functionParams = item.Params;
        if (functionParams && functionParams.length > 0) {
            for (let functionParam of functionParams) {
                moduleScriptMap.ModuleParameters.push({
                    Name: functionParam.ID,
                    DbType: functionParam.Type,
                    Length: functionParam.Length,
                    DefaultValue: functionParam.Value,
                });
            }
        }
        dataContext.featureMeta = moduleScriptMap;
    }
    else {
        throw `Function 헤더 파일이 존재하지 않습니다. 파일경로: ${headerFilePath}`;
    }

    if (dataContext.featureMeta.ApplicationID == '') {
        throw `Function 정보 확인 필요: ${functionID}`;
    }

    module.exports.GF01((error, result) => {
        if (error) {
            console.error(error);
        }

        res.json(result);
    }, functionID, parameters, dataContext);
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.all('/function/api/execution', executeFunction);

var port = process.argv[2] || 8080;
app.listen(port, () => {
    console.log(`Server is running... http://localhost:${port}/function/api/execution`);
});

// 서버 함수 본문

module.exports = {
    GF01: (callback, moduleID, parameters, dataContext) => {
        var typeMember = 'TST.JSF010.GF01';
        var applicationID = $array.getValue(parameters, 'ApplicationID');

        var result = {
            DataTable1: [
                {
                    FunctionResult: `typeMember: ${typeMember}, moduleID: ${moduleID}, applicationID: ${applicationID}`
                }
            ]
        };

        callback(null, result);
    }
}
