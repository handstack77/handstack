'use strict';

const fs = require('fs');
const path = require('path');

const defaultOutputSuffix = '-bundle';
const defaultExcludeDirs = ['lib', 'node_modules', '.git', 'obj', 'bin', 'demo'];
const defaultExcludeFiles = ['*.map', '*.min.js'];

function deriveName(sourcePath) {
    const projectDir = path.basename(path.dirname(sourcePath));
    const leafDir = path.basename(sourcePath);
    return projectDir ? `${projectDir}/${leafDir}` : leafDir;
}

function deriveOutput(sourcePath, outputSuffix) {
    return `${sourcePath}${outputSuffix}`;
}

// 프로젝트 항목을 문자열(wwwroot 경로) 또는 객체({ name, source, output, excludeDirs, excludeFiles }) 둘 다 허용한다.
function normalizeProject(entry, outputSuffix) {
    if (typeof entry === 'string') {
        return {
            name: deriveName(entry),
            source: entry,
            output: deriveOutput(entry, outputSuffix),
            excludeDirs: [],
            excludeFiles: []
        };
    }

    if (!entry || typeof entry.source !== 'string') {
        throw new Error('projects 항목은 문자열 경로이거나 source 속성을 가진 객체여야 합니다.');
    }

    return {
        name: entry.name || deriveName(entry.source),
        source: entry.source,
        output: entry.output || deriveOutput(entry.source, outputSuffix),
        excludeDirs: entry.excludeDirs || [],
        excludeFiles: entry.excludeFiles || []
    };
}

function loadConfig(configPath) {
    const resolvedPath = path.resolve(configPath);
    if (fs.existsSync(resolvedPath) === false) {
        throw new Error(`설정 파일을 찾을 수 없습니다: ${resolvedPath}`);
    }

    const raw = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
    const source = Array.isArray(raw) ? { projects: raw } : raw;
    const outputSuffix = source.outputSuffix || defaultOutputSuffix;
    const projectEntries = Array.isArray(source.projects) ? source.projects : [];

    return {
        excludeDirs: source.excludeDirs || defaultExcludeDirs,
        excludeFiles: source.excludeFiles || defaultExcludeFiles,
        obfuscatorOptions: source.obfuscatorOptions || {},
        projects: projectEntries.map((entry) => normalizeProject(entry, outputSuffix))
    };
}

module.exports = { loadConfig, normalizeProject, defaultExcludeDirs, defaultExcludeFiles };
