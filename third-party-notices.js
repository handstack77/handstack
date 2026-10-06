#!/usr/bin/env node
// THIRD-PARTY-NOTICES.md 생성기.
//   node third-party-notices.js            -> 저장소 루트에 THIRD-PARTY-NOTICES.md 생성
//   node third-party-notices.js --check    -> 파일을 쓰지 않고 조회 실패/검토 필요 항목만 출력
//
// 입력 소스
//   NuGet  : 모든 *.csproj 의 PackageReference (라이선스는 ~/.nuget/packages 의 nuspec, 없으면 nuget.org)
//   npm    : ack, function, wwwroot 모듈의 package.json 직접 의존성 (버전 범위와 license 는 registry.npmjs.org 에서 해석)
//   libman : 2.Modules/wwwroot/libman.json (cdnjs API / npm registry 조회)
// 네트워크가 필요하며 Node.js 20 이상(내장 fetch)에서 동작한다. 결과는 결정적이므로 시각 정보는 쓰지 않는다.

const fs = require('fs');
const os = require('os');
const path = require('path');

const root = __dirname;
const outputPath = path.join(root, 'THIRD-PARTY-NOTICES.md');
const checkOnly = process.argv.includes('--check');

const npmManifests = [
    { label: '1.WebHost/ack', file: '1.WebHost/ack/package.json' },
    { label: '2.Modules/function', file: '2.Modules/function/package.json' },
    { label: '2.Modules/wwwroot', file: '2.Modules/wwwroot/package.json' }
];
const libmanFile = '2.Modules/wwwroot/libman.json';
const nugetCacheRoot = process.env.NUGET_PACKAGES || path.join(os.homedir(), '.nuget', 'packages');

const permissive = new Set([
    'MIT', 'MIT-0', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', '0BSD', 'Apache-2.0', 'BlueOak-1.0.0',
    'CC0-1.0', 'CC-BY-3.0', 'CC-BY-4.0', 'Unlicense', 'Python-2.0', 'Zlib', 'PostgreSQL', 'Public Domain'
]);

// 레지스트리 메타데이터에 license 가 없거나 이름이 비표준인 항목. 근거는 note 에 남긴다.
const licenseAliases = new Map([
    ['apache license, version 2.0', 'Apache-2.0'],
    ['apache 2.0', 'Apache-2.0'],
    ['apache-2', 'Apache-2.0']
]);
const licenseOverrides = new Map([
    ['@tabler/icons-webfont', { license: 'MIT', note: 'npm 메타데이터에 license 필드가 없어 tabler/tabler-icons 저장소 LICENSE(MIT) 기준' }]
]);

function canonicalLicense(value) {
    return value ? (licenseAliases.get(value.trim().toLowerCase()) || value) : value;
}

const warnings = [];

async function pool(items, limit, worker) {
    const results = new Array(items.length);
    let next = 0;
    async function run() {
        while (next < items.length) {
            const index = next++;
            results[index] = await worker(items[index], index);
        }
    }
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
    return results;
}

async function fetchText(url) {
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const response = await fetch(url, { headers: { 'user-agent': 'handstack-third-party-notices' } });
            if (response.status === 404) {
                return null;
            }
            if (response.ok) {
                return await response.text();
            }
        } catch {
            // 재시도
        }
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
    return null;
}

async function fetchJson(url) {
    const text = await fetchText(url);
    if (text === null) {
        return null;
    }
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function sniffLicense(text) {
    if (!text) {
        return null;
    }
    const head = text.slice(0, 4000);
    if (/Apache License/i.test(head) && /Version 2\.0/i.test(head)) return 'Apache-2.0';
    if (/Permission is hereby granted, free of charge/i.test(head)) return 'MIT';
    if (/Redistribution and use in source and binary forms/i.test(head)) return /Neither the name|may be used to endorse/i.test(head) ? 'BSD-3-Clause' : 'BSD-2-Clause';
    if (text.trim().length < 200 && /public domain/i.test(text)) return 'Public Domain';
    return null;
}

function normalizeNpmLicense(value, legacy) {
    if (typeof value === 'string' && value) return canonicalLicense(value);
    if (value && typeof value === 'object' && value.type) return canonicalLicense(value.type);
    if (Array.isArray(legacy) && legacy.length > 0) {
        return legacy.map((item) => canonicalLicense(item.type || String(item))).join(' OR ');
    }
    return null;
}

function escapeCell(text) {
    return String(text ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}

function isPermissive(expression) {
    if (!expression) {
        return false;
    }
    const cleaned = expression.replace(/[()]/g, ' ');
    return cleaned.split(/\s+OR\s+/i).some((alternative) =>
        alternative.split(/\s+AND\s+/i).every((token) => permissive.has(token.trim())));
}

// ---------------------------------------------------------------- NuGet
function findCsprojFiles(directory, found = []) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (['bin', 'obj', 'node_modules', '.git', '.vs', 'publish'].includes(entry.name)) {
                continue;
            }
            findCsprojFiles(path.join(directory, entry.name), found);
        }
        else if (entry.name.endsWith('.csproj')) {
            found.push(path.join(directory, entry.name));
        }
    }
    return found;
}

function collectNuGetReferences() {
    const references = new Map();
    for (const csproj of findCsprojFiles(root)) {
        const xml = fs.readFileSync(csproj, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
        const pattern = /<PackageReference\s+([^>]*?)\/?>/g;
        let match;
        while ((match = pattern.exec(xml)) !== null) {
            const include = /Include="([^"]+)"/.exec(match[1]);
            if (!include) {
                continue;
            }
            const version = /Version="([^"]+)"/.exec(match[1]);
            const key = include[1].toLowerCase();
            if (!references.has(key)) {
                references.set(key, { id: include[1], versions: new Set(), projects: new Set() });
            }
            references.get(key).versions.add(version ? version[1] : '*');
            references.get(key).projects.add(path.relative(root, csproj).replace(/\\/g, '/'));
        }
    }
    return references;
}

function compareVersions(a, b) {
    const split = (value) => value.split(/[.\-+]/).map((part) => (/^\d+$/.test(part) ? Number(part) : part));
    const left = split(a);
    const right = split(b);
    for (let i = 0; i < Math.max(left.length, right.length); i++) {
        if (left[i] === right[i]) continue;
        if (left[i] === undefined) return -1;
        if (right[i] === undefined) return 1;
        if (typeof left[i] === 'number' && typeof right[i] === 'number') return left[i] - right[i];
        return String(left[i]).localeCompare(String(right[i]));
    }
    return 0;
}

function resolveCachedVersion(lowerId, requested) {
    const packageDirectory = path.join(nugetCacheRoot, lowerId);
    if (!fs.existsSync(packageDirectory)) {
        return null;
    }
    const available = fs.readdirSync(packageDirectory).filter((name) => fs.existsSync(path.join(packageDirectory, name, `${lowerId}.nuspec`)));
    if (requested !== '*' && !/[\[\]()*,]/.test(requested)) {
        return available.includes(requested.toLowerCase()) ? requested.toLowerCase() : null;
    }
    return available.sort(compareVersions).pop() || null;
}

function parseNuspec(xml) {
    const pick = (tag) => {
        const found = new RegExp(`<${tag}(\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i').exec(xml);
        return found ? { attributes: found[1] || '', value: found[2].trim() } : null;
    };
    const license = pick('license');
    return {
        licenseType: license ? (/type="(\w+)"/.exec(license.attributes) || [])[1] : null,
        licenseValue: license ? license.value : null,
        licenseUrl: pick('licenseUrl')?.value || null,
        projectUrl: pick('projectUrl')?.value || null,
        copyright: pick('copyright')?.value || null
    };
}

async function resolveNuGet(reference) {
    const lowerId = reference.id.toLowerCase();
    const requested = [...reference.versions].sort(compareVersions).pop();
    const result = {
        id: reference.id,
        versions: [...reference.versions].sort(compareVersions),
        version: requested,
        license: null,
        licenseText: null,
        url: `https://www.nuget.org/packages/${reference.id}`,
        note: ''
    };

    let nuspecXml = null;
    let cachedVersion = resolveCachedVersion(lowerId, requested);
    if (cachedVersion) {
        const base = path.join(nugetCacheRoot, lowerId, cachedVersion);
        nuspecXml = fs.readFileSync(path.join(base, `${lowerId}.nuspec`), 'utf8');
        result.version = cachedVersion;
        result.cacheBase = base;
    }
    else if (requested !== '*') {
        nuspecXml = await fetchText(`https://api.nuget.org/v3-flatcontainer/${lowerId}/${requested.toLowerCase()}/${lowerId}.nuspec`);
    }
    if (!nuspecXml) {
        warnings.push(`NuGet ${reference.id} ${requested}: nuspec 을 찾을 수 없습니다. dotnet restore 후 다시 실행하세요.`);
        result.license = 'UNKNOWN';
        return result;
    }

    const nuspec = parseNuspec(nuspecXml.replace(/^﻿/, ''));
    result.url = `https://www.nuget.org/packages/${reference.id}/${result.version}`;
    result.projectUrl = nuspec.projectUrl;
    result.copyright = nuspec.copyright;

    if (nuspec.licenseType === 'expression') {
        result.license = nuspec.licenseValue;
    }
    else if (nuspec.licenseType === 'file') {
        result.license = `파일 라이선스 (${nuspec.licenseValue})`;
        const filePath = result.cacheBase ? path.join(result.cacheBase, nuspec.licenseValue) : null;
        if (filePath && fs.existsSync(filePath)) {
            result.licenseText = fs.readFileSync(filePath, 'utf8').replace(/^﻿/, '').trim();
            const sniffed = sniffLicense(result.licenseText);
            if (sniffed) {
                result.license = sniffed;
                result.note = `라이선스 파일(${nuspec.licenseValue}) 본문 기준`;
            }
        }
    }
    else if (nuspec.licenseUrl) {
        const rawUrl = nuspec.licenseUrl
            .replace('https://github.com/', 'https://raw.githubusercontent.com/')
            .replace('/blob/', '/');
        const text = await fetchText(rawUrl);
        const sniffed = sniffLicense(text);
        result.license = sniffed || `licenseUrl: ${nuspec.licenseUrl}`;
        result.note = sniffed ? `licenseUrl 본문 기준 (${nuspec.licenseUrl})` : 'licenseUrl 본문으로 확인하지 못함';
        if (sniffed && text) {
            result.licenseText = null;
        }
    }
    else if (nuspec.copyright && /public domain/i.test(nuspec.copyright)) {
        result.license = 'Public Domain';
        result.note = 'nuspec copyright 기준';
    }
    else {
        result.license = 'UNKNOWN';
    }

    if (reference.versions.has('*')) {
        result.note = [result.note, '프로젝트가 부동 버전(*)을 사용하며 로컬 캐시의 최신 버전을 기준으로 함'].filter(Boolean).join('; ');
    }
    return result;
}

// ---------------------------------------------------------------- npm
function collectNpmPackages() {
    // package.json 의 dependencies / devDependencies(직접 의존성)만 대상으로 한다. 하위(transitive) 의존성은 포함하지 않는다.
    const requests = new Map();
    for (const manifest of npmManifests) {
        const json = JSON.parse(fs.readFileSync(path.join(root, manifest.file), 'utf8'));
        for (const [section, runtime] of [['dependencies', true], ['devDependencies', false]]) {
            for (const [name, spec] of Object.entries(json[section] || {})) {
                const key = `${name}\u0000${spec}`;
                if (!requests.has(key)) {
                    requests.set(key, { name, spec, runtime: false, sources: new Set() });
                }
                const request = requests.get(key);
                request.runtime = request.runtime || runtime;
                request.sources.add(manifest.label);
            }
        }
    }
    return [...requests.values()];
}

function parseSemver(value) {
    const found = /^(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z.-]+)?(\+.*)?$/.exec(value);
    return found ? { parts: [Number(found[1]), Number(found[2]), Number(found[3])], prerelease: Boolean(found[4]) } : null;
}

function compareParts(a, b) {
    for (let i = 0; i < 3; i++) {
        if (a[i] !== b[i]) return a[i] - b[i];
    }
    return 0;
}

// 지원 범위: 정확한 버전, ^, ~, >=, *, x, latest, M.x / M.m.x. 그 외(git, file, 복합 범위)는 null.
function satisfies(version, spec) {
    const parsed = parseSemver(version);
    if (!parsed || parsed.prerelease) {
        return false;
    }
    const target = spec.trim();
    if (target === '' || target === '*' || target === 'x' || target === 'latest') {
        return true;
    }
    const partial = /^(\d+)(?:\.(\d+|x|\*))?(?:\.(\d+|x|\*))?$/.exec(target);
    if (partial && /^\d+\.\d+\.\d+$/.test(target)) {
        return compareParts(parsed.parts, target.split('.').map(Number)) === 0;
    }
    if (partial) {
        const major = Number(partial[1]);
        const minor = partial[2] === undefined || /[x*]/.test(partial[2]) ? null : Number(partial[2]);
        return parsed.parts[0] === major && (minor === null || parsed.parts[1] === minor);
    }
    const ranged = /^([\^~]|>=)\s*v?(\d+)\.(\d+)\.(\d+)$/.exec(target);
    if (!ranged) {
        return null;
    }
    const base = [Number(ranged[2]), Number(ranged[3]), Number(ranged[4])];
    if (compareParts(parsed.parts, base) < 0) {
        return false;
    }
    if (ranged[1] === '>=') {
        return true;
    }
    if (ranged[1] === '~') {
        return parsed.parts[0] === base[0] && parsed.parts[1] === base[1];
    }
    if (base[0] > 0) return parsed.parts[0] === base[0];
    if (base[1] > 0) return parsed.parts[0] === 0 && parsed.parts[1] === base[1];
    return compareParts(parsed.parts, base) === 0;
}

const packuments = new Map();
function getPackument(name) {
    if (!packuments.has(name)) {
        const encoded = name.startsWith('@') ? name.replace('/', '%2F') : name;
        packuments.set(name, fetchJson(`https://registry.npmjs.org/${encoded}`));
    }
    return packuments.get(name);
}

async function resolveNpmPackage(request) {
    const entry = { name: request.name, spec: request.spec, version: null, license: null, runtime: request.runtime, sources: request.sources };
    const packument = await getPackument(request.name);
    if (packument && packument.versions) {
        const candidates = Object.keys(packument.versions).filter((version) => satisfies(version, request.spec) === true);
        const chosen = candidates.sort(compareVersions).pop();
        if (chosen) {
            entry.version = chosen;
            const metadata = packument.versions[chosen];
            entry.license = normalizeNpmLicense(metadata.license, metadata.licenses);
        }
    }
    if (!entry.version) {
        entry.version = request.spec;
        warnings.push(`npm ${request.name}@${request.spec}: 버전을 해석하지 못했습니다.`);
    }
    if (!entry.license && licenseOverrides.has(request.name)) {
        entry.license = licenseOverrides.get(request.name).license;
    }
    if (!entry.license) {
        entry.license = 'UNKNOWN';
        warnings.push(`npm ${entry.name}@${entry.version}: 라이선스를 확인하지 못했습니다.`);
    }
    return entry;
}

// ---------------------------------------------------------------- libman
async function resolveLibman(library, defaultProvider) {
    const provider = library.provider || defaultProvider;
    const at = library.library.lastIndexOf('@');
    const name = library.library.slice(0, at);
    const version = library.library.slice(at + 1);
    const result = { name, version, provider, destination: library.destination, license: null, url: '', note: '' };

    if (provider === 'cdnjs') {
        const metadata = await fetchJson(`https://api.cdnjs.com/libraries/${encodeURIComponent(name)}?fields=license,homepage`);
        result.license = metadata && metadata.license ? canonicalLicense(metadata.license) : null;
        result.url = metadata && metadata.homepage ? metadata.homepage : `https://cdnjs.com/libraries/${name}`;
    }
    else if (provider === 'jsdelivr' || provider === 'unpkg') {
        const encoded = name.startsWith('@') ? name.replace('/', '%2F') : name;
        const metadata = await fetchJson(`https://registry.npmjs.org/${encoded}/${version}`);
        result.license = metadata ? normalizeNpmLicense(metadata.license, metadata.licenses) : null;
        result.url = `https://www.npmjs.com/package/${name}/v/${version}`;
        if (!result.license && licenseOverrides.has(name)) {
            result.license = licenseOverrides.get(name).license;
            result.note = licenseOverrides.get(name).note;
        }
    }
    else if (provider === 'filesystem') {
        result.name = library.library.split('/').slice(0, 3).join('/');
        result.version = '(저장소 포함)';
        result.license = 'REVIEW';
        result.note = '저장소에 직접 포함된 파일입니다. 벤더 라이선스 조건을 별도로 확인하세요.';
    }

    if (!result.license) {
        result.license = 'UNKNOWN';
        warnings.push(`libman ${library.library} (${provider}): 라이선스를 확인하지 못했습니다.`);
    }
    return result;
}

// ---------------------------------------------------------------- 출력
function table(headers, rows) {
    const lines = [`| ${headers.join(' | ')} |`, `| ${headers.map(() => '---').join(' | ')} |`];
    for (const row of rows) {
        lines.push(`| ${row.map(escapeCell).join(' | ')} |`);
    }
    return lines.join('\n');
}

(async () => {
    const nugetReferences = [...collectNuGetReferences().values()];
    const nuget = (await pool(nugetReferences, 6, resolveNuGet)).sort((a, b) => a.id.toLowerCase().localeCompare(b.id.toLowerCase()));

    // 서로 다른 범위 표기(^2.6.1 / 2.6.1)가 같은 버전으로 해석되면 하나로 합친다.
    const npmMerged = new Map();
    for (const entry of await pool(collectNpmPackages(), 12, resolveNpmPackage)) {
        const id = `${entry.name}@${entry.version}`;
        if (npmMerged.has(id)) {
            npmMerged.get(id).runtime = npmMerged.get(id).runtime || entry.runtime;
        }
        else {
            npmMerged.set(id, entry);
        }
    }
    const npmEntries = [...npmMerged.values()];
    const npmSorted = npmEntries.sort((a, b) => a.name.localeCompare(b.name) || compareVersions(a.version, b.version));
    const npmRuntime = npmSorted.filter((entry) => entry.runtime);
    const npmBuild = npmSorted.filter((entry) => !entry.runtime);

    const libman = JSON.parse(fs.readFileSync(path.join(root, libmanFile), 'utf8'));
    const libResolved = await pool(libman.libraries, 6, (library) => resolveLibman(library, libman.defaultProvider));
    const libs = libResolved.filter((item, index) => libResolved.findIndex((other) => other.name === item.name && other.version === item.version) === index);

    const review = [];
    for (const item of nuget) if (!isPermissive(item.license)) review.push({ kind: 'NuGet', name: `${item.id} ${item.version}`, license: item.license, note: item.note });
    for (const item of npmSorted) if (!isPermissive(item.license)) review.push({ kind: item.runtime ? 'npm (runtime)' : 'npm (build)', name: `${item.name} ${item.version}`, license: item.license, note: '' });
    for (const item of libs) if (!isPermissive(item.license)) review.push({ kind: 'libman', name: `${item.name} ${item.version}`, license: item.license, note: item.note });

    if (checkOnly) {
        console.log(`NuGet ${nuget.length}, npm ${npmSorted.length} (runtime ${npmRuntime.length}), libman ${libs.length}`);
        console.log('--- warnings');
        warnings.forEach((warning) => console.log(warning));
        console.log('--- review');
        review.forEach((item) => console.log(`${item.kind}\t${item.name}\t${item.license}\t${item.note}`));
        return;
    }

    const textGroups = new Map();
    for (const item of nuget) {
        if (item.licenseText) {
            if (!textGroups.has(item.licenseText)) textGroups.set(item.licenseText, []);
            textGroups.get(item.licenseText).push(`${item.id} ${item.version}`);
        }
    }

    const lines = [];
    lines.push('# 서드파티 고지 (Third-Party Notices)');
    lines.push('');
    lines.push('HandStack 은 [MIT 라이선스](LICENSE.md)로 배포됩니다. 이 문서는 HandStack 이 빌드·설치·실행 과정에서 사용하는 서드파티 구성요소와 각 구성요소의 라이선스를 나열합니다. 각 구성요소의 저작권과 라이선스 조건은 해당 구성요소의 소유자에게 있으며, 아래 목록은 편의를 위한 요약이므로 정확한 조건은 링크된 원문을 따르세요.');
    lines.push('');
    lines.push('> 이 파일은 `node third-party-notices.js` 로 생성됩니다. 의존성을 추가·변경한 뒤에는 다시 생성해 반영하세요. 네트워크 연결과 `dotnet restore` 가 끝난 NuGet 캐시가 필요합니다.');
    lines.push('');
    lines.push('| 구분 | 수량 | 출처 |');
    lines.push('| --- | --- | --- |');
    lines.push(`| NuGet | ${nuget.length} | 모든 \`*.csproj\` 의 PackageReference |`);
    lines.push(`| npm (런타임) | ${npmRuntime.length} | ${npmManifests.map((item) => `\`${item.file}\``).join(', ')} 의 dependencies (직접 의존성, 하위 의존성 제외) |`);
    lines.push(`| npm (빌드 도구) | ${npmBuild.length} | 같은 package.json 의 devDependencies (직접 의존성) |`);
    lines.push(`| libman | ${libs.length} | \`${libmanFile}\` |`);
    lines.push('');

    lines.push('## 검토가 필요한 구성요소');
    lines.push('');
    lines.push('허용형(MIT, ISC, BSD, Apache-2.0 등)이 아니거나 라이선스를 자동으로 판별하지 못한 항목입니다. 배포 전에 조건(재배포·상업적 사용·링크 방식 등)을 확인하세요.');
    lines.push('');
    lines.push(review.length > 0
        ? table(['구분', '구성요소', '라이선스', '비고'], review.map((item) => [item.kind, item.name, item.license, item.note]))
        : '해당 항목이 없습니다.');
    lines.push('');

    lines.push('## NuGet 패키지');
    lines.push('');
    lines.push(table(['패키지', '버전', '라이선스', '링크', '비고'],
        nuget.map((item) => [item.id, item.versions.length > 1 ? item.versions.join(', ') : item.version, item.license, item.projectUrl || item.url, item.note])));
    lines.push('');

    lines.push('## npm 패키지 (런타임)');
    lines.push('');
    lines.push('`install.*` 이 `npm install` 로 설치하는 `function` 모듈과 `ack` 의 런타임 의존성입니다.');
    lines.push('');
    lines.push(table(['패키지', '버전', '라이선스', '링크'],
        npmRuntime.map((item) => [item.name, item.version, item.license, `https://www.npmjs.com/package/${item.name}/v/${item.version}`])));
    lines.push('');

    lines.push('## npm 패키지 (빌드 도구)');
    lines.push('');
    lines.push('`syn.js`·`syn.bundle.js` 번들링(gulp, babel 등)에만 쓰이는 개발 의존성입니다. 번들 결과물에는 도구 자체가 포함되지 않습니다.');
    lines.push('');
    lines.push(table(['패키지', '버전', '라이선스', '링크'],
        npmBuild.map((item) => [item.name, item.version, item.license, `https://www.npmjs.com/package/${item.name}/v/${item.version}`])));
    lines.push('');

    lines.push('## libman 클라이언트 라이브러리');
    lines.push('');
    lines.push('`wwwroot` 모듈의 `lib` 폴더(`lib.zip`)에 포함되는 브라우저용 라이브러리입니다.');
    lines.push('');
    lines.push(table(['라이브러리', '버전', '제공자', '라이선스', '링크', '비고'],
        libs.map((item) => [item.name, item.version, item.provider, item.license, item.url, item.note])));
    lines.push('');

    if (textGroups.size > 0) {
        lines.push('## 파일 형태로 제공되는 라이선스 원문');
        lines.push('');
        lines.push('패키지가 라이선스 파일을 직접 포함하는 경우 원문을 그대로 옮겼습니다.');
        lines.push('');
        for (const [text, owners] of [...textGroups.entries()].sort((a, b) => a[1][0].localeCompare(b[1][0]))) {
            lines.push(`### ${owners.join(', ')}`);
            lines.push('');
            lines.push('```text');
            lines.push(text);
            lines.push('```');
            lines.push('');
        }
    }

    fs.writeFileSync(outputPath, lines.join('\n').replace(/\r?\n/g, '\n'), 'utf8');
    console.log(`작성: ${path.relative(root, outputPath)} (NuGet ${nuget.length}, npm ${npmSorted.length}, libman ${libs.length})`);
    console.log(`검토 필요 ${review.length}건, 조회 실패 경고 ${warnings.length}건`);
    warnings.forEach((warning) => console.log(`경고: ${warning}`));
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
