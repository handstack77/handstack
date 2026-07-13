'use strict';

const fs = require('fs/promises');
const path = require('path');
const CleanCSS = require('clean-css');
const { minify: minifyHtml } = require('html-minifier-terser');
const JavaScriptObfuscator = require('javascript-obfuscator');
const { isExcludedDirectory, isExcludedFile } = require('./pattern-matcher');

// javascript-obfuscator는 CI 계열 환경변수가 없는 TTY 환경에서 obfuscate() 호출 시 Pro 홍보 메시지를 출력한다(AdvertisementUtils.shouldShowAdvertisement).
// CLI 실행에서는 항상 비표시되도록 CI 환경변수를 강제한다(사용자가 이미 설정했다면 그대로 둔다).
if (!process.env.CI) {
    process.env.CI = '1';
}

const defaultObfuscatorOptions = {
    compact: true,
    controlFlowFlattening: true,
    deadCodeInjection: false,
    debugProtection: false,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'mangled-shuffled',
    renameGlobals: false,
    selfDefending: true,
    simplify: true,
    stringArray: true,
    stringArrayEncoding: [],
    stringArrayThreshold: 0.35,
    unicodeEscapeSequence: false
};

async function collectFiles(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory() === true) {
            files.push(...await collectFiles(fullPath));
        } else if (entry.isFile() === true) {
            files.push(fullPath);
        }
    }
    return files;
}

async function optimizeFile(sourcePath, relativePath, excludeDirs, excludeFiles, obfuscatorOptions) {
    if (isExcludedDirectory(relativePath, excludeDirs) === true || isExcludedFile(relativePath, excludeFiles) === true) {
        return { buffer: await fs.readFile(sourcePath), processed: false };
    }

    const extension = path.extname(sourcePath).toLowerCase();

    if (extension === '.html') {
        const source = await fs.readFile(sourcePath, 'utf8');
        const minified = await minifyHtml(source, {
            collapseWhitespace: true,
            conservativeCollapse: true,
            keepClosingSlash: true,
            minifyCSS: true,
            minifyJS: false,
            removeComments: true,
            removeRedundantAttributes: false
        });
        return { buffer: minified, processed: true };
    }

    if (extension === '.css') {
        const source = await fs.readFile(sourcePath, 'utf8');
        const result = new CleanCSS({ level: 2 }).minify(source);
        return { buffer: result.styles, processed: true };
    }

    if (extension === '.js') {
        const source = await fs.readFile(sourcePath, 'utf8');
        const options = Object.assign({}, defaultObfuscatorOptions, obfuscatorOptions || {});
        const obfuscated = JavaScriptObfuscator.obfuscate(source, options);
        return { buffer: obfuscated.getObfuscatedCode(), processed: true };
    }

    return { buffer: await fs.readFile(sourcePath), processed: false };
}

async function bundleProject(project, globalOptions, onProgress) {
    const sourceRoot = path.resolve(project.source);
    const outputRoot = path.resolve(project.output);
    const excludeDirs = [].concat(globalOptions.excludeDirs || [], project.excludeDirs || []);
    const excludeFiles = [].concat(globalOptions.excludeFiles || [], project.excludeFiles || []);
    const obfuscatorOptions = Object.assign({}, globalOptions.obfuscatorOptions || {}, project.obfuscatorOptions || {});

    const sourceStat = await fs.stat(sourceRoot).catch(() => null);
    if (sourceStat === null || sourceStat.isDirectory() === false) {
        return {
            name: project.name,
            source: sourceRoot,
            output: outputRoot,
            skipped: true,
            reason: 'source-not-found',
            fileCount: 0,
            processedCount: 0
        };
    }

    if (globalOptions.dryRun !== true) {
        await fs.rm(outputRoot, { recursive: true, force: true });
    }

    const files = await collectFiles(sourceRoot);
    let processedCount = 0;

    for (let index = 0; index < files.length; index += 1) {
        const sourcePath = files[index];
        const relativePath = path.relative(sourceRoot, sourcePath);
        const result = await optimizeFile(sourcePath, relativePath, excludeDirs, excludeFiles, obfuscatorOptions);

        if (result.processed === true) {
            processedCount += 1;
        }

        if (globalOptions.dryRun !== true) {
            const targetPath = path.join(outputRoot, relativePath);
            await fs.mkdir(path.dirname(targetPath), { recursive: true });
            await fs.writeFile(targetPath, result.buffer);
        }

        if (typeof onProgress === 'function') {
            onProgress({ project: project.name, relativePath, index: index + 1, total: files.length });
        }
    }

    return {
        name: project.name,
        source: sourceRoot,
        output: outputRoot,
        skipped: false,
        fileCount: files.length,
        processedCount
    };
}

async function bundleAll(projects, globalOptions, onProgress) {
    const results = [];
    for (const project of projects) {
        results.push(await bundleProject(project, globalOptions, onProgress));
    }
    return results;
}

module.exports = { bundleProject, bundleAll, collectFiles, optimizeFile, defaultObfuscatorOptions };
