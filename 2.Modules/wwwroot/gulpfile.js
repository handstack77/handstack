var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var uglifycss = require('gulp-uglifycss');
var rename = require("gulp-rename");

gulp.task('scripts', async function () {
    return gulp.src([
        'wwwroot/lib/tabler@1.0.0-beta20/js/tabler.min.js',
        'wwwroot/lib/jquery-3.6.0/jquery-3.6.0.js',
        'wwwroot/lib/jquery.alertmodal.js',
        'wwwroot/lib/jquery.simplemodal.js',
        'wwwroot/lib/jquery.maskedinput-1.3.js',
        'wwwroot/lib/jquery.WM.js',
        'wwwroot/lib/papaparse-5.3.0/papaparse.js',
        'wwwroot/lib/sheetjs-0.16.8/xlsx.core.min.js',
        'wwwroot/lib/handsontable-13.1.0/dist/handsontable.full.js',
        'wwwroot/lib/handsontable-13.1.0/languages/ko-KR.js',
        'wwwroot/lib/color-picker-1.0.0/color-picker.js',
        'wwwroot/lib/ispin-2.0.1/ispin.js',
        'wwwroot/lib/pikaday-1.8.0/pikaday.js',
        'wwwroot/lib/superplaceholder-1.0.0/superplaceholder.js',
        'wwwroot/lib/tail.select-0.5.15/js/tail.select.js',
        'wwwroot/lib/vanilla-masker-1.1.1/vanilla-masker.js',
        'wwwroot/lib/codemirror-5.50.2/codemirror.js',
        'wwwroot/lib/download-4.21/download.js',
        'wwwroot/lib/mustache-4.2.0/mustache.js',
        'wwwroot/lib/printjs-1.6.0/print.min.js',
        'wwwroot/lib/notifier-1.0.0/notifier.js',
        'wwwroot/lib/master@1.37.8/master-css.min.js'
    ])
        .pipe(concat('syn.scripts.js'))
        .pipe(gulp.dest('wwwroot/js'))
        .pipe(uglify({
            mangle: true,
            compress: true
        }))
        .pipe(rename({
            basename: "syn.scripts.min",
            extname: ".js"
        }))
        .pipe(gulp.dest('wwwroot/js'));
});

gulp.task('controls', async function () {
    return gulp.src([
        'wwwroot/uicontrols/CheckBox/CheckBox.js',
        'wwwroot/uicontrols/CodePicker/CodePicker.js',
        'wwwroot/uicontrols/ColorPicker/ColorPicker.js',
        'wwwroot/uicontrols/ContextMenu/ContextMenu.js',
        'wwwroot/uicontrols/DataSource/DataSource.js',
        'wwwroot/uicontrols/DatePicker/DatePicker.js',
        'wwwroot/uicontrols/DropDownCheckList/DropDownCheckList.js',
        'wwwroot/uicontrols/DropDownList/DropDownList.js',
        'wwwroot/uicontrols/FileClient/FileClient.js',
        'wwwroot/uicontrols/RadioButton/RadioButton.js',
        'wwwroot/uicontrols/TextArea/TextArea.js',
        'wwwroot/uicontrols/TextBox/TextBox.js',
        'wwwroot/uicontrols/TextButton/TextButton.js',
        'wwwroot/uicontrols/SourceEditor/SourceEditor.js',
        'wwwroot/uicontrols/HtmlEditor/HtmlEditor.js',
        'wwwroot/uicontrols/TreeView/TreeView.js',
        'wwwroot/uicontrols/WebGrid/WebGrid.js',
        'wwwroot/uicontrols/Element/Element.js'
    ])
        .pipe(concat('syn.controls.js'))
        .pipe(gulp.dest('wwwroot/js'))
        .pipe(uglify({
            mangle: true,
            compress: true
        }))
        .pipe(rename({
            basename: "syn.controls.min",
            extname: ".js"
        }))
        .pipe(gulp.dest('wwwroot/js'));
});

gulp.task('styles', async function () {
    return gulp.src([
        // syn.scripts.js
        'wwwroot/lib/tabler@1.0.0-beta20/css/tabler.syn.css',
        'wwwroot/lib/handsontable-13.1.0/dist/handsontable.full.css',
        'wwwroot/lib/tail.select-0.5.15/css/default/tail.select-light.css',
        'wwwroot/lib/ispin-2.0.1/ispin.css',
        'wwwroot/lib/css-checkbox-1.0.0/checkboxes.css',
        'wwwroot/lib/color-picker-1.0.0/color-picker.css',
        'wwwroot/lib/codemirror-5.50.2/codemirror.css',
        'wwwroot/lib/notifier-1.0.0/notifier.css',

        // syn.domain.js
        'wwwroot/css/layouts/Dialogs.css',
        'wwwroot/css/layouts/LoadingPage.css',
        'wwwroot/css/layouts/ProgressBar.css',
        'wwwroot/css/layouts/Tooltips.css',
        'wwwroot/css/layouts/WindowManager.css',
        'wwwroot/css/uicontrols/Control.css',

        // syn.controls.js
        'wwwroot/uicontrols/CheckBox/CheckBox.css',
        'wwwroot/uicontrols/ColorPicker/ColorPicker.css',
        'wwwroot/uicontrols/ContextMenu/ContextMenu.css',
        'wwwroot/uicontrols/DataSource/DataSource.css',
        'wwwroot/uicontrols/DatePicker/DatePicker.css',
        'wwwroot/uicontrols/DropDownCheckList/DropDownCheckList.css',
        'wwwroot/uicontrols/DropDownList/DropDownList.css',
        'wwwroot/uicontrols/FileClient/FileClient.css',
        'wwwroot/uicontrols/RadioButton/RadioButton.css',
        'wwwroot/uicontrols/TextArea/TextArea.css',
        'wwwroot/uicontrols/TextBox/TextBox.css',
        'wwwroot/uicontrols/TextButton/TextButton.css',
        'wwwroot/uicontrols/SourceEditor/SourceEditor.css',
        'wwwroot/uicontrols/HtmlEditor/HtmlEditor.css',
        'wwwroot/uicontrols/TreeView/TreeView.css',
        'wwwroot/uicontrols/WebGrid/WebGrid.css',

        // 프로젝트 화면 디자인
        'wwwroot/css/base.css',
        'wwwroot/css/tabler-icons.css',
    ])
        .pipe(concat('syn.bundle.css'))
        .pipe(gulp.dest('wwwroot/css'))
        .pipe(uglifycss({
            "uglyComments": true
        }))
        .pipe(rename({
            basename: "syn.bundle.min",
            extname: ".css"
        }))
        .pipe(gulp.dest('wwwroot/css'));
});

gulp.task('watch', async function () {
    gulp.watch(files, gulp.series(['controls']));
});

gulp.task('default', gulp.series(['controls', 'scripts', 'styles']));
