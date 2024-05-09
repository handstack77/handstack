// node --inspect featureTest.js 8080

var express = require('express');
var app = express();
var syn = require('syn');
var path = require('path');
var fs = require('fs');

var executeFunction = (req, res) => {
    var moduleID = req.query.moduleID || 'JSK000';

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
        globalID: `OD00000HDSTST${moduleID}AF01F${syn.$l.random(6) + $date.toString(new Date(), 's').substring(0, 6)}`,
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
        dataContext.featureMeta = JSON.parse(data);
    }
    else {
        throw `Function 헤더 파일이 존재하지 않습니다. 파일경로: ${headerFilePath}`;
    }

    module.exports.GF01((error, result) => {
        if (error) {
            console.error(error);
        }

        res.json(result);
    }, moduleID, parameters, dataContext);
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.all('/function/api/execute', executeFunction);

var port = process.argv[2] || 8080;
app.listen(port, () => {
    console.log(`Server is running... http://localhost:${port}/function/api/execute`);
});

// 서버 함수 본문

module.exports = {
    GF01: (callback, moduleID, parameters, dataContext) => {
        var typeMember = "TST.JSF010.GF01";
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
