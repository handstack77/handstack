'use strict';
let $syn_config = {
    prop: {
        defaultConfig: {
            "SystemID": "HANDSTACK",
            "ApplicationID": "HDS",
            "ProjectID": "SYS",
            "SystemVersion": "1.0.0",
            "TransactionTimeout": 180000,
            "HostName": "WebClient",
            "UIEventLogLevel": "Verbose",
            "IsLocaleTranslations": false,
            "LocaleAssetUrl": "/assets/shared/language/",
            "AssetsCachingID": "cache-id",
            "IsClientCaching": true,
            "IsDebugMode": false,
            "IsBundleLoad": false,
            "IsReportifyModule": false,
            "ContractRequestPath": "view",
            "TenantAppRequestPath": "app",
            "SharedAssetUrl": "/assets/shared/",
            "IsApiFindServer": false,
            "DiscoveryApiServerUrl": "",
            "ReportServer": "",
            "FileManagerServer": "http://localhost:8421",
            "FindClientIPServer": "/checkip",
            "FindGlobalIDServer": "",
            "FileServerType": "L",
            "FileBusinessIDSource": "None",
            "CookiePrefixName": "HandStack",
            "Environment": "Development",
            "DomainAPIServer": {
                "ServerID": "SERVERD01",
                "ServerType": "D",
                "Protocol": "http",
                "IP": "localhost",
                "Port": "8421",
                "Path": "/transact/api/transaction/execute",
                "ClientIP": "localhost"
            },
            "Program": {
                "ProgramName": "ack",
                "ProgramVersion": "1.0.0",
                "LanguageID": "ko",
                "LocaleID": "ko-KR",
                "BranchCode": ""
            },
            "Transaction": {
                "ProtocolVersion": "001",
                "SimulationType": "P",
                "DataFormat": "J",
                "MachineTypeID": "WEB",
                "EncryptionType": "P",
                "EncryptionKey": "G",
                "CompressionYN": "N"
            },
            "EnvironmentSetting": {
                "Application": {
                    "LoaderPath": "/js/syn.domain.js",
                    "CodeHelpID": ""
                },
                "Definition": {
                    "BindingAction": "Append",
                    "Styles": [],
                    "Scripts": [],
                    "Controls": []
                }
            },
            "ModuleID": "",
            "IsProxyServe": false,
            "ProxyPathName": ""
        },
        synConfig: null
    },

    hook: {
        pageLoad() {
            $this.prop.synConfig = $object.clone($this.prop.defaultConfig, true);

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
                $this.prop.synConfig = syn.$w.argumentsExtend($this.prop.defaultConfig, jsonConfig);

                syn.$l.get('txtSystemID').value = $this.prop.synConfig.SystemID;
                syn.$l.get('txtApplicationID').value = $this.prop.synConfig.ApplicationID;
                syn.$l.get('txtProjectID').value = $this.prop.synConfig.ProjectID;
                syn.$l.get('txtSystemVersion').value = $this.prop.synConfig.SystemVersion;
                syn.$l.get('txtTransactionTimeout').value = $string.isNumber($this.prop.synConfig.TransactionTimeout) == true ? $string.toNumber($this.prop.synConfig.TransactionTimeout) : 180000;
                syn.$l.get('txtHostName').value = $this.prop.synConfig.HostName;
                syn.$l.get('ddlUIEventLogLevel').value = $this.prop.synConfig.UIEventLogLevel;
                syn.$l.get('chkIsLocaleTranslations').checked = $string.toBoolean($this.prop.synConfig.IsLocaleTranslations);
                syn.$l.get('txtLocaleAssetUrl').value = $this.prop.synConfig.LocaleAssetUrl;
                syn.$l.get('txtAssetsCachingID').value = $this.prop.synConfig.AssetsCachingID;
                syn.$l.get('chkIsClientCaching').checked = $string.toBoolean($this.prop.synConfig.IsClientCaching);
                syn.$l.get('chkIsDebugMode').checked = $string.toBoolean($this.prop.synConfig.IsDebugMode);
                syn.$l.get('chkIsBundleLoad').checked = $string.toBoolean($this.prop.synConfig.IsBundleLoad);
                syn.$l.get('chkIsReportifyModule').checked = $string.toBoolean($this.prop.synConfig.IsReportifyModule);
                syn.$l.get('txtContractRequestPath').value = $this.prop.synConfig.ContractRequestPath;
                syn.$l.get('txtTenantAppRequestPath').value = $this.prop.synConfig.TenantAppRequestPath;
                syn.$l.get('txtSharedAssetUrl').value = $this.prop.synConfig.SharedAssetUrl;
                syn.$l.get('chkIsApiFindServer').checked = $string.toBoolean($this.prop.synConfig.IsApiFindServer);
                syn.$l.get('txtDiscoveryApiServerUrl').value = $this.prop.synConfig.DiscoveryApiServerUrl;
                syn.$l.get('txtReportServer').value = $this.prop.synConfig.ReportServer;
                syn.$l.get('txtFileManagerServer').value = $this.prop.synConfig.FileManagerServer;
                syn.$l.get('txtFindClientIPServer').value = $this.prop.synConfig.FindClientIPServer;
                syn.$l.get('txtFindGlobalIDServer').value = $this.prop.synConfig.FindGlobalIDServer;
                syn.$l.get('ddlFileServerType').value = $this.prop.synConfig.FileServerType;
                syn.$l.get('txtFileBusinessIDSource').value = $this.prop.synConfig.FileBusinessIDSource;
                syn.$l.get('txtCookiePrefixName').value = $this.prop.synConfig.CookiePrefixName;
                syn.$l.get('ddlEnvironment').value = $this.prop.synConfig.Environment;

                syn.$l.get('txtServerID').value = $this.prop.synConfig.DomainAPIServer.ServerID;
                syn.$l.get('txtServerType').value = $this.prop.synConfig.DomainAPIServer.ServerType;
                syn.$l.get('txtProtocol').value = $this.prop.synConfig.DomainAPIServer.Protocol;
                syn.$l.get('txtIP').value = $this.prop.synConfig.DomainAPIServer.IP;
                syn.$l.get('txtPort').value = $this.prop.synConfig.DomainAPIServer.Port;
                syn.$l.get('txtPath').value = $this.prop.synConfig.DomainAPIServer.Path;
                syn.$l.get('txtClientIP').value = $this.prop.synConfig.DomainAPIServer.ClientIP;

                syn.$l.get('txtProgramName').value = $this.prop.synConfig.Program.ProgramName;
                syn.$l.get('txtProgramVersion').value = $this.prop.synConfig.Program.ProgramVersion;
                syn.$l.get('txtLanguageID').value = $this.prop.synConfig.Program.LanguageID;
                syn.$l.get('txtLocaleID').value = $this.prop.synConfig.Program.LocaleID;
                syn.$l.get('txtBranchCode').value = $this.prop.synConfig.Program.BranchCode;

                syn.$l.get('txtProtocolVersion').value = $this.prop.synConfig.Transaction.ProtocolVersion;
                syn.$l.get('ddlSimulationType').value = $this.prop.synConfig.Transaction.SimulationType;
                syn.$l.get('ddlDataFormat').value = $this.prop.synConfig.Transaction.DataFormat;
                syn.$l.get('txtMachineTypeID').value = $this.prop.synConfig.Transaction.MachineTypeID;
                syn.$l.get('ddlEncryptionType').value = $this.prop.synConfig.Transaction.EncryptionType;
                syn.$l.get('ddlEncryptionKey').value = $this.prop.synConfig.Transaction.EncryptionKey;
                syn.$l.get('ddlCompressionYN').value = $this.prop.synConfig.Transaction.CompressionYN;

                syn.$l.get('txtApplicationLoaderPath').value = $this.prop.synConfig.EnvironmentSetting.Application.LoaderPath;
                syn.$l.get('txtApplicationCodeHelpID').value = $this.prop.synConfig.EnvironmentSetting.Application.CodeHelpID;
                syn.$l.get('ddlDefinitionBindingAction').value = $this.prop.synConfig.EnvironmentSetting.Definition.BindingAction;
                syn.$l.get('txtDefinitionStyles').value = $this.prop.synConfig.EnvironmentSetting.Definition.Styles.join(', ');
                syn.$l.get('txtDefinitionScripts').value = $this.prop.synConfig.EnvironmentSetting.Definition.Scripts.join(', ');
                syn.$l.get('txtDefinitionControls').value = $this.prop.synConfig.EnvironmentSetting.Definition.Controls.join(', ');

                syn.$l.get('txtModuleID').value = $this.prop.synConfig.ModuleID;
                syn.$l.get('chkIsProxyServe').checked = $string.toBoolean($this.prop.synConfig.IsProxyServe);
                syn.$l.get('txtProxyPathName').value = $this.prop.synConfig.ProxyPathName;
            } catch (error) {
                syn.$w.notify('error', `JSON을 적용하지 못했습니다. ${error.message}`);
                syn.$l.eventLog('$this.event.btnApplyConfig_click', error.stack, 'Error');
            }
        },

        btnJsonView_click() {
            if ($object.isNullOrUndefined($this.prop.synConfig) == false) {
                try {
                    $this.prop.synConfig.SystemID = syn.$l.get('txtSystemID').value;
                    $this.prop.synConfig.ApplicationID = syn.$l.get('txtApplicationID').value;
                    $this.prop.synConfig.ProjectID = syn.$l.get('txtProjectID').value;
                    $this.prop.synConfig.SystemVersion = syn.$l.get('txtSystemVersion').value;
                    $this.prop.synConfig.TransactionTimeout = $string.isNumber(syn.$l.get('txtTransactionTimeout').value) == true ? $string.toNumber(syn.$l.get('txtTransactionTimeout').value) : 180000;
                    $this.prop.synConfig.HostName = syn.$l.get('txtHostName').value;
                    $this.prop.synConfig.UIEventLogLevel = syn.$l.get('ddlUIEventLogLevel').value;
                    $this.prop.synConfig.IsLocaleTranslations = syn.$l.get('chkIsLocaleTranslations').checked;
                    $this.prop.synConfig.LocaleAssetUrl = syn.$l.get('txtLocaleAssetUrl').value;
                    $this.prop.synConfig.AssetsCachingID = syn.$l.get('txtAssetsCachingID').value;
                    $this.prop.synConfig.IsClientCaching = syn.$l.get('chkIsClientCaching').checked;
                    $this.prop.synConfig.IsDebugMode = syn.$l.get('chkIsDebugMode').checked;
                    $this.prop.synConfig.IsBundleLoad = syn.$l.get('chkIsBundleLoad').checked;
                    $this.prop.synConfig.IsReportifyModule = syn.$l.get('chkIsReportifyModule').checked;
                    $this.prop.synConfig.ContractRequestPath = syn.$l.get('txtContractRequestPath').value;
                    $this.prop.synConfig.TenantAppRequestPath = syn.$l.get('txtTenantAppRequestPath').value;
                    $this.prop.synConfig.SharedAssetUrl = syn.$l.get('txtSharedAssetUrl').value;
                    $this.prop.synConfig.IsApiFindServer = syn.$l.get('chkIsApiFindServer').checked;
                    $this.prop.synConfig.DiscoveryApiServerUrl = syn.$l.get('txtDiscoveryApiServerUrl').value;
                    $this.prop.synConfig.ReportServer = syn.$l.get('txtReportServer').value;
                    $this.prop.synConfig.FileManagerServer = syn.$l.get('txtFileManagerServer').value;
                    $this.prop.synConfig.FindClientIPServer = syn.$l.get('txtFindClientIPServer').value;
                    $this.prop.synConfig.FindGlobalIDServer = syn.$l.get('txtFindGlobalIDServer').value;
                    $this.prop.synConfig.FileServerType = syn.$l.get('ddlFileServerType').value;
                    $this.prop.synConfig.FileBusinessIDSource = syn.$l.get('txtFileBusinessIDSource').value;
                    $this.prop.synConfig.CookiePrefixName = syn.$l.get('txtCookiePrefixName').value;
                    $this.prop.synConfig.Environment = syn.$l.get('ddlEnvironment').value;

                    $this.prop.synConfig.DomainAPIServer.ServerID = syn.$l.get('txtServerID').value;
                    $this.prop.synConfig.DomainAPIServer.ServerType = syn.$l.get('txtServerType').value;
                    $this.prop.synConfig.DomainAPIServer.Protocol = syn.$l.get('txtProtocol').value;
                    $this.prop.synConfig.DomainAPIServer.IP = syn.$l.get('txtIP').value;
                    $this.prop.synConfig.DomainAPIServer.Port = syn.$l.get('txtPort').value;
                    $this.prop.synConfig.DomainAPIServer.Path = syn.$l.get('txtPath').value;
                    $this.prop.synConfig.DomainAPIServer.ClientIP = syn.$l.get('txtClientIP').value;

                    $this.prop.synConfig.Program.ProgramName = syn.$l.get('txtProgramName').value;
                    $this.prop.synConfig.Program.ProgramVersion = syn.$l.get('txtProgramVersion').value;
                    $this.prop.synConfig.Program.LanguageID = syn.$l.get('txtLanguageID').value;
                    $this.prop.synConfig.Program.LocaleID = syn.$l.get('txtLocaleID').value;
                    $this.prop.synConfig.Program.BranchCode = syn.$l.get('txtBranchCode').value;

                    $this.prop.synConfig.Transaction.ProtocolVersion = syn.$l.get('txtProtocolVersion').value;
                    $this.prop.synConfig.Transaction.SimulationType = syn.$l.get('ddlSimulationType').value;
                    $this.prop.synConfig.Transaction.DataFormat = syn.$l.get('ddlDataFormat').value;
                    $this.prop.synConfig.Transaction.MachineTypeID = syn.$l.get('txtMachineTypeID').value;
                    $this.prop.synConfig.Transaction.EncryptionType = syn.$l.get('ddlEncryptionType').value;
                    $this.prop.synConfig.Transaction.EncryptionKey = syn.$l.get('ddlEncryptionKey').value;
                    $this.prop.synConfig.Transaction.CompressionYN = syn.$l.get('ddlCompressionYN').value;

                    $this.prop.synConfig.EnvironmentSetting.Application.LoaderPath = syn.$l.get('txtApplicationLoaderPath').value;
                    $this.prop.synConfig.EnvironmentSetting.Application.CodeHelpID = syn.$l.get('txtApplicationCodeHelpID').value;
                    $this.prop.synConfig.EnvironmentSetting.Definition.BindingAction = syn.$l.get('ddlDefinitionBindingAction').value;
                    $this.prop.synConfig.EnvironmentSetting.Definition.Styles = $array.split(syn.$l.get('txtDefinitionStyles').value);
                    $this.prop.synConfig.EnvironmentSetting.Definition.Scripts = $array.split(syn.$l.get('txtDefinitionScripts').value);
                    $this.prop.synConfig.EnvironmentSetting.Definition.Controls = $array.split(syn.$l.get('txtDefinitionControls').value);

                    $this.prop.synConfig.ModuleID = syn.$l.get('txtModuleID').value;
                    $this.prop.synConfig.IsProxyServe = syn.$l.get('chkIsProxyServe').checked;
                    $this.prop.synConfig.ProxyPathName = syn.$l.get('txtProxyPathName').value;

                    syn.$l.get('txtJsonView').value = JSON.stringify($this.prop.synConfig, null, 4);
                } catch (error) {
                    syn.$l.get('txtJsonView').value = '';
                    syn.$l.eventLog('$this.event.btnJsonView_click', error.stack, 'Error');
                }
            }
        }
    }
}
