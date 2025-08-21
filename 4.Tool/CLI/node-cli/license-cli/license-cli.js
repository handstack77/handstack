#!/usr/bin/env node

/*
# 라이선스 생성과 함께 JavaScript 파일도 생성
node license-cli.js create --module-id "handstack-ui-v1" --company "HandStack" --product "HandStackUI-v1.0.0-PROD001" --hosts "handstack.kr,www.handstack.kr" --environment "Production" --expires "2026-07-01T23:59:59.000Z" --gen-js --js-dir "./generated-licenses"
node license-cli.js create --module-id "custom-api-module" --company "HandStack" --product "CustomApiModule-v1.0.0-PROD001" --hosts "handstack.kr,www.handstack.kr" --environment "Production" --expires "2026-07-01T23:59:59.000Z" --gen-js --js-dir "./generated-licenses"
node license-cli.js create --module-id "handstack-analytics" --company "HandStack" --product "HandStackAnalytics-v1.0.0-PROD001" --hosts "handstack.kr,www.handstack.kr" --environment "Production" --expires "2026-07-01T23:59:59.000Z" --gen-js --js-dir "./generated-licenses"

# 기존 라이선스들로부터 JavaScript 파일 생성
node license-cli.js generate-js --output-dir "./js-licenses" --minify --publisher "handstack.kr"

# 특정 모듈만 JavaScript 파일 생성
node license-cli.js generate-js --module-id "handstack-ui-v1" --output-dir "./single-js" --prefix "lib_" --suffix "_license"

# 예제 실행
node example-with-js-generation.js

# 라이선스 검증
node license-cli.js validate --module-id "handstack-ui-v1"

# 라이선스 목록 조회
node license-cli.js list
*/

const { Command } = require('commander');
const LicenseManager = require('./license-manager');
const fs = require('fs');
const path = require('path');

const program = new Command();
const manager = new LicenseManager();

program
    .name('license-cli')
    .description('HandStack 라이선스 관리 CLI')
    .version('1.0.0');

function getCurrentTime() {
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

program
    .command('create')
    .description('새 라이선스 생성')
    .requiredOption('-m, --module-id <id>', '모듈 ID (영숫자, 하이픈, 밑줄만 허용)')
    .requiredOption('-c, --company <name>', '회사 이름')
    .requiredOption('-p, --product <name>', '제품 이름 (형식: ProductName-Version-SaleID)')
    .requiredOption('-h, --hosts <hosts>', '인증된 호스트 (쉼표로 구분: domain1.com,192.168.1.1,subdomain.example.com)')
    .option('-e, --environment <env>', '환경 (개발/운영)', '개발')
    .option('-x, --expires <date>', '만료 날짜 (ISO 형식: YYYY-MM-DDTHH:MM:SS.000Z)')
    .option('-o, --output <file>', '출력 파일', 'licenses.json')
    .option('--show-key', '출력에 전체 라이선스 키 표시')
    .option('--gen-js', '생성 후 JavaScript 라이선스 파일 생성')
    .option('--js-dir <dir>', 'JavaScript 파일 출력 디렉토리', './licenses')
    .option('--js-minify', 'JavaScript 출력 압축')
    .action((options) => {
        try {
            console.log(`HandStack 라이선스 생성기`);
            console.log(`현재 UTC 시간: ${getCurrentTime()}`);
            console.log(`사용자: handstack\n`);

            options.file = options.file || 'licenses.json';
            if (fs.existsSync(options.file)) {
                manager.loadFromFile(options.file);
            }

            const hostList = options.hosts.split(',').map(host => host.trim()).filter(host => host);
            console.log(`인증된 호스트: ${hostList.join(', ')}`);

            if (options.expires) {
                const expiryDate = new Date(options.expires);
                if (isNaN(expiryDate.getTime())) {
                    throw new Error('잘못된 만료 날짜 형식입니다. ISO 형식(YYYY-MM-DDTHH:MM:SS.000Z)을 사용하세요.');
                }
                console.log(`만료일: ${options.expires}`);
            } else {
                console.log(`만료일: 없음`);
            }

            const licenseInfo = manager.addLicense({
                moduleId: options.moduleId,
                companyName: options.company,
                productName: options.product,
                authorizedHosts: hostList,
                environment: options.environment,
                expiresAt: options.expires || null,
                createdBy: 'handstack'
            });

            manager.saveToFile(options.output);
            
            console.log('\n라이선스 보안 정보:');
            if (options.showKey) {
                console.log(`   전체 키: ${licenseInfo.license.Key}`);
            } else {
                console.log(`   키 미리보기: ${licenseInfo.license.Key.substring(0, 50)}...`);
                console.log(`   전체 키를 보려면 --show-key를 사용하세요.`);
            }
            console.log(`   서명 키: ${licenseInfo.license.SignKey}`);
            
            if (options.genJs) {
                console.log('\nJavaScript 라이선스 파일 생성 중...');
                
                const jsResult = manager.generateJavaScriptLicense(options.moduleId, {
                    minify: options.jsMinify,
                    outputDir: options.jsDir
                });
                
                console.log(`JavaScript 파일 생성됨: ${jsResult.fileName}`);
                console.log(`   경로: ${jsResult.filePath}`);
                console.log(`   크기: ${jsResult.fileSize} 바이트`);
                console.log(`   변수: ${jsResult.jsModuleId}License`);
            }
            
            console.log('\n라이선스가 성공적으로 생성되고 저장되었습니다!');
            
        } catch (error) {
            console.error('오류:', error.message);
            process.exit(1);
        }
    });

program
    .command('generate-js')
    .description('JavaScript 라이선스 파일 생성')
    .option('-m, --module-id <id>', '특정 모듈 ID (제공되지 않으면 모든 모듈에 대해 생성)')
    .option('-f, --file <file>', '라이선스 파일', 'licenses.json')
    .option('-o, --output-dir <dir>', 'JavaScript 파일 출력 디렉토리', './licenses')
    .option('--minify', 'JavaScript 출력 압축')
    .option('--no-timestamp', '헤더에 타임스탬프 포함 안함')
    .option('--publisher <publisher>', '사용자 지정 게시자 이름', 'handstack.kr')
    .option('--prefix <prefix>', '파일 이름 접두사', '')
    .option('--suffix <suffix>', '파일 이름 접미사', 'License')
    .action((options) => {
        try {
            console.log(`JavaScript 라이선스 파일 생성기`);
            console.log(`현재 UTC 시간: ${getCurrentTime()}`);
            console.log(`사용자: handstack\n`);

            if (fs.existsSync(options.file)) {
                manager.loadFromFile(options.file);
            } else {
                throw new Error(`라이선스 파일을 찾을 수 없습니다: ${options.file}`);
            }

            const jsOptions = {
                minify: options.minify,
                addTimestamp: !options.noTimestamp,
                customPublisher: options.publisher,
                outputDir: options.outputDir,
                filePrefix: options.prefix,
                fileSuffix: options.suffix
            };

            let results = [];

            if (options.moduleId) {
                console.log(`특정 모듈(${options.moduleId})에 대해 생성 중...\n`);
                
                const result = manager.generateJavaScriptLicense(options.moduleId, jsOptions);
                results.push({
                    moduleId: options.moduleId,
                    success: true,
                    ...result
                });
                
                console.log(`생성됨: ${result.fileName}`);
                console.log(`   경로: ${result.filePath}`);
                console.log(`   크기: ${result.fileSize} 바이트`);
                console.log(`   변수: ${result.jsModuleId}License`);
                
            } else {
                console.log(`모든 라이선스에 대해 생성 중...\n`);
                results = manager.generateAllJavaScriptLicenses(jsOptions);
            }

            const successful = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success).length;
            
            console.log(`\n생성 요약:`);
            console.log(`   성공: ${successful}`);
            console.log(`   실패: ${failed}`);
            console.log(`   출력 디렉토리: ${path.resolve(options.outputDir)}`);
            
            if (failed > 0) {
                console.log('\n실패한 모듈:');
                results.filter(r => !r.success).forEach(r => {
                    console.log(`   ${r.moduleId}: ${r.error}`);
                });
            }
            
        } catch (error) {
            console.error('오류:', error.message);
            process.exit(1);
        }
    });

program
    .command('validate')
    .description('라이선스 검증')
    .requiredOption('-m, --module-id <id>', '모듈 ID')
    .option('-f, --file <file>', '라이선스 파일', 'licenses.json')
    .option('-H, --check-host <host>', '특정 호스트가 인증되었는지 확인')
    .action((options) => {
        try {
            console.log(`라이선스 검증`);
            console.log(`현재 UTC 시간: ${getCurrentTime()}`);
            console.log(`모듈 ID: ${options.moduleId}\n`);

            if (fs.existsSync(options.file)) {
                manager.loadFromFile(options.file);
            } else {
                throw new Error(`라이선스 파일을 찾을 수 없습니다: ${options.file}`);
            }

            const result = manager.validateStoredLicense(options.moduleId);
            
            if (result.valid) {
                console.log('라이선스가 유효합니다.');
                console.log(`   회사: ${result.data.companyName}`);
                console.log(`   환경: ${result.data.environment}`);
                console.log(`   생성일: ${result.data.createdAt}`);
                console.log(`   만료일: ${result.data.expiresAt || '없음'}`);
                console.log(`   허용된 호스트: ${result.data.allowedHosts.join(', ')}`);

                if (options.checkHost) {
                    console.log(`\n호스트 접근 확인: ${options.checkHost}`);
                    const hostResult = manager.validateHostAccess(options.moduleId, options.checkHost);
                    
                    if (hostResult.valid) {
                        console.log(`   호스트 승인됨 (${hostResult.matchType} 일치)`);
                        if (hostResult.matchedHost) {
                            console.log(`   일치하는 규칙: ${hostResult.matchedHost}`);
                        }
                    } else {
                        console.log(`   호스트 승인되지 않음`);
                        console.log(`   사유: ${hostResult.reason}`);
                    }
                }
            } else {
                console.log('라이선스가 유효하지 않습니다.');
                console.log(`   사유: ${result.reason}`);
                process.exit(1);
            }
            
        } catch (error) {
            console.error('오류:', error.message);
            process.exit(1);
        }
    });

program
    .command('list')
    .description('모든 라이선스 목록 표시')
    .option('-f, --file <file>', '라이선스 파일', 'licenses.json')
    .option('--stats', '상세 통계 표시')
    .option('--format <type>', '출력 형식 (table/json)', 'table')
    .action((options) => {
        try {
            console.log(`라이선스 목록`);
            console.log(`현재 UTC 시간: ${getCurrentTime()}\n`);

            if (fs.existsSync(options.file)) {
                manager.loadFromFile(options.file);
            } else {
                throw new Error(`라이선스 파일을 찾을 수 없습니다: ${options.file}`);
            }

            const licenses = manager.getAllLicenses();
            
            if (licenses.length === 0) {
                console.log('라이선스를 찾을 수 없습니다.');
                return;
            }

            if (options.format === 'json') {
                console.log(JSON.stringify(licenses, null, 2));
                return;
            }

            console.log(`총 ${licenses.length}개의 라이선스 발견:\n`);
            
            licenses.forEach((licenseInfo, index) => {
                const license = licenseInfo.license;
                const validation = manager.validateStoredLicense(licenseInfo.moduleId);
                const status = validation.valid ? '유효' : '유효하지 않음';
                
                console.log(`${index + 1}. 모듈: ${licenseInfo.moduleId} (${status})`);
                console.log(`   회사: ${license.CompanyName}`);
                console.log(`   제품: ${license.ProductName}`);
                console.log(`   호스트: ${license.AuthorizedHost}`);
                console.log(`   환경: ${license.Environment}`);
                console.log(`   생성일: ${license.CreatedAt}`);
                console.log(`   만료일: ${license.ExpiresAt || '없음'}`);
                
                if (!validation.valid) {
                    console.log(`   문제: ${validation.reason}`);
                }
                console.log('');
            });

            if (options.stats) {
                const stats = manager.getStatistics();
                console.log('통계:');
                console.log(`   총계: ${stats.total}`);
                console.log(`   활성: ${stats.active}`);
                console.log(`   만료됨: ${stats.expired}`);
                console.log(`   만료 임박 (30일 이내): ${stats.expiringSoon}`);
                
                console.log('\n환경별:');
                Object.entries(stats.byEnvironment).forEach(([env, count]) => {
                    console.log(`   ${env}: ${count}`);
                });
                
                console.log('\n회사별:');
                Object.entries(stats.byCompany).forEach(([company, count]) => {
                    console.log(`   ${company}: ${count}`);
                });
            }
            
        } catch (error) {
            console.error('오류:', error.message);
            process.exit(1);
        }
    });

program
    .command('check-host')
    .description('라이선스에 대해 호스트가 인증되었는지 확인')
    .requiredOption('-m, --module-id <id>', '모듈 ID')
    .requiredOption('-H, --host <host>', '확인할 호스트 (도메인 또는 IP)')
    .option('-f, --file <file>', '라이선스 파일', 'licenses.json')
    .action((options) => {
        try {
            console.log(`호스트 인증 확인`);
            console.log(`현재 UTC 시간: ${getCurrentTime()}`);
            console.log(`모듈 ID: ${options.moduleId}`);
            console.log(`호스트: ${options.host}\n`);

            if (fs.existsSync(options.file)) {
                manager.loadFromFile(options.file);
            } else {
                throw new Error(`라이선스 파일을 찾을 수 없습니다: ${options.file}`);
            }

            const result = manager.validateHostAccess(options.moduleId, options.host);
            
            if (result.valid) {
                console.log('호스트 승인됨');
                console.log(`   일치 유형: ${result.matchType}`);
                if (result.matchedHost) {
                    console.log(`   일치하는 규칙: ${result.matchedHost}`);
                }
            } else {
                console.log('호스트 승인되지 않음');
                console.log(`   사유: ${result.reason}`);
                process.exit(1);
            }
            
        } catch (error) {
            console.error('오류:', error.message);
            process.exit(1);
        }
    });

program
    .command('stats')
    .description('라이선스 통계 표시')
    .option('-f, --file <file>', '라이선스 파일', 'licenses.json')
    .action((options) => {
        try {
            console.log(`라이선스 통계`);
            console.log(`현재 UTC 시간: ${getCurrentTime()}\n`);

            if (fs.existsSync(options.file)) {
                manager.loadFromFile(options.file);
            } else {
                throw new Error(`라이선스 파일을 찾을 수 없습니다: ${options.file}`);
            }

            const stats = manager.getStatistics();
            
            console.log('개요:');
            console.log(`   총 라이선스: ${stats.total}`);
            console.log(`   활성: ${stats.active}`);
            console.log(`   만료됨: ${stats.expired}`);
            console.log(`   만료 임박 (30일 이내): ${stats.expiringSoon}`);
            
            console.log('\n환경별:');
            Object.entries(stats.byEnvironment).forEach(([env, count]) => {
                const percentage = ((count / stats.total) * 100).toFixed(1);
                console.log(`   ${env}: ${count} (${percentage}%)`);
            });
            
            console.log('\n회사별:');
            Object.entries(stats.byCompany).forEach(([company, count]) => {
                const percentage = ((count / stats.total) * 100).toFixed(1);
                console.log(`   ${company}: ${count} (${percentage}%)`);
            });
            
        } catch (error) {
            console.error('오류:', error.message);
            process.exit(1);
        }
    });

program.parse();
