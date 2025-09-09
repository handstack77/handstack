const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

/*
-- GroupCode 목록 조회 예시
-- SQL Server
SELECT STRING_AGG(CodeID, ',') AS CodeList
FROM BaseCodeWHERE GroupCode = 'SYS000';

-- Oracle
SELECT LISTAGG(CodeID, ',') WITHIN GROUP (ORDER BY CodeID) AS CodeList 
FROM BaseCode WHERE GroupCode = 'SYS000';

-- MySQL
SELECT GROUP_CONCAT(CodeID ORDER BY CodeID SEPARATOR ',') AS CodeList 
FROM BaseCode WHERE GroupCode = 'SYS000';

-- PostgreSQL
SELECT STRING_AGG(CodeID, ',' ORDER BY CodeID) AS CodeList 
FROM BaseCode WHERE GroupCode = 'SYS000';

-- SQLite
SELECT GROUP_CONCAT(CodeID, ',') AS CodeList 
FROM BaseCode WHERE GroupCode = 'SYS000';
*/
// 명령행 인수 확인
if (process.argv.length < 3) {
    console.error('사용법: node code-data.js [GroupCodes] [출력경로]');
    console.error('예시: node code-data.js COM002,COM003,COM004 ./output');
    console.error('예시: node code-data.js COM002,COM003,COM004 %HANDSTACK_HOME%\modules\wwwroot\wwwroot\assets\shared\code');
    process.exit(1);
}

const groupCodesParam = process.argv[2];
const outputPath = process.argv[3] || './'; // 기본값은 현재 디렉토리

// GroupCode 값들을 콤마로 분리
const groupCodes = groupCodesParam.split(',').map(code => code.trim());

console.log(`처리할 GroupCode 목록: ${groupCodes.join(', ')}`);
console.log(`출력 경로: ${path.resolve(outputPath)}`);

// 출력 디렉토리가 존재하지 않으면 생성
if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
    console.log(`출력 디렉토리 생성: ${path.resolve(outputPath)}`);
}

// API 호출 함수
function callHandStackAPI(groupCode) {
    return new Promise((resolve, reject) => {
        // 요청 데이터 템플릿
        const requestData = {
            "action": "SYN",
            "kind": "BIZ",
            "clientTag": "HANDSTACK|WebClient|ack|D",
            "loadOptions": {
                "encryptionType": "P",
                "encryptionKey": "G",
                "platform": "Win32"
            },
            "requestID": "LD00000HDSSYSSYS010LD01HANDSTACKCODE",
            "version": "001",
            "environment": "D",
            "system": {
                "programID": "HDS",
                "moduleID": "arha",
                "version": "1.0.0",
                "routes": [
                    {
                        "systemID": "HANDSTACK",
                        "requestTick": Date.now()
                    }
                ],
                "localeID": "ko-KR",
                "hostName": "localhost:8421",
                "pathName": "/sample/TPL010.html"
            },
            "interface": {
                "devicePlatform": "browser",
                "interfaceID": "WEB",
                "sourceIP": "1.1.14.10",
                "sourcePort": 0,
                "sourceMAC": "",
                "connectionType": "4g",
                "timeout": 184430
            },
            "transaction": {
                "globalID": "LD00000HDSSYSSYS010LD01HANDSTACKCODE",
                "businessID": "SYS",
                "transactionID": "SYS010",
                "functionID": "LD01",
                "commandType": "D",
                "simulationType": "P",
                "terminalGroupID": "undefined|undefined",
                "operatorID": "",
                "screenID": "TPL010",
                "startTraceID": "syn.domain.$w.getDataSource",
                "dataFormat": "J",
                "compressionYN": "N"
            },
            "payLoad": {
                "property": {},
                "dataMapInterface": "",
                "dataMapCount": [1],
                "dataMapSet": [[
                    { "id": "ApplicationID", "value": "HDS" },
                    { "id": "CodeHelpID", "value": "CHP001" },
                    { "id": "Parameters", "value": `@LocaleID:ko-KR;@ProjectID:SYS;@ApplicationID:HDS;@GroupCode:${groupCode};` }
                ]],
                "dataMapSetRaw": []
            }
        };

        const postData = JSON.stringify(requestData);

        const options = {
            hostname: 'localhost',
            port: 8421,
            path: '/transact/api/transaction/execute',
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'Accept-Language': 'ko-KR',
                'Cache-Control': 'no-cache',
                'ClientTag': 'HANDSTACK',
                'Connection': 'keep-alive',
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'Origin': 'http://localhost:8421',
                'Pragma': 'no-cache',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'Server-BusinessID': 'SYS',
                'Server-SystemID': 'HANDSTACK',
                'User-Agent': 'CodeData/1.0.0 (Node.js)',
                'X-Requested-With': 'HandStack ServiceClient'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log(`\n=== ${groupCode} API 응답 ===`);
                    console.log(JSON.stringify(response, null, 2));

                    if (response.result &&
                        response.result.dataSet &&
                        response.result.dataSet.length > 0 &&
                        response.result.dataSet[0].value) {

                        const resultData = response.result.dataSet[0].value;
                        const filename = path.join(outputPath, `${groupCode}.json`);

                        fs.writeFileSync(filename, JSON.stringify(resultData, null, 2), 'utf8');

                        resolve({ groupCode, data: resultData, filename });
                    } else {
                        console.log(`\n⚠️ ${groupCode}: result.dataSet[0].value를 찾을 수 없습니다.`);
                        resolve({ groupCode, data: null, filename: null });
                    }
                } catch (error) {
                    console.error(`\n❌ ${groupCode} JSON 파싱 오류:`, error.message);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.error(`\n❌ ${groupCode} 요청 오류:`, error.message);
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

// 모든 GroupCode에 대해 순차적으로 API 호출
async function processAllGroupCodes() {
    console.log('\n🚀 HandStack API 클라이언트 시작');
    const results = [];

    for (const groupCode of groupCodes) {
        try {
            console.log(`\n📡 ${groupCode} 처리 중...`);
            const result = await callHandStackAPI(groupCode);
            results.push(result);

            // 다음 요청 전 잠시 대기 (서버 부하 방지)
            if (groupCodes.indexOf(groupCode) < groupCodes.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } catch (error) {
            console.error(`❌ ${groupCode} 처리 실패:`, error.message);
            results.push({ groupCode, error: error.message });
        }
    }

    // 최종 결과 요약
    console.log('\n📋 처리 결과 요약:');
    results.forEach(result => {
        if (result.error) {
            console.log(`❌ ${result.groupCode}: 오류 발생 - ${result.error}`);
        } else if (result.filename) {
            console.log(`✅ ${result.groupCode}: ${result.filename} 생성 완료`);
        } else {
            console.log(`⚠️ ${result.groupCode}: 데이터 없음`);
        }
    });

    console.log('\n🏁 모든 작업 완료');
}

// 실행
processAllGroupCodes().catch(error => {
    console.error('❌ 전체 프로세스 오류:', error.message);
    process.exit(1);
});
