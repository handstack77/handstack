export default {
    "ModuleID": "command",
    "Name": "command",
    "ModuleConfig": {
        "BusinessServerUrl": "http://localhost:8421/transact/api/transaction/execute",
        "ContractBasePath": [
            "../contracts/command"
        ],
        "DefaultCommandTimeout": 30,
        "DefaultMaxOutputBytes": 1048576,
        "IsContractFileWatching": true,
        "ModuleLogFilePath": "../log/command/module.log"
    }
};

