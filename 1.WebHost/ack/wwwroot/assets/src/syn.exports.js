/// <summary>
/// Node.js 용 exports 기능
/// </summary>
if (globalRoot.devicePlatform === 'node') {
    var fs = require('fs');
    var path = require('path');

    if (typeof localStorage === 'undefined' || localStorage === null) {
        var LocalStorage = require('node-localstorage').LocalStorage;
        globalRoot.localStorage = new LocalStorage(process.env.SYN_LocalStoragePath || '../cache/function');
    }

    var moduleLogDirectory = path.join((process.env.SYN_FileLogBasePath || '../log/function/javascript'), syn.Config.ApplicationID, syn.Config.ProjectID);
    if (fs.existsSync(moduleLogDirectory) == false) {
        fs.mkdirSync(moduleLogDirectory, {
            recursive: true
        });
    }

    if (typeof globalRoot.$logger === 'undefined' || globalRoot.$logger === null) {
        var options = {
            logDirectory: moduleLogDirectory,
            fileNamePattern: '{0}_function_<DATE>.log'.format(syn.Config.ApplicationID),
            dateFormat: 'YYYYMMDD'
        };

        var logger = require('simple-node-logger').createRollingFileLogger(options);
        logger.setLevel((process.env.SYN_LogMinimumLevel || 'trace'));
        globalRoot.$logger = logger;
    }

    if (syn && !syn.initializeModuleScript) {
        syn.initializeModuleScript = function (functionID, moduleFileName) {
            var result = null;
            if (moduleFileName) {
                try {
                    var fileDirectory = path.dirname(moduleFileName);
                    var fileDirectoryName = fileDirectory.split(path.sep).pop();
                    var moduleID = functionID;

                    var functionModule = syn.functionModules[moduleID];
                    if (functionModule == undefined) {
                        functionModule = {
                            path: fileDirectory,
                            config: eval('(' + fs.readFileSync(moduleFileName.replace('featureMain.js', 'featureMeta.json'), 'utf8') + ')').Header,
                            featureSQLPath: null,
                            logger: null,
                        };

                        var featureSQLPath = path.join(fileDirectory, 'featureSQL.xml');
                        if (fs.existsSync(featureSQLPath) == true) {
                            functionModule.featureSQLPath = featureSQLPath;
                        }

                        var moduleLogDirectory = path.join((process.env.SYN_FileLogBasePath || '../log/function/javascript'), functionModule.config.ApplicationID, functionModule.config.ProjectID, fileDirectoryName);
                        if (fs.existsSync(moduleLogDirectory) == false) {
                            fs.mkdirSync(moduleLogDirectory, {
                                recursive: true
                            });
                        }

                        var options = {
                            logDirectory: moduleLogDirectory,
                            fileNamePattern: '{0}_<DATE>.log'.format(fileDirectoryName),
                            dateFormat: 'YYYYMMDD'
                        };

                        var logger = require('simple-node-logger').createRollingFileLogger(options);
                        logger.setLevel((process.env.SYN_LogMinimumLevel || 'trace'));
                        functionModule.logger = logger;
                        syn.functionModules[moduleID] = functionModule;
                        result = moduleID;
                    }
                    else {
                        result = moduleID;
                    }
                } catch (error) {
                    console.log(error);
                }
            }
            else {
                console.log(moduleFileName + ' 모듈 확인 필요');
            }

            return result;
        };
    }

    if (syn && !syn.getModuleLibrary) {
        syn.getModuleLibrary = function (moduleID, moduleFileName) {
            var result = null;
            result = syn.functionModules[moduleID];
            if ($object.isNullOrUndefined(result) == true && moduleFileName) {
                syn.initializeModuleScript(moduleID, moduleFileName);
                result = syn.functionModules[moduleID];
            }

            return result;
        };
    }

    globalRoot.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
    syn.functionModules = {};
}
