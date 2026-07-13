/*
#!/usr/bin/env node

# obfuscator.json에 등록된 모든 프로젝트를 최적화/난독화
node obfuscator.js bundle --config ./obfuscator.json

# 특정 프로젝트만 실행하고, 실행 시점에 제외 패턴을 추가
node obfuscator.js bundle --config ./obfuscator.json --project ack --exclude-dir "demo" --exclude-file "*.spec.js"

# 설정 파일 없이 단일 wwwroot 경로만 실행
node obfuscator.js bundle --source "C:\projects\handstack77\handstack\1.WebHost\ack\wwwroot" --output "C:\projects\handstack77\handstack\1.WebHost\ack\wwwroot-bundle" --exclude-dir lib --exclude-file "*.map"

# 실제 파일을 쓰지 않고 대상 개수만 확인
node obfuscator.js bundle --config ./obfuscator.json --dry-run

# publish.bat 산출물의 app/modules 하위 wwwroot를 찾아 동일 경로에 최적화/난독화 적용
node obfuscator.js publish-optimize --root "C:\projects\handstack77\publish\win-x64\handstack"
*/

const { Command } = require('commander');
const path = require('path');
const { loadConfig, defaultExcludeDirs, defaultExcludeFiles } = require('./lib/config-loader');
const { bundleAll } = require('./lib/bundler');
const { findWwwrootDirs } = require('./lib/wwwroot-scanner');

const program = new Command();

program
    .name('obfuscator-cli')
    .description('HandStack 프로젝트 wwwroot 정적 자산 최적화(HTML/CSS 압축, JS 난독화) CLI')
    .version('1.0.0');

function collect(value, previous) {
    previous.push(value);
    return previous;
}

function getCurrentTime() {
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

// bundle/publish-optimize 공용: 진행률 출력 후 bundleAll을 실행하고 프로젝트별/전체 요약을 출력한다.
// 실패한 프로젝트가 있으면 true를 반환한다(호출부에서 process.exit(1) 처리에 사용).
async function runBundle(projects, globalOptions) {
    const results = await bundleAll(projects, globalOptions, (progress) => {
        process.stdout.write(`\r\x1b[K[${progress.project}] 진행 파일 수: ${progress.index}/${progress.total}`);
        if (progress.index === progress.total) {
            process.stdout.write('\n');
        }
    });

    let totalFiles = 0;
    let totalProcessed = 0;
    let totalWarnings = 0;
    let failedCount = 0;

    results.forEach((result) => {
        if (result.skipped === true) {
            failedCount += 1;
            console.log(`[건너뜀] ${result.name}: ${result.reason} (${result.source})`);
            return;
        }

        totalFiles += result.fileCount;
        totalProcessed += result.processedCount;
        console.log(`[완료] ${result.name}`);
        console.log(`   원본: ${result.source}`);
        console.log(`   출력: ${result.output}`);
        console.log(`   파일: ${result.fileCount}개 (최적화/난독화 ${result.processedCount}개, 원본 복사 ${result.fileCount - result.processedCount}개)`);

        if (result.warnings && result.warnings.length > 0) {
            totalWarnings += result.warnings.length;
            result.warnings.forEach((warning) => {
                console.log(`   [경고] ${warning.relativePath}: 파싱 실패로 원본 그대로 복사 (${warning.error})`);
            });
        }
    });

    console.log('\n요약:');
    console.log(`   처리 프로젝트: ${results.length - failedCount}/${results.length}`);
    console.log(`   전체 파일: ${totalFiles}개 (최적화/난독화 ${totalProcessed}개)`);
    if (totalWarnings > 0) {
        console.log(`   경고: ${totalWarnings}개 파일은 파싱 실패로 원본 그대로 복사됨`);
    }

    return failedCount > 0;
}

program
    .command('bundle', { isDefault: true })
    .description('설정 파일 또는 --source/--output으로 지정한 wwwroot를 최적화/난독화하여 출력 경로에 생성')
    .option('-c, --config <file>', '프로젝트 목록 설정 파일(JSON) 경로', './obfuscator.json')
    .option('-s, --source <path>', '단일 프로젝트 실행 시 원본 wwwroot 경로 (설정 파일 대신 사용)')
    .option('-o, --output <path>', '단일 프로젝트 실행 시 출력 경로 (--source와 함께 사용)')
    .option('-n, --name <name>', '단일 프로젝트 실행 시 결과 표시 이름', 'default')
    .option('--project <name>', '설정 파일 내 특정 프로젝트만 실행 (반복 가능)', collect, [])
    .option('--exclude-dir <pattern>', '최적화/난독화에서 제외할 디렉토리 glob 패턴 (반복 가능, 예: lib, **/node_modules/**)', collect, [])
    .option('--exclude-file <pattern>', '최적화/난독화에서 제외할 파일 glob 패턴 (반복 가능, 예: *.min.js, *.map)', collect, [])
    .option('--dry-run', '실제로 파일을 쓰지 않고 대상 파일 수만 확인')
    .action(async (options) => {
        try {
            console.log('HandStack wwwroot 최적화/난독화');
            console.log(`현재 시간: ${getCurrentTime()}\n`);

            let projects;
            let globalOptions;

            if (options.source) {
                if (!options.output) {
                    throw new Error('--source를 사용할 때는 --output도 함께 지정해야 합니다.');
                }
                projects = [{ name: options.name, source: options.source, output: options.output, excludeDirs: [], excludeFiles: [] }];
                globalOptions = { excludeDirs: defaultExcludeDirs, excludeFiles: defaultExcludeFiles, obfuscatorOptions: {} };
            } else {
                const config = loadConfig(options.config);
                projects = config.projects;
                globalOptions = { excludeDirs: config.excludeDirs, excludeFiles: config.excludeFiles, obfuscatorOptions: config.obfuscatorOptions };

                if (options.project.length > 0) {
                    projects = projects.filter((project) => options.project.includes(project.name));
                }
            }

            if (projects.length === 0) {
                throw new Error('실행할 프로젝트가 없습니다. --config 내용 또는 --project 필터를 확인하세요.');
            }

            globalOptions.excludeDirs = [].concat(globalOptions.excludeDirs, options.excludeDir);
            globalOptions.excludeFiles = [].concat(globalOptions.excludeFiles, options.excludeFile);
            globalOptions.dryRun = options.dryRun === true;

            console.log(`대상 프로젝트: ${projects.length}개`);
            if (globalOptions.excludeDirs.length > 0) {
                console.log(`제외 디렉토리 패턴: ${globalOptions.excludeDirs.join(', ')}`);
            }
            if (globalOptions.excludeFiles.length > 0) {
                console.log(`제외 파일 패턴: ${globalOptions.excludeFiles.join(', ')}`);
            }
            if (globalOptions.dryRun === true) {
                console.log('(dry-run 모드: 파일을 실제로 쓰지 않습니다)');
            }
            console.log('');

            const hasFailure = await runBundle(projects, globalOptions);
            if (hasFailure === true) {
                process.exit(1);
            }
        } catch (error) {
            console.error('오류:', error.message);
            process.exit(1);
        }
    });

program
    .command('publish-optimize')
    .description('publish.bat 산출물(--root 하위 app, modules)에서 wwwroot 디렉토리를 찾아 동일 경로(source=output)에 최적화/난독화 적용')
    .requiredOption('-r, --root <path>', 'publish 산출물의 handstack 루트 경로 (예: ...\\publish\\win-x64\\handstack)')
    .option('--exclude-dir <pattern>', '최적화/난독화에서 제외할 디렉토리 glob 패턴 (반복 가능)', collect, [])
    .option('--exclude-file <pattern>', '최적화/난독화에서 제외할 파일 glob 패턴 (반복 가능)', collect, [])
    .option('--dry-run', '실제로 파일을 쓰지 않고 대상 파일 수만 확인')
    .action(async (options) => {
        try {
            console.log('HandStack publish 산출물 wwwroot 최적화/난독화 (in-place)');
            console.log(`현재 시간: ${getCurrentTime()}\n`);

            const root = path.resolve(options.root);
            const scanRoots = [path.join(root, 'app'), path.join(root, 'modules')];

            const wwwrootDirs = [];
            for (const scanRoot of scanRoots) {
                wwwrootDirs.push(...await findWwwrootDirs(scanRoot));
            }

            if (wwwrootDirs.length === 0) {
                throw new Error(`대상 wwwroot 디렉토리를 찾을 수 없습니다: ${scanRoots.join(', ')}`);
            }

            const projects = wwwrootDirs.map((dir) => ({
                name: path.relative(root, dir).split(path.sep).join('/'),
                source: dir,
                output: dir,
                excludeDirs: [],
                excludeFiles: []
            }));

            const globalOptions = {
                excludeDirs: [].concat(defaultExcludeDirs, options.excludeDir),
                excludeFiles: [].concat(defaultExcludeFiles, options.excludeFile),
                obfuscatorOptions: {},
                dryRun: options.dryRun === true
            };

            console.log(`대상 wwwroot: ${projects.length}개`);
            projects.forEach((project) => console.log(`   - ${project.name}`));
            console.log(`제외 디렉토리 패턴: ${globalOptions.excludeDirs.join(', ')}`);
            console.log(`제외 파일 패턴: ${globalOptions.excludeFiles.join(', ')}`);
            if (globalOptions.dryRun === true) {
                console.log('(dry-run 모드: 파일을 실제로 쓰지 않습니다)');
            }
            console.log('');

            const hasFailure = await runBundle(projects, globalOptions);
            if (hasFailure === true) {
                process.exit(1);
            }
        } catch (error) {
            console.error('오류:', error.message);
            process.exit(1);
        }
    });

program
    .command('init')
    .description('obfuscator.json 샘플 설정 파일 생성')
    .option('-o, --output <file>', '생성할 설정 파일 경로', './obfuscator.json')
    .action((options) => {
        const fs = require('fs');
        const outputPath = path.resolve(options.output);
        if (fs.existsSync(outputPath) === true) {
            console.error(`오류: 이미 파일이 존재합니다: ${outputPath}`);
            process.exit(1);
        }

        const sample = {
            outputSuffix: '-bundle',
            excludeDirs: ['lib', 'node_modules', '.git', 'obj', 'bin'],
            excludeFiles: ['*.map', '*.min.js'],
            projects: [
                'C:\\projects\\handstack77\\handstack\\1.WebHost\\ack\\wwwroot',
                {
                    name: 'rdy-command',
                    source: 'C:\\projects\\handstack77\\handstack\\1.WebHost\\rdy\\modules\\command\\wwwroot',
                    output: 'C:\\projects\\handstack77\\handstack\\1.WebHost\\rdy\\modules\\command\\wwwroot-bundle',
                    excludeDirs: ['demo']
                }
            ]
        };

        fs.writeFileSync(outputPath, JSON.stringify(sample, null, 2), 'utf8');
        console.log(`설정 파일이 생성되었습니다: ${outputPath}`);
    });

program.parse();
