// node signassembly.js false
// node signassembly.js true

const fs = require('fs');
const path = require('path');

const targetFiles = [
    '3.Infrastructure/HandStack.Core/HandStack.Core.csproj',
    '3.Infrastructure/HandStack.Data/HandStack.Data.csproj',
    '3.Infrastructure/HandStack.Web/HandStack.Web.csproj'
];

function updateSignAssembly(filePath, value) {
    const fullPath = path.join(process.cwd(), filePath);

    try {
        if (!fs.existsSync(fullPath)) {
            console.warn(`[경고] 파일을 찾을 수 없습니다: ${filePath}`);
            return;
        }

        let content = fs.readFileSync(fullPath, 'utf8');

        const regex = /<SignAssembly>\s*(true|false)\s*<\/SignAssembly>/i;

        if (!regex.test(content)) {
            console.warn(`[경고] <SignAssembly> 태그를 찾을 수 없습니다: ${filePath}`);
            return;
        }

        const newValueString = value ? 'True' : 'False';
        const newContent = content.replace(regex, `<SignAssembly>${newValueString}</SignAssembly>`);

        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`[성공] ${filePath} 파일의 <SignAssembly> 값을 ${newValueString}로 변경했습니다.`);

    } catch (error) {
        console.error(`[오류] ${filePath} 파일 처리 중 오류 발생:`, error.message);
    }
}

const arg = process.argv[2];

if (!arg || (arg.toLowerCase() !== 'true' && arg.toLowerCase() !== 'false')) {
    console.error('오류: 매개변수가 잘못되었습니다.');
    console.error('사용법: node signassembly.js true 또는 node signassembly.js false');
    process.exit(1);
}

const enableSigning = arg.toLowerCase() === 'true';

console.log(`어셈블리 서명을 [${enableSigning ? '활성화(True)' : '비활성화(False)'}]합니다...`);
console.log('--------------------------------------------------');

targetFiles.forEach(file => {
    const platformSpecificPath = file.replace(/\\/g, path.sep);
    updateSignAssembly(platformSpecificPath, enableSigning);
});

console.log('--------------------------------------------------');
console.log('모든 작업이 완료되었습니다.');
