var fs = require('fs');
var syn = require('syn');
var axios = require('axios');

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
	GF01: async (moduleID, parameters, dataContext) => {
        var applicationID = 'HDS'; // JSON.parse(parameters)[0].Value;
		var awaitMS = 25; // parseInt(JSON.parse(parameters)[1].Value);

        // var $this = syn.initializeModuleScript(moduleFileName, dataSourceMap);
		// syn.$l.moduleEventLog(moduleID, 'G01', 'ApplicationID {0} - START'.format(applicationID), 'Debug');

		await sleep(awaitMS);

		// var directObject = {
        //     ProgramID: 'HDS',
		// 	BusinessID: 'ZZW',
		// 	SystemID: 'BP01',
		// 	TransactionID: 'TST020',
		// 	FunctionID: 'G01',
		// 	InputObjects: [
		// 		// { prop: 'ApplicationID', val: '' },
		// 		// { prop: 'ProjectID', val: '' },
		// 		// { prop: 'TransactionID', val: '' }
		// 	]
		// };
		// 
		// $w.transactionDirect(directObject, function (responseData, addtionalData) {
		// 	debugger;
		// });

		var result = {
			DataTable1: [
				{
					GROUPCODE: 'HS001',
					CODE: 'HJ',
					CODENAME: '학점은행제4',
					FULLNM: '',
					SORTINGORDER: '3',
					VALUE1: '',
					VALUE2: '',
					VALUE3: '',
					VALUE4: '',
					USEYN: '1',
					REGDT: '2010-04-22 오후 2:54:58',
					REGUSER: '1',
					EDTDT: '2010-05-18 오후 1:09:18',
					EDTUSER: 'bravo'
				}
			]
		};

		// syn.$l.moduleEventLog(moduleID, 'G01', 'ApplicationID {0} - START'.format(applicationID), 'Debug');
		return result;
		// callback(null, result);
	},
    LF01: (callback, moduleID, parameters, dataContext) => {
		fs.readFile('appstartup-update.txt', 'utf8', function (err, data) {
			var result = {
				DataTable1: [
					{
						GROUPCODE: 'HS001',
						CODE: 'HJ',
						CODENAME: '학점은행제',
						FULLNM: null,
						SORTINGORDER: 3.0,
						VALUE1: null,
						VALUE2: null,
						VALUE3: null,
						VALUE4: null,
						USEYN: '1',
						REGDT: '2010-04-22T14:54:58',
						REGUSER: '1',
						EDTDT: '2010-05-18T13:09:18',
						EDTUSER: 'bravo'
					},
					{
						GROUPCODE: 'HS001',
						CODE: 'HS',
						CODENAME: '학사관리',
						FULLNM: null,
						SORTINGORDER: 1.0,
						VALUE1: null,
						VALUE2: null,
						VALUE3: null,
						VALUE4: null,
						USEYN: '1',
						REGDT: '2010-04-22T14:54:58',
						REGUSER: '1',
						EDTDT: '2010-05-18T13:09:18',
						EDTUSER: 'bravo'
					},
					{
						GROUPCODE: 'HS001',
						CODE: 'PS',
						CODENAME: '평생대학원',
						FULLNM: null,
						SORTINGORDER: 2.0,
						VALUE1: null,
						VALUE2: null,
						VALUE3: null,
						VALUE4: null,
						USEYN: '1',
						REGDT: '2010-04-22T14:54:58',
						REGUSER: '1',
						EDTDT: '2010-05-18T13:09:18',
						EDTUSER: 'bravo'
					}
				]
			};

			callback(null, result);
		});
	},
	doSomething1: async (arg1, arg2, arg3, arg4) => {
		return await axios.get('https://test.com/', {
			headers: {
				'authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
			},
			params: {
				foo: 'bar'
			}
		});
	},
	doSomething2: async (arg1, arg2, arg3, arg4) => {
		return await axios.post('https://test.com/', {
			headers: {
				'authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
			},
			params: {
				foo: 'bar'
			}
		});
	},
    doSomething3: async (moduleID, parameters, dataContext) => {
		var requestData = {};
		return await axios.post('https://test.com/', requestData, {
			headers: {
				'Content-Type': 'application/json'
			}
		});
	},
	doSomething4: (callback, moduleID, parameters, dataContext) => {
		var selectedFile = fs.createReadStream('filepath...');
		selectedFile.on('end', function () {
			var formData = new FormData();
			formData.append('uploadfile', selectedFile);

			return axios.post('https://test.com/', formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			});
		});
	},
	doSomethingElse: async (arg1) => {
		return result;
	}
}
