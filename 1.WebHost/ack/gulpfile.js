var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var uglifycss = require('gulp-uglifycss');
var rename = require("gulp-rename");

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
    return gulp.src([
        'wwwroot/assets/src/syn.core.js',
        'wwwroot/assets/src/syn.browser.js',
        'wwwroot/assets/src/syn.manipulation.js',
        'wwwroot/assets/src/syn.dimension.js',
        'wwwroot/assets/src/syn.crytography.js',
        'wwwroot/assets/src/syn.keyboard.js',
        'wwwroot/assets/src/syn.vaildation.js',
        'wwwroot/assets/src/syn.extension.js',
        'wwwroot/assets/src/syn.library.js',
        'wwwroot/assets/src/syn.request.js',
        'wwwroot/assets/src/syn.network.js',
        'wwwroot/assets/src/syn.webform.js',
        'wwwroot/assets/src/syn.resource.js',
        'wwwroot/assets/src/lang/syn.resource.ko-KR.js',
    ])
        .pipe(concat('syn.js'))
        .pipe(gulp.dest('wwwroot/assets/js'));
});

gulp.task('nodescripts', async function () {
    return gulp.src([
        'wwwroot/assets/src/syn.core.js',
        'wwwroot/assets/src/syn.crytography.js',
        'wwwroot/assets/src/syn.extension.js',
        'wwwroot/assets/src/syn.library.js',
        'wwwroot/assets/src/syn.request.js',
        'wwwroot/assets/src/syn.webform.js',
        'wwwroot/assets/src/syn.resource.js',
        'wwwroot/assets/src/lang/syn.resource.ko-KR.js',
        'wwwroot/assets/src/syn.system.js',
        'wwwroot/assets/src/syn.exports.js',
    ])
        .pipe(concat('index.js'))
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
    gulp.watch(files, gulp.series(['scripts', 'uglifysyn', 'nodescripts', 'uglifyindex']));
});

gulp.task('default', gulp.series(['scripts', 'uglifysyn', 'nodescripts', 'uglifyindex']));
gulp.task('syn', gulp.series(['scripts', 'uglifysyn']));
gulp.task('nodejs', gulp.series(['nodescripts', 'uglifyindex']));
