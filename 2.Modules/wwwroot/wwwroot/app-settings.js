'use strict';
let $app_settings = {
    prop: {
        defaultConfig: {
            "AppSettings": {
                "ProxyBasePath": "",
                "HostAccessID": "HANDSTACK_HOSTACCESSID",
                "SystemID": "HANDSTACK",
                "ApplicationID": "HDS",
                "ProgramName": "ack",
                "HostName": "HOSTNAME",
                "InstallType": "L",
                "BusinessServerUrl": "http://localhost:8421/transact/api/transaction/execute",
                "FindGlobalIDServer": "http://localhost:8421/wwwroot/api/index/create-id",
                "DomainAPIServer": {
                    "ServerID": "SERVERD01",
                    "ServerType": "D",
                    "Protocol": "http",
                    "IP": "localhost",
                    "Port": "8421",
                    "Path": "/transact/api/transaction/execute",
                    "ClientIP": "127.0.0.1"
                },
                "ForwardProxyIP": [],
                "IsTenantFunction": false,
                "IsExceptionDetailText": true,
                "IsEnabledDevAutoSignIn": false,
                "ContractRequestPath": "view",
                "TenantAppRequestPath": "app",
                "TenantAppBasePath": "../tenants",
                "BatchProgramBasePath": "../batchs",
                "CreateAppTempPath": "../tmp/create_apps",
                "ForbesBasePath": "../forbes",
                "IsModulePurgeContract": true,
                "IsEnabledCSP": false,
                "LoadModuleBasePath": "../modules",
                "LoadModules": [
                    "wwwroot",
                    "transact",
                    "dbclient",
                    "function",
                    "repository",
                    "logger"
                ],
                "LoadModuleLicenses": {},
                "RunningEnvironment": "D",
                "UseResponseComression": false,
                "UseForwardProxy": false,
                "UseSameIPProxy": false,
                "Security": {
                    "EnableSecurityHeaders": true,
                    "XFrameOptions": "SAMEORIGIN",
                    "EnablePublicCorsPolicy": true,
                    "ExposeSecretValues": false,
                    "WarnOnWildcardAllowClientIP": true,
                    "MaxContractSyncFileBytes": 10485760
                },
                "WithOrigins": [
                    "http://127.0.0.1",
                    "http://127.0.0.1:8421",
                    "http://localhost",
                    "http://localhost:8421"
                ],
                "SessionState": {
                    "IsSession": true,
                    "SessionCookieName": "HandStack.Session",
                    "CacheType": "Memory",
                    "MySqlConnectionString": "",
                    "MySqlSchemaName": "HandStack_Cache",
                    "MySqlTableName": "SessionData",
                    "SqlServerConnectionString": "",
                    "SqlServerSchemaName": "dbo",
                    "SqlServerTableName": "SessionData"
                },
                "CookiePrefixName": "HandStack",
                "UserSignExpire": -1,
                "OriginPort": 80,
                "ServerPort": 8421,
                "ServerDevCertSslPort": 8443,
                "ServerDevCertFilePath": "../ack.pfx",
                "ServerDevCertPassword": ""
            },
            "Serilog": {
                "Using": ["Serilog.Sinks.Console", "Serilog.Sinks.File"],
                "MinimumLevel": {
                    "Default": "Information",
                    "Override": {
                        "Microsoft": "Error",
                        "System": "Error",
                        "Hangfire": "Warning"
                    }
                },
                "Enrich": ["FromLogContext"],
                "WriteTo": [
                    {
                        "Name": "Console",
                        "Args": {
                            "outputTemplate": "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}"
                        }
                    },
                    {
                        "Name": "File",
                        "Args": {
                            "path": "../log/app.log",
                            "rollingInterval": "Day",
                            "rollOnFileSizeLimit": true,
                            "buffered": true,
                            "fileSizeLimitBytes": 104857600,
                            "flushToDiskInterval": "00:00:05",
                            "outputTemplate": "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}"
                        }
                    }
                ]
            },
            "Kestrel": {
                "DisableStringReuse": true,
                "Limits": {
                    "MaxConcurrentConnections": null,
                    "MaxConcurrentUpgradedConnections": null,
                    "MaxRequestBodySize": 104857600,
                    "KeepAliveTimeout": "00:02:00"
                }
            }
        },
        appConfig: null
    },

    hook: {
        pageLoad() {
            $this.prop.appConfig = $object.clone($this.prop.defaultConfig, true);

            syn.$l.addLive('[name="btnActionEdit"]', 'click', $this.event.btnActionEdit_click);
            syn.$l.addLive('[name="btnActionDelete"]', 'click', $this.event.btnActionDelete_click);

            $this.event.btnImportDefaultConfig_click();
            $this.event.btnApplyConfig_click();
        }
    },

    event: {
        btnImportDefaultConfig_click() {
            syn.$l.get('txtJsonView').value = JSON.stringify($this.prop.defaultConfig, null, 4);
        },

        btnApplyConfig_click() {
            try {
                var jsonConfig = JSON.parse(syn.$l.get('txtJsonView').value);
                $this.prop.appConfig = syn.$w.argumentsExtend($this.prop.defaultConfig, jsonConfig);

                var appSettings = $this.prop.appConfig.AppSettings;
                var serilog = $this.prop.appConfig.Serilog;
                var kestrel = $this.prop.appConfig.Kestrel;

                syn.$l.get('txtProxyBasePath').value = appSettings.ProxyBasePath;
                syn.$l.get('txtHostAccessID').value = appSettings.HostAccessID;
                syn.$l.get('txtSystemID').value = appSettings.SystemID;
                syn.$l.get('txtApplicationID').value = appSettings.ApplicationID;
                syn.$l.get('txtProgramName').value = appSettings.ProgramName;
                syn.$l.get('txtHostName').value = appSettings.HostName;
                syn.$l.get('ddlInstallType').value = appSettings.InstallType;
                syn.$l.get('txtBusinessServerUrl').value = appSettings.BusinessServerUrl;
                syn.$l.get('txtFindGlobalIDServer').value = appSettings.FindGlobalIDServer;

                syn.$l.get('txtDomServerID').value = appSettings.DomainAPIServer.ServerID;
                syn.$l.get('txtDomServerType').value = appSettings.DomainAPIServer.ServerType;
                syn.$l.get('txtDomProtocol').value = appSettings.DomainAPIServer.Protocol;
                syn.$l.get('txtDomIP').value = appSettings.DomainAPIServer.IP;
                syn.$l.get('txtDomPort').value = appSettings.DomainAPIServer.Port;
                syn.$l.get('txtDomPath').value = appSettings.DomainAPIServer.Path;
                syn.$l.get('txtDomClientIP').value = appSettings.DomainAPIServer.ClientIP;

                syn.$l.get('txtForwardProxyIP').value = appSettings.ForwardProxyIP.join(', ');
                syn.$l.get('chkIsTenantFunction').checked = $string.toBoolean(appSettings.IsTenantFunction);
                syn.$l.get('chkIsExceptionDetailText').checked = $string.toBoolean(appSettings.IsExceptionDetailText);
                syn.$l.get('chkIsEnabledDevAutoSignIn').checked = $string.toBoolean(appSettings.IsEnabledDevAutoSignIn);
                syn.$l.get('txtContractRequestPath').value = appSettings.ContractRequestPath;
                syn.$l.get('txtTenantAppRequestPath').value = appSettings.TenantAppRequestPath;
                syn.$l.get('txtTenantAppBasePath').value = appSettings.TenantAppBasePath;
                syn.$l.get('txtBatchProgramBasePath').value = appSettings.BatchProgramBasePath;
                syn.$l.get('txtCreateAppTempPath').value = appSettings.CreateAppTempPath;
                syn.$l.get('txtForbesBasePath').value = appSettings.ForbesBasePath;
                syn.$l.get('chkIsModulePurgeContract').checked = $string.toBoolean(appSettings.IsModulePurgeContract);
                syn.$l.get('chkIsEnabledCSP').checked = $string.toBoolean(appSettings.IsEnabledCSP);
                syn.$l.get('txtLoadModuleBasePath').value = appSettings.LoadModuleBasePath;
                syn.$l.get('txtLoadModules').value = appSettings.LoadModules.join(', ');

                syn.$l.get('ddlRunningEnvironment').value = appSettings.RunningEnvironment;
                syn.$l.get('chkUseResponseComression').checked = $string.toBoolean(appSettings.UseResponseComression);
                syn.$l.get('chkUseForwardProxy').checked = $string.toBoolean(appSettings.UseForwardProxy);
                syn.$l.get('chkUseSameIPProxy').checked = $string.toBoolean(appSettings.UseSameIPProxy);

                syn.$l.get('chkEnableSecurityHeaders').checked = $string.toBoolean(appSettings.Security.EnableSecurityHeaders);
                syn.$l.get('ddlXFrameOptions').value = appSettings.Security.XFrameOptions;
                syn.$l.get('chkEnablePublicCorsPolicy').checked = $string.toBoolean(appSettings.Security.EnablePublicCorsPolicy);
                syn.$l.get('chkExposeSecretValues').checked = $string.toBoolean(appSettings.Security.ExposeSecretValues);
                syn.$l.get('chkWarnOnWildcardAllowClientIP').checked = $string.toBoolean(appSettings.Security.WarnOnWildcardAllowClientIP);
                syn.$l.get('txtMaxContractSyncFileBytes').value = $string.isNumber(appSettings.Security.MaxContractSyncFileBytes) == true ? $string.toNumber(appSettings.Security.MaxContractSyncFileBytes) : 10485760;

                syn.$l.get('txtWithOrigins').value = appSettings.WithOrigins.join(', ');

                syn.$l.get('chkIsSession').checked = $string.toBoolean(appSettings.SessionState.IsSession);
                syn.$l.get('txtSessionCookieName').value = appSettings.SessionState.SessionCookieName;
                syn.$l.get('ddlCacheType').value = appSettings.SessionState.CacheType;
                syn.$l.get('txtMySqlConnectionString').value = appSettings.SessionState.MySqlConnectionString;
                syn.$l.get('txtMySqlSchemaName').value = appSettings.SessionState.MySqlSchemaName;
                syn.$l.get('txtMySqlTableName').value = appSettings.SessionState.MySqlTableName;
                syn.$l.get('txtSqlServerConnectionString').value = appSettings.SessionState.SqlServerConnectionString;
                syn.$l.get('txtSqlServerSchemaName').value = appSettings.SessionState.SqlServerSchemaName;
                syn.$l.get('txtSqlServerTableName').value = appSettings.SessionState.SqlServerTableName;

                syn.$l.get('txtCookiePrefixName').value = appSettings.CookiePrefixName;
                syn.$l.get('txtUserSignExpire').value = $string.isNumber(appSettings.UserSignExpire) == true ? $string.toNumber(appSettings.UserSignExpire) : -1;
                syn.$l.get('txtOriginPort').value = $string.isNumber(appSettings.OriginPort) == true ? $string.toNumber(appSettings.OriginPort) : 80;
                syn.$l.get('txtServerPort').value = $string.isNumber(appSettings.ServerPort) == true ? $string.toNumber(appSettings.ServerPort) : 8421;
                syn.$l.get('txtServerDevCertSslPort').value = $string.isNumber(appSettings.ServerDevCertSslPort) == true ? $string.toNumber(appSettings.ServerDevCertSslPort) : 8443;
                syn.$l.get('txtServerDevCertFilePath').value = appSettings.ServerDevCertFilePath;
                syn.$l.get('txtServerDevCertPassword').value = appSettings.ServerDevCertPassword;

                syn.$l.get('txtSerilogUsing').value = serilog.Using.join(', ');
                syn.$l.get('ddlMinimumLevelDefault').value = serilog.MinimumLevel.Default;
                syn.$l.get('txtSerilogEnrich').value = serilog.Enrich.join(', ');

                syn.$l.get('chkDisableStringReuse').checked = $string.toBoolean(kestrel.DisableStringReuse);
                syn.$l.get('txtMaxConcurrentConnections').value = $object.isNullOrUndefined(kestrel.Limits.MaxConcurrentConnections) == true ? '' : kestrel.Limits.MaxConcurrentConnections;
                syn.$l.get('txtMaxConcurrentUpgradedConnections').value = $object.isNullOrUndefined(kestrel.Limits.MaxConcurrentUpgradedConnections) == true ? '' : kestrel.Limits.MaxConcurrentUpgradedConnections;
                syn.$l.get('txtMaxRequestBodySize').value = $string.isNumber(kestrel.Limits.MaxRequestBodySize) == true ? $string.toNumber(kestrel.Limits.MaxRequestBodySize) : 104857600;
                syn.$l.get('txtKeepAliveTimeout').value = kestrel.Limits.KeepAliveTimeout;

                $this.method.sectionRender('LoadModuleLicense');
                $this.method.sectionRender('MinimumLevelOverride');
                $this.method.sectionRender('WriteTo');
            } catch (error) {
                syn.$w.notify('error', `JSON을 적용하지 못했습니다. ${error.message}`);
                syn.$l.eventLog('$this.event.btnApplyConfig_click', error.stack, 'Error');
            }
        },

        btnJsonView_click() {
            if ($object.isNullOrUndefined($this.prop.appConfig) == false) {
                try {
                    var appSettings = $this.prop.appConfig.AppSettings;
                    var serilog = $this.prop.appConfig.Serilog;
                    var kestrel = $this.prop.appConfig.Kestrel;

                    appSettings.ProxyBasePath = syn.$l.get('txtProxyBasePath').value;
                    appSettings.HostAccessID = syn.$l.get('txtHostAccessID').value;
                    appSettings.SystemID = syn.$l.get('txtSystemID').value;
                    appSettings.ApplicationID = syn.$l.get('txtApplicationID').value;
                    appSettings.ProgramName = syn.$l.get('txtProgramName').value;
                    appSettings.HostName = syn.$l.get('txtHostName').value;
                    appSettings.InstallType = syn.$l.get('ddlInstallType').value;
                    appSettings.BusinessServerUrl = syn.$l.get('txtBusinessServerUrl').value;
                    appSettings.FindGlobalIDServer = syn.$l.get('txtFindGlobalIDServer').value;

                    appSettings.DomainAPIServer.ServerID = syn.$l.get('txtDomServerID').value;
                    appSettings.DomainAPIServer.ServerType = syn.$l.get('txtDomServerType').value;
                    appSettings.DomainAPIServer.Protocol = syn.$l.get('txtDomProtocol').value;
                    appSettings.DomainAPIServer.IP = syn.$l.get('txtDomIP').value;
                    appSettings.DomainAPIServer.Port = syn.$l.get('txtDomPort').value;
                    appSettings.DomainAPIServer.Path = syn.$l.get('txtDomPath').value;
                    appSettings.DomainAPIServer.ClientIP = syn.$l.get('txtDomClientIP').value;

                    appSettings.ForwardProxyIP = $array.split(syn.$l.get('txtForwardProxyIP').value);
                    appSettings.IsTenantFunction = syn.$l.get('chkIsTenantFunction').checked;
                    appSettings.IsExceptionDetailText = syn.$l.get('chkIsExceptionDetailText').checked;
                    appSettings.IsEnabledDevAutoSignIn = syn.$l.get('chkIsEnabledDevAutoSignIn').checked;
                    appSettings.ContractRequestPath = syn.$l.get('txtContractRequestPath').value;
                    appSettings.TenantAppRequestPath = syn.$l.get('txtTenantAppRequestPath').value;
                    appSettings.TenantAppBasePath = syn.$l.get('txtTenantAppBasePath').value;
                    appSettings.BatchProgramBasePath = syn.$l.get('txtBatchProgramBasePath').value;
                    appSettings.CreateAppTempPath = syn.$l.get('txtCreateAppTempPath').value;
                    appSettings.ForbesBasePath = syn.$l.get('txtForbesBasePath').value;
                    appSettings.IsModulePurgeContract = syn.$l.get('chkIsModulePurgeContract').checked;
                    appSettings.IsEnabledCSP = syn.$l.get('chkIsEnabledCSP').checked;
                    appSettings.LoadModuleBasePath = syn.$l.get('txtLoadModuleBasePath').value;
                    appSettings.LoadModules = $array.split(syn.$l.get('txtLoadModules').value);

                    appSettings.RunningEnvironment = syn.$l.get('ddlRunningEnvironment').value;
                    appSettings.UseResponseComression = syn.$l.get('chkUseResponseComression').checked;
                    appSettings.UseForwardProxy = syn.$l.get('chkUseForwardProxy').checked;
                    appSettings.UseSameIPProxy = syn.$l.get('chkUseSameIPProxy').checked;

                    appSettings.Security.EnableSecurityHeaders = syn.$l.get('chkEnableSecurityHeaders').checked;
                    appSettings.Security.XFrameOptions = syn.$l.get('ddlXFrameOptions').value;
                    appSettings.Security.EnablePublicCorsPolicy = syn.$l.get('chkEnablePublicCorsPolicy').checked;
                    appSettings.Security.ExposeSecretValues = syn.$l.get('chkExposeSecretValues').checked;
                    appSettings.Security.WarnOnWildcardAllowClientIP = syn.$l.get('chkWarnOnWildcardAllowClientIP').checked;
                    appSettings.Security.MaxContractSyncFileBytes = $string.isNumber(syn.$l.get('txtMaxContractSyncFileBytes').value) == true ? $string.toNumber(syn.$l.get('txtMaxContractSyncFileBytes').value) : 10485760;

                    appSettings.WithOrigins = $array.split(syn.$l.get('txtWithOrigins').value);

                    appSettings.SessionState.IsSession = syn.$l.get('chkIsSession').checked;
                    appSettings.SessionState.SessionCookieName = syn.$l.get('txtSessionCookieName').value;
                    appSettings.SessionState.CacheType = syn.$l.get('ddlCacheType').value;
                    appSettings.SessionState.MySqlConnectionString = syn.$l.get('txtMySqlConnectionString').value;
                    appSettings.SessionState.MySqlSchemaName = syn.$l.get('txtMySqlSchemaName').value;
                    appSettings.SessionState.MySqlTableName = syn.$l.get('txtMySqlTableName').value;
                    appSettings.SessionState.SqlServerConnectionString = syn.$l.get('txtSqlServerConnectionString').value;
                    appSettings.SessionState.SqlServerSchemaName = syn.$l.get('txtSqlServerSchemaName').value;
                    appSettings.SessionState.SqlServerTableName = syn.$l.get('txtSqlServerTableName').value;

                    appSettings.CookiePrefixName = syn.$l.get('txtCookiePrefixName').value;
                    appSettings.UserSignExpire = $string.isNumber(syn.$l.get('txtUserSignExpire').value) == true ? $string.toNumber(syn.$l.get('txtUserSignExpire').value) : -1;
                    appSettings.OriginPort = $string.isNumber(syn.$l.get('txtOriginPort').value) == true ? $string.toNumber(syn.$l.get('txtOriginPort').value) : 80;
                    appSettings.ServerPort = $string.isNumber(syn.$l.get('txtServerPort').value) == true ? $string.toNumber(syn.$l.get('txtServerPort').value) : 8421;
                    appSettings.ServerDevCertSslPort = $string.isNumber(syn.$l.get('txtServerDevCertSslPort').value) == true ? $string.toNumber(syn.$l.get('txtServerDevCertSslPort').value) : 8443;
                    appSettings.ServerDevCertFilePath = syn.$l.get('txtServerDevCertFilePath').value;
                    appSettings.ServerDevCertPassword = syn.$l.get('txtServerDevCertPassword').value;

                    serilog.Using = $array.split(syn.$l.get('txtSerilogUsing').value);
                    serilog.MinimumLevel.Default = syn.$l.get('ddlMinimumLevelDefault').value;
                    serilog.Enrich = $array.split(syn.$l.get('txtSerilogEnrich').value);

                    kestrel.DisableStringReuse = syn.$l.get('chkDisableStringReuse').checked;
                    kestrel.Limits.MaxConcurrentConnections = $string.isNullOrEmpty(syn.$l.get('txtMaxConcurrentConnections').value) == true ? null : $string.toNumber(syn.$l.get('txtMaxConcurrentConnections').value);
                    kestrel.Limits.MaxConcurrentUpgradedConnections = $string.isNullOrEmpty(syn.$l.get('txtMaxConcurrentUpgradedConnections').value) == true ? null : $string.toNumber(syn.$l.get('txtMaxConcurrentUpgradedConnections').value);
                    kestrel.Limits.MaxRequestBodySize = $string.isNumber(syn.$l.get('txtMaxRequestBodySize').value) == true ? $string.toNumber(syn.$l.get('txtMaxRequestBodySize').value) : 104857600;
                    kestrel.Limits.KeepAliveTimeout = syn.$l.get('txtKeepAliveTimeout').value;

                    syn.$l.get('txtJsonView').value = JSON.stringify($this.prop.appConfig, null, 4);
                } catch (error) {
                    syn.$l.get('txtJsonView').value = '';
                    syn.$l.eventLog('$this.event.btnJsonView_click', error.stack, 'Error');
                }
            }
        },

        btnLoadModuleLicense_click() {
            $this.method.showModal('LoadModuleLicense', {
                moduleID: '',
                title: 'LoadModuleLicense 추가'
            });
        },

        btnMinimumLevelOverride_click() {
            $this.method.showModal('MinimumLevelOverride', {
                key: '',
                value: '',
                title: 'MinimumLevel.Override 추가'
            });
        },

        btnWriteTo_click() {
            $this.method.showModal('WriteTo', {
                name: '',
                title: 'WriteTo 추가'
            });
        },

        btnActionEdit_click(evt) {
            var baseTableID = this.closest('table').id;
            if (baseTableID == 'tblLoadModuleLicense') {
                var baseEL = this.closest('tr');
                var moduleID = baseEL.getAttribute('syn-value');
                $this.method.showModal('LoadModuleLicense', {
                    moduleID: moduleID,
                    title: 'LoadModuleLicense 수정'
                });
            }
            else if (baseTableID == 'tblMinimumLevelOverride') {
                var baseEL = this.closest('tr');
                var key = baseEL.getAttribute('syn-value');
                var value = $this.prop.appConfig.Serilog.MinimumLevel.Override[key];
                $this.method.showModal('MinimumLevelOverride', {
                    key: key,
                    value: value,
                    title: 'MinimumLevel.Override 수정'
                });
            }
            else if (baseTableID == 'tblWriteTo') {
                var baseEL = this.closest('tr');
                var name = baseEL.getAttribute('syn-value');
                $this.method.showModal('WriteTo', {
                    name: name,
                    title: 'WriteTo 수정'
                });
            }
        },

        btnActionDelete_click(evt) {
            var baseTableID = this.closest('table').id;
            if (baseTableID == 'tblLoadModuleLicense') {
                var baseEL = this.closest('tr');
                var moduleID = baseEL.getAttribute('syn-value');
                delete $this.prop.appConfig.AppSettings.LoadModuleLicenses[moduleID];
                $this.method.sectionRender('LoadModuleLicense');
            }
            else if (baseTableID == 'tblMinimumLevelOverride') {
                var baseEL = this.closest('tr');
                var key = baseEL.getAttribute('syn-value');
                delete $this.prop.appConfig.Serilog.MinimumLevel.Override[key];
                $this.method.sectionRender('MinimumLevelOverride');
            }
            else if (baseTableID == 'tblWriteTo') {
                var baseEL = this.closest('tr');
                var name = baseEL.getAttribute('syn-value');
                var items = $this.prop.appConfig.Serilog.WriteTo;
                var index = items.findIndex((item) => item.Name == name);
                if (index > -1) {
                    $array.removeAt(items, index);
                    $this.method.sectionRender('WriteTo');
                }
            }
        },

        btnManageLoadModuleLicense_click(evt) {
            var baseModuleID = syn.$l.get('txtBaseModuleID_License').value;
            var moduleID = syn.$l.get('txtModuleID_License').value.trim();
            var companyName = syn.$l.get('txtCompanyName_License').value.trim();
            var productName = syn.$l.get('txtProductName_License').value.trim();
            var signKey = syn.$l.get('txtSignKey_License').value.trim();

            if (moduleID == '' || companyName == '' || productName == '' || signKey == '') {
                syn.$w.alert('필수 항목을 입력하세요.');
                return;
            }

            var licenses = $this.prop.appConfig.AppSettings.LoadModuleLicenses;
            if (baseModuleID == '') {
                if (Object.prototype.hasOwnProperty.call(licenses, moduleID) == true) {
                    syn.$w.notify('information', `중복된 ModuleID를 입력 할 수 없습니다.`);
                    return;
                }
            }
            else if (baseModuleID != moduleID) {
                delete licenses[baseModuleID];
            }

            licenses[moduleID] = {
                CompanyName: companyName,
                ProductName: productName,
                AuthorizedHost: syn.$l.get('txtAuthorizedHost_License').value.trim(),
                Key: syn.$l.get('txtKey_License').value.trim(),
                CreatedAt: syn.$l.get('txtCreatedAt_License').value.trim(),
                ExpiresAt: $string.isNullOrEmpty(syn.$l.get('txtExpiresAt_License').value) == true ? null : syn.$l.get('txtExpiresAt_License').value.trim(),
                Environment: syn.$l.get('ddlEnvironment_License').value,
                SignKey: signKey
            };

            $this.method.sectionRender('LoadModuleLicense');
            $this.prop.modal.hide();
        },

        btnManageMinimumLevelOverride_click(evt) {
            var baseKey = syn.$l.get('txtBaseDataID_MinimumLevelOverride').value;
            var key = syn.$l.get('txtKey_MinimumLevelOverride').value.trim();
            var value = syn.$l.get('ddlValue_MinimumLevelOverride').value;

            if (key == '') {
                syn.$w.alert('필수 항목을 입력하세요.');
                return;
            }

            var overrides = $this.prop.appConfig.Serilog.MinimumLevel.Override;
            if (baseKey == '') {
                if (Object.prototype.hasOwnProperty.call(overrides, key) == true) {
                    syn.$w.notify('information', `중복된 네임스페이스를 입력 할 수 없습니다.`);
                    return;
                }
            }
            else if (baseKey != key) {
                delete overrides[baseKey];
            }

            overrides[key] = value;

            $this.method.sectionRender('MinimumLevelOverride');
            $this.prop.modal.hide();
        },

        btnManageWriteTo_click(evt) {
            var baseName = syn.$l.get('txtBaseDataID_WriteTo').value;
            var name = syn.$l.get('txtName_WriteTo').value.trim();
            var argsText = syn.$l.get('txtArgs_WriteTo').value.trim();

            if (name == '' || argsText == '') {
                syn.$w.alert('필수 항목을 입력하세요.');
                return;
            }

            var args;
            try {
                args = JSON.parse(argsText);
            } catch (error) {
                syn.$w.alert('Args 항목은 올바른 JSON 형식이어야 합니다.');
                return;
            }

            var items = $this.prop.appConfig.Serilog.WriteTo;
            if (baseName == '') {
                if (items.some((item) => item.Name == name) == true) {
                    syn.$w.notify('information', `중복된 Name을 입력 할 수 없습니다.`);
                    return;
                }
                items.push({ Name: name, Args: args });
            }
            else {
                var index = items.findIndex((item) => item.Name == baseName);
                if (index > -1) {
                    items[index] = { Name: name, Args: args };
                }
            }

            $this.method.sectionRender('WriteTo');
            $this.prop.modal.hide();
        }
    },

    method: {
        showModal(elID, options) {
            if (elID == 'LoadModuleLicense') {
                var el = syn.$l.get('mdlLoadModuleLicense');
                if (el && syn.$m.hasClass(el, 'show') == false) {
                    options = syn.$w.argumentsExtend({
                        moduleID: '',
                        title: ''
                    }, options || {});

                    syn.$l.get('lblTitle_License').innerText = options.title;

                    var data = null;
                    if ($string.isNullOrEmpty(options.moduleID) == false) {
                        data = $this.prop.appConfig.AppSettings.LoadModuleLicenses[options.moduleID];
                    }

                    if (data) {
                        syn.$l.get('txtBaseModuleID_License').value = options.moduleID;
                        syn.$l.get('txtModuleID_License').value = options.moduleID;
                        syn.$l.get('txtCompanyName_License').value = data.CompanyName;
                        syn.$l.get('txtProductName_License').value = data.ProductName;
                        syn.$l.get('txtAuthorizedHost_License').value = data.AuthorizedHost;
                        syn.$l.get('txtKey_License').value = data.Key;
                        syn.$l.get('txtCreatedAt_License').value = data.CreatedAt;
                        syn.$l.get('txtExpiresAt_License').value = $object.isNullOrUndefined(data.ExpiresAt) == true ? '' : data.ExpiresAt;
                        syn.$l.get('ddlEnvironment_License').value = data.Environment;
                        syn.$l.get('txtSignKey_License').value = data.SignKey;
                    }
                    else {
                        syn.$l.get('txtBaseModuleID_License').value = '';
                        syn.$l.get('txtModuleID_License').value = '';
                        syn.$l.get('txtCompanyName_License').value = '';
                        syn.$l.get('txtProductName_License').value = '';
                        syn.$l.get('txtAuthorizedHost_License').value = '';
                        syn.$l.get('txtKey_License').value = '';
                        syn.$l.get('txtCreatedAt_License').value = '';
                        syn.$l.get('txtExpiresAt_License').value = '';
                        syn.$l.get('ddlEnvironment_License').value = 'Production';
                        syn.$l.get('txtSignKey_License').value = '';
                    }

                    $this.prop.modal = new tabler.Modal(el);
                    $this.prop.modal.show();

                    setTimeout(() => { syn.$l.get('txtModuleID_License').focus(); }, 100);
                }
            }
            else if (elID == 'MinimumLevelOverride') {
                var el = syn.$l.get('mdlMinimumLevelOverride');
                if (el && syn.$m.hasClass(el, 'show') == false) {
                    options = syn.$w.argumentsExtend({
                        key: '',
                        value: '',
                        title: ''
                    }, options || {});

                    syn.$l.get('lblTitle_MinimumLevelOverride').innerText = options.title;
                    syn.$l.get('txtBaseDataID_MinimumLevelOverride').value = options.key;
                    syn.$l.get('txtKey_MinimumLevelOverride').value = options.key;
                    syn.$l.get('ddlValue_MinimumLevelOverride').value = $string.isNullOrEmpty(options.value) == true ? 'Information' : options.value;

                    $this.prop.modal = new tabler.Modal(el);
                    $this.prop.modal.show();

                    setTimeout(() => { syn.$l.get('txtKey_MinimumLevelOverride').focus(); }, 100);
                }
            }
            else if (elID == 'WriteTo') {
                var el = syn.$l.get('mdlWriteTo');
                if (el && syn.$m.hasClass(el, 'show') == false) {
                    options = syn.$w.argumentsExtend({
                        name: '',
                        title: ''
                    }, options || {});

                    syn.$l.get('lblTitle_WriteTo').innerText = options.title;

                    var data = null;
                    if ($string.isNullOrEmpty(options.name) == false) {
                        data = $this.prop.appConfig.Serilog.WriteTo.find((item) => item.Name == options.name);
                    }

                    if (data) {
                        syn.$l.get('txtBaseDataID_WriteTo').value = data.Name;
                        syn.$l.get('txtName_WriteTo').value = data.Name;
                        syn.$l.get('txtArgs_WriteTo').value = JSON.stringify(data.Args, null, 4);
                    }
                    else {
                        syn.$l.get('txtBaseDataID_WriteTo').value = '';
                        syn.$l.get('txtName_WriteTo').value = '';
                        syn.$l.get('txtArgs_WriteTo').value = '{\n    \n}';
                    }

                    $this.prop.modal = new tabler.Modal(el);
                    $this.prop.modal.show();

                    setTimeout(() => { syn.$l.get('txtName_WriteTo').focus(); }, 100);
                }
            }
        },

        sectionRender(sectionID) {
            if (sectionID == 'LoadModuleLicense') {
                var licenses = $this.prop.appConfig.AppSettings.LoadModuleLicenses;
                var dataSource = { items: [] };

                for (const [moduleID, data] of Object.entries(licenses)) {
                    dataSource.items.push({
                        ModuleID: moduleID,
                        CompanyName: data.CompanyName,
                        ProductName: data.ProductName,
                        Environment: data.Environment
                    });
                }

                $this.method.drawHtmlTemplate('tblLoadModuleLicenseItems', 'tplLoadModuleLicenseItem', dataSource);
            }
            else if (sectionID == 'MinimumLevelOverride') {
                var dataSource = { items: [] };

                for (const [key, value] of Object.entries($this.prop.appConfig.Serilog.MinimumLevel.Override)) {
                    dataSource.items.push({
                        Key: key,
                        Value: value
                    });
                }

                $this.method.drawHtmlTemplate('tblMinimumLevelOverrideItems', 'tplKeyValueItem', dataSource);
            }
            else if (sectionID == 'WriteTo') {
                var items = $this.prop.appConfig.Serilog.WriteTo;
                var dataSource = {
                    items: items.map((item) => ({
                        Name: item.Name,
                        Args: JSON.stringify(item.Args)
                    }))
                };

                $this.method.drawHtmlTemplate('tblWriteToItems', 'tplWriteToItem', dataSource);
            }
        },

        drawHtmlTemplate(elID, templateID, dataSource) {
            var drawEl = syn.$l.get(elID);
            var tplEL = syn.$l.get(templateID);

            try {
                drawEl.innerHTML = '';
                var templateHtml = tplEL.innerHTML;
                drawEl.innerHTML = Mustache.render(templateHtml, dataSource);
            } catch (error) {
                syn.$l.eventLog('$this.method.drawHtmlTemplate', error.stack, 'Error');
            }
        }
    }
}
