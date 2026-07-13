'use strict';

const path = require('path');
const { minimatch } = require('minimatch');

function toPosix(relativePath) {
    return relativePath.split(path.sep).join('/');
}

function matchesAny(value, patterns) {
    if (!patterns || patterns.length === 0) {
        return false;
    }

    return patterns.some((pattern) => minimatch(value, pattern, { nocase: true, dot: true }));
}

// relativeFilePath 상의 각 디렉토리 세그먼트(이름 또는 상위 경로 전체)가 패턴 중 하나와 일치하면 제외 대상 디렉토리로 판단한다.
function isExcludedDirectory(relativeFilePath, dirPatterns) {
    if (!dirPatterns || dirPatterns.length === 0) {
        return false;
    }

    const segments = toPosix(relativeFilePath).split('/');
    segments.pop();

    for (let index = 0; index < segments.length; index += 1) {
        const segmentName = segments[index];
        const segmentPath = segments.slice(0, index + 1).join('/');
        if (matchesAny(segmentName, dirPatterns) === true || matchesAny(segmentPath, dirPatterns) === true) {
            return true;
        }
    }

    return false;
}

// 파일명 또는 소스 루트 기준 상대 경로가 패턴 중 하나와 일치하면 제외 대상 파일로 판단한다.
function isExcludedFile(relativeFilePath, filePatterns) {
    if (!filePatterns || filePatterns.length === 0) {
        return false;
    }

    const relativePosix = toPosix(relativeFilePath);
    const baseName = path.basename(relativePosix);
    return matchesAny(baseName, filePatterns) === true || matchesAny(relativePosix, filePatterns) === true;
}

module.exports = { isExcludedDirectory, isExcludedFile, toPosix };
