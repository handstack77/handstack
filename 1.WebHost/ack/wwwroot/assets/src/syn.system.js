/// <reference path='syn.core.js' />

(function (context) {
    'use strict';
    var $system = context.$system || new syn.module();

    $system.extend({
        getDataSource(moduleID, dataSourceID, callback) {
            if (!callback) {
                throw new Error('callback 함수 정의 필요');
            }

            try {
                var moduleLibrary = syn.getModuleLibrary(moduleID);
                if (moduleLibrary) {
                    var moduleConfig = moduleLibrary.config;

                    var fs = require('fs');
                    if (fs.existsSync(syn.Config.DataSourceFilePath) == true) {
                        fs.readFile(syn.Config.DataSourceFilePath, function (error, data) {
                            if (error) {
                                callback(error, null);
                            }
                            else {
                                var dbclientJson = JSON.parse(data);
                                var dataSource = dbclientJson.ModuleConfig.DataSource;
                                if ($object.isArray(dataSource) == false) {
                                    if (dataSource.DataSourceID === dataSourceID
                                        && dataSource.ApplicationID === moduleConfig.ApplicationID
                                        && (dataSource.ProjectID.includes('*') || dataSource.ProjectID.split(',').indexOf(moduleConfig.ProjectID) > -1)
                                    ) {
                                        if ($string.toBoolean(dataSource.IsEncryption) == true) {
                                            dataSource.ConnectionString = syn.$s.decryptConnectionString(dataSource);
                                            dataSource.IsEncryption = false;
                                        }

                                        callback(null, {
                                            connectionString: dataSource.ConnectionString,
                                            provider: dataSource.DataProvider
                                        });
                                    }
                                    else {
                                        callback('DataSourceID: {0}, ApplicationID: {1}, ProjectID: {2} 환경 설정 확인 필요'.format(dataSourceID, moduleConfig.ApplicationID, moduleConfig.ProjectID), null);
                                    }
                                }
                                else {
                                    var findDataSource = dataSource.find(function (item) {
                                        return item.DataSourceID == dataSourceID
                                            && item.ApplicationID === moduleConfig.ApplicationID
                                            && (item.ProjectID.includes('*') || item.ProjectID.split(',').indexOf(moduleConfig.ProjectID) > -1);
                                    });
                                    if (findDataSource) {
                                        if ($string.toBoolean(findDataSource.IsEncryption) == true) {
                                            findDataSource.ConnectionString = syn.$s.decryptConnectionString(findDataSource);
                                            findDataSource.IsEncryption = false;
                                        }

                                        callback(null, {
                                            connectionString: findDataSource.ConnectionString,
                                            provider: findDataSource.DataProvider
                                        });
                                    }
                                    else {
                                        callback('DataSourceID: {0}, ApplicationID: {1}, ProjectID: {2} 환경 설정 확인 필요'.format(dataSourceID, moduleConfig.ApplicationID, moduleConfig.ProjectID), null);
                                    }
                                }
                            }
                        });
                    }
                    else {
                        callback('DataSource 설정 파일 경로 확인 필요', null);
                    }
                }
                else {
                    callback('ModuleID 확인 필요', null);
                }
            } catch (error) {
                callback(error, null);
            }
        },

        decryptConnectionString(dataSource) {
            var result = '';
            if (dataSource && dataSource.ConnectionString) {
                try {
                    var values = $string.split(dataSource.ConnectionString, '.');
                    var encrypt = values[0];
                    var decryptKey = values[1];
                    var hostName = values[2];
                    var hash = values[3];

                    if (syn.$c.sha256(`${encrypt}.${decryptKey}.${hostName}`) === hash) {
                        var processedKey = syn.$c.base64Decode(decryptKey).padEnd(32, '0').substring(0, 32);
                        result = syn.$c.aesDecode(encrypt, processedKey);
                    }
                } catch (exception) {
                    syn.$l.eventLog('decryptConnectionString', `${JSON.stringify(dataSource)} 확인 필요`, 'Error');
                }
            }

            return result;
        },

        getStatement(moduleID, statementID, parameters) {
            var result = null;

            var moduleLibrary = syn.getModuleLibrary(moduleID);
            if (moduleLibrary) {
                try {
                    var featureSQLPath = moduleLibrary.featureSQLPath;

                    if (featureSQLPath && fs.existsSync(featureSQLPath) == true) {
                        var mybatisMapper = require('mybatis-mapper');
                        mybatisMapper.createMapper([featureSQLPath]);
                        mybatisMapper.featureSQLPath = featureSQLPath;
                        result = mybatisMapper.getStatement('feature', statementID, parameters);
                    }
                    else {
                        syn.$l.eventLog('getStatement', 'featureSQLPath - {0} 확인 필요'.format(featureSQLPath), 'Error');
                    }
                } catch (error) {
                    syn.$l.eventLog('getStatement', error, 'Error');
                }
            }
            else {
                syn.$l.eventLog('getStatement', 'ModuleID 확인 필요', 'Error');
            }

            return result;
        },

        executeQuery(moduleID, statementID, parameters, callback) {
            var moduleLibrary = syn.getModuleLibrary(moduleID);
            if (moduleLibrary) {
                var moduleConfig = moduleLibrary.config;
                syn.$s.getDataSource(moduleID, moduleConfig.DataSourceID, function (error, dataSource) {
                    if (error) {
                        if (callback) {
                            callback(error, null);
                        }
                    }
                    else {
                        if (dataSource.provider == 'SqlServer') {
                            var db = require('mssql');
                            db.connect(dataSource.connectionString, function (error) {
                                if (error) {
                                    if (callback) {
                                        callback(error, null);
                                    }
                                }
                                else {
                                    var sql = '';

                                    try {
                                        sql = syn.$s.getStatement(moduleID, statementID, parameters);
                                        if (sql == null) {
                                            var message = 'moduleID: {0}, statementID: {1} - 쿼리 매핑 확인 필요'.format(moduleID, statementID);
                                            syn.$l.eventLog('getStatement', message, 'Error');
                                            if (callback) {
                                                callback(message, null);
                                            }
                                        }

                                        sql = sql.replace(/\\\"/g, '"');

                                        if ($string.isNullOrEmpty(sql.trim()) == true) {
                                            var message = 'moduleID: {0}, statementID: {1} - SQL 내용 없음'.format(moduleID, statementID, error.message);
                                            syn.$l.eventLog('getStatement', message, 'Error');
                                            if (callback) {
                                                callback(message, null);
                                            }
                                        }
                                    } catch (error) {
                                        db.close();
                                        var message = 'moduleID: {0}, statementID: {1} - {2}'.format(moduleID, statementID, error.message);
                                        syn.$l.eventLog('getStatement', message, 'Error');
                                        if (callback) {
                                            callback(message, null);
                                        }
                                    }

                                    if (callback) {
                                        db.query(sql, function (error, result) {
                                            db.close();
                                            if (error) {
                                                var message = 'moduleID: {0}, statementID: {1} - {2}'.format(moduleID, statementID, error.message);
                                                syn.$l.eventLog('getStatement', message, 'Error');
                                                if (callback) {
                                                    callback(message, null);
                                                }
                                            }
                                            else {
                                                callback(null, result);
                                            }
                                        });
                                    }
                                    else {
                                        db.query(sql, function (error, result) {
                                            db.close();

                                            if (error) {
                                                var message = 'moduleID: {0}, statementID: {1} - {2}'.format(moduleID, statementID, error.message);
                                                syn.$l.eventLog('getStatement', message, 'Error');
                                            }
                                        });
                                    }
                                }
                            });
                        }
                        else if (dataSource.provider == 'MySQL') {
                            var mysql = require('mysql');
                            var mysqlConnectionInfos = dataSource.connectionString.split(';');

                            // https://www.npmjs.com/package/mysql
                            // 'mysql://user:pass@host/db?&charset=UTF8_GENERAL_CI&timezone=local&connectTimeout=10000&multipleStatements=true'
                            var mysqlConnectionObject = {
                                host: 'localhost',
                                user: '',
                                password: '',
                                database: '',
                                multipleStatements: true
                            };

                            var length = mysqlConnectionInfos.length;
                            for (var i = 0; i < length; i++) {
                                var item = mysqlConnectionInfos[i];
                                if (item.indexOf('Server=') > -1) {
                                    mysqlConnectionObject.host = item.substring(7);
                                    continue;
                                }

                                if (item.indexOf('Uid=') > -1) {
                                    mysqlConnectionObject.user = item.substring(4);
                                    continue;
                                }

                                if (item.indexOf('Pwd=') > -1) {
                                    mysqlConnectionObject.password = item.substring(4);
                                    continue;
                                }

                                if (item.indexOf('Database=') > -1) {
                                    mysqlConnectionObject.database = item.substring(9);
                                    continue;
                                }

                                if (item.indexOf('Timeout=') > -1) {
                                    mysqlConnectionObject.connectTimeout = item.substring(8);
                                    continue;
                                }
                            }

                            var db = mysql.createConnection(mysqlConnectionObject);
                            db.connect(function (error) {
                                if (error) {
                                    if (callback) {
                                        callback(error, null);
                                    }
                                }
                                else {
                                    var sql = '';

                                    try {
                                        sql = syn.$s.getStatement(moduleID, statementID, parameters);
                                        sql = sql.replace(/\\\"/g, '"');

                                        if ($string.isNullOrEmpty(sql.trim()) == true) {
                                            var message = 'moduleID: {0}, statementID: {1} - SQL 내용 없음'.format(moduleID, statementID, error.message);
                                            syn.$l.eventLog('getStatement', message, 'Error');
                                            if (callback) {
                                                callback(message, null);
                                            }
                                        }
                                    } catch (error) {
                                        db.end();
                                        var message = 'moduleID: {0}, statementID: {1} - {2}'.format(moduleID, statementID, error.message);
                                        syn.$l.eventLog('getStatement', message, 'Error');
                                        if (callback) {
                                            callback(message, null);
                                        }
                                    }

                                    if (callback) {
                                        db.query(sql, function (error, result) {
                                            db.end();
                                            if (error) {
                                                var message = 'moduleID: {0}, statementID: {1} - {2}'.format(moduleID, statementID, error.message);
                                                syn.$l.eventLog('getStatement', message, 'Error');
                                                if (callback) {
                                                    callback(message, null);
                                                }
                                            }
                                            else {
                                                callback(null, result);
                                            }
                                        });
                                    }
                                    else {
                                        db.query(sql, function (error, result) {
                                            db.end();

                                            if (error) {
                                                var message = 'moduleID: {0}, statementID: {1} - {2}'.format(moduleID, statementID, error.message);
                                                syn.$l.eventLog('getStatement', message, 'Error');
                                            }
                                        });
                                    }
                                }
                            });
                        }
                        else if (dataSource.provider == 'Oracle') {
                            var oracledb = require('oracledb');
                            var oracledbConnectionInfos = dataSource.connectionString.split(';');

                            // https://oracle.github.io/node-oracledb/doc/api.html#connectionstrings
                            // https://oracle.github.io/node-oracledb/INSTALL.html
                            var oracledbConnectionObject = {
                                user: '',
                                password: '',
                                connectString: dataSource.connectionString
                            };

                            var length = oracledbConnectionInfos.length;
                            for (var i = 0; i < length; i++) {
                                var item = oracledbConnectionInfos[i];
                                if (item.indexOf('User Id=') > -1) {
                                    oracledbConnectionObject.user = item.substring(8);
                                    continue;
                                }

                                if (item.indexOf('Password=') > -1) {
                                    oracledbConnectionObject.password = item.substring(9);
                                    continue;
                                }
                            }

                            oracledb.getConnection(oracledbConnectionObject, function (error, db) {
                                if (error) {
                                    if (callback) {
                                        callback(error, null);
                                    }
                                }
                                else {
                                    var sql = '';

                                    try {
                                        sql = syn.$s.getStatement(moduleID, statementID, parameters);
                                        sql = sql.replace(/\\\"/g, '"');

                                        if ($string.isNullOrEmpty(sql.trim()) == true) {
                                            var message = 'moduleID: {0}, statementID: {1} - SQL 내용 없음'.format(moduleID, statementID, error.message);
                                            syn.$l.eventLog('getStatement', message, 'Error');
                                            if (callback) {
                                                callback(message, null);
                                            }
                                        }
                                    } catch (error) {
                                        db.close();
                                        var message = 'moduleID: {0}, statementID: {1} - {2}'.format(moduleID, statementID, error.message);
                                        syn.$l.eventLog('getStatement', message, 'Error');
                                        if (callback) {
                                            callback(message, null);
                                        }
                                    }

                                    if (callback) {
                                        db.execute(sql, function (error, result) {
                                            db.close();
                                            if (error) {
                                                var message = 'moduleID: {0}, statementID: {1} - {2}'.format(moduleID, statementID, error.message);
                                                syn.$l.eventLog('getStatement', message, 'Error');
                                                if (callback) {
                                                    callback(message, null);
                                                }
                                            }
                                            else {
                                                callback(null, result);
                                            }
                                        });
                                    }
                                    else {
                                        db.execute(sql, function (error, result) {
                                            db.close();

                                            if (error) {
                                                var message = 'moduleID: {0}, statementID: {1} - {2}'.format(moduleID, statementID, error.message);
                                                syn.$l.eventLog('getStatement', message, 'Error');
                                            }
                                        });
                                    }
                                }
                            });
                        }
                        else {
                            callback('데이터 원본 "{0}" 확인 필요'.format(dataSource.provider), null);
                        }
                    }
                });
            }
            else {
                callback('ModuleID 확인 필요', null);
            }
        }
    });
    context.$system = syn.$s = $system;
})(globalRoot);
