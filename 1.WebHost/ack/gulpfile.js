var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var uglifycss = require('gulp-uglifycss');
var rename = require("gulp-rename");
var javascriptObfuscator = require('gulp-javascript-obfuscator');
var fs = require('fs/promises');
var path = require('path');

gulp.task('css', async function () {
    gulp.src('wwwroot/assets/css/**/*.css')
        .pipe(uglifycss({
            "maxLineLen": 80,
            "uglyComments": true
        }))
        .pipe(concat('syn.css'))
        .pipe(gulp.dest('wwwroot/assets/css'));
});

gulp.task('scripts', async function () {
    const sources = [
        'wwwroot/assets/src/syn.core.js',
        'wwwroot/assets/src/syn.browser.js',
        'wwwroot/assets/src/syn.manipulation.js',
        'wwwroot/assets/src/syn.dimension.js',
        'wwwroot/assets/src/syn.cryptography.js',
        'wwwroot/assets/src/syn.keyboard.js',
        'wwwroot/assets/src/syn.vaildation.js',
        'wwwroot/assets/src/syn.extension.js',
        'wwwroot/assets/src/syn.library.js',
        'wwwroot/assets/src/syn.request.js',
        'wwwroot/assets/src/syn.network.js',
        'wwwroot/assets/src/syn.webform.js',
        'wwwroot/assets/src/syn.print.js',
        'wwwroot/assets/src/syn.resource.js',
        'wwwroot/assets/src/lang/syn.resource.ko-KR.js',
    ];

    await new Promise((resolve, reject) => {
        gulp.src(sources)
            .pipe(concat('syn.js'))
            .pipe(gulp.dest('wwwroot/assets/js'))
            .on('end', resolve)
            .on('error', reject);
    });

    const outDir = 'wwwroot/assets/js';
    const synPath = path.join(outDir, 'syn.js');
    const modulePath = path.join(outDir, 'module.js');

    let content = await fs.readFile(synPath, 'utf8');

    content += `
export const $date = globalRoot.$date;
export const $array = globalRoot.$array;
export const $string = globalRoot.$string;
export const $number = globalRoot.$number;
export const $object = globalRoot.$object;
export const $b = syn.$b;
export const $m = syn.$m;
export const $d = syn.$d;
export const $c = syn.$c;
export const $k = syn.$k;
export const $v = syn.$v;
export const $l = syn.$l;
export const $r = syn.$r;
export const $n = syn.$n;
export const $w = syn.$w;
export const $p = syn.$p;
export const $res = syn.$res;

export { syn, Module, globalRoot };
export default syn;
`;

    await fs.writeFile(modulePath, content, 'utf8');
});

gulp.task('nodescripts', async function () {
    return gulp.src([
        'wwwroot/assets/src/syn.core.js',
        'wwwroot/assets/src/syn.cryptography.js',
        'wwwroot/assets/src/syn.extension.js',
        'wwwroot/assets/src/syn.library.js',
        'wwwroot/assets/src/syn.request.js',
        'wwwroot/assets/src/syn.webform.js',
        'wwwroot/assets/src/syn.print.js',
        'wwwroot/assets/src/syn.system.js',
        'wwwroot/assets/src/syn.exports.js',
    ])
        .pipe(concat('index.js'))
        .pipe(gulp.dest('wwwroot/assets/js'));
});

gulp.task('obfusesyn', async function () {
    return gulp.src([
        'wwwroot/assets/js/syn.js'
    ])
        .pipe(javascriptObfuscator({
            compact: true
        }))
        .pipe(rename({
            basename: "syn.min",
            extname: ".js"
        }))
        .pipe(gulp.dest('wwwroot/assets/js'));
});

gulp.task('uglifysyn', async function () {
    return gulp.src([
        'wwwroot/assets/js/syn.js'
    ])
        .pipe(uglify({
            mangle: true,
            compress: true
        }))
        .pipe(rename({
            basename: "syn.min",
            extname: ".js"
        }))
        .pipe(gulp.dest('wwwroot/assets/js'));
});

gulp.task('uglifymodule', async function () {
    return gulp.src([
        'wwwroot/assets/js/module.js'
    ])
        .pipe(uglify({
            mangle: true,
            compress: true
        }))
        .pipe(rename({
            basename: "module.min",
            extname: ".js"
        }))
        .pipe(gulp.dest('wwwroot/assets/js'));
});

gulp.task('uglifyindex', async function () {
    return gulp.src([
        'wwwroot/assets/js/index.js'
    ])
        .pipe(uglify({
            mangle: true,
            compress: true
        }))
        .pipe(rename({
            basename: "index.min",
            extname: ".js"
        }))
        .pipe(gulp.dest('wwwroot/assets/js'));
});

gulp.task('watch', async function () {
    gulp.watch(files, gulp.series(['scripts', 'uglifysyn', 'uglifymodule', 'nodescripts', 'uglifyindex']));
});

gulp.task('default', gulp.series(['scripts', 'uglifysyn', 'uglifymodule', 'nodescripts', 'uglifyindex']));
gulp.task('syn', gulp.series(['scripts', 'uglifysyn', 'uglifymodule']));
gulp.task('nodejs', gulp.series(['nodescripts', 'uglifyindex']));
