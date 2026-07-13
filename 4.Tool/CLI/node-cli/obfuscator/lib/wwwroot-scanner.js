'use strict';

const fs = require('fs/promises');
const path = require('path');

// 주어진 경로 하위에서 디렉토리명이 정확히 "wwwroot"인 디렉토리를 재귀적으로 찾는다.
// wwwroot 디렉토리를 찾으면 그 내부는 더 탐색하지 않는다.
async function findWwwrootDirs(rootPath) {
    const resolvedRoot = path.resolve(rootPath);
    const stat = await fs.stat(resolvedRoot).catch(() => null);
    if (stat === null || stat.isDirectory() === false) {
        return [];
    }

    if (path.basename(resolvedRoot).toLowerCase() === 'wwwroot') {
        return [resolvedRoot];
    }

    const entries = await fs.readdir(resolvedRoot, { withFileTypes: true });
    const found = [];
    for (const entry of entries) {
        if (entry.isDirectory() === false) {
            continue;
        }
        found.push(...await findWwwrootDirs(path.join(resolvedRoot, entry.name)));
    }
    return found;
}

module.exports = { findWwwrootDirs };
