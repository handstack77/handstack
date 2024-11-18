var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var uglifycss = require('gulp-uglifycss');
var rename = require('gulp-rename');
var javascriptObfuscator = require('gulp-javascript-obfuscator');

gulp.task('scripts', async function () {
    return gulp.src([
        'wwwroot/lib/tabler-core/dist/js/tabler.min.js',
        'wwwroot/lib/jquery/jquery.js',
        'wwwroot/js/jquery.alertmodal/jquery.alertmodal.js',
        'wwwroot/lib/jquery-simplemodal/src/jquery.simplemodal.js',
        'wwwroot/lib/jquery.maskedinput/jquery.maskedinput.js',
        'wwwroot/js/jquery-wm/jquery.WM.js',
        "wwwroot/js/jquery-ui-contextmenu/jquery-ui.js",
        "wwwroot/js/jquery-ui-contextmenu/jquery.ui-contextmenu.js",
        "wwwroot/lib/orgchart/js/jquery.orgchart.js",
        "wwwroot/lib/fancytree/jquery.fancytree-all-deps.js",
        'wwwroot/lib/papaparse/papaparse.js',
        'wwwroot/lib/xlsx/xlsx.core.min.js',
        'wwwroot/lib/handsontable/dist/handsontable.full.js',
        'wwwroot/lib/handsontable/languages/ko-KR.js',
        "wwwroot/js/datatable/datatables.js",
        "wwwroot/js/datatable/dataTables.checkboxes.js",
        "wwwroot/lib/chart.js/chart.umd.js",
        "wwwroot/js/chart-utils/chart-utils.min.js",
        'wwwroot/js/color-picker/color-picker.js',
        'wwwroot/lib/ispin/dist/ispin.js',
        'wwwroot/lib/moment.js/moment.js',
        'wwwroot/lib/pikaday/pikaday.js',
        'wwwroot/lib/popper.js/umd/popper.js',
        'wwwroot/lib/tippy.js/tippy-bundle.umd.js',
        'wwwroot/lib/intro.js/intro.js',
        'wwwroot/lib/superplaceholder/superplaceholder.js',
        'wwwroot/lib/tail.select.js/js/tail.select.js',
        'wwwroot/lib/vanilla-masker/vanilla-masker.min.js',
        'wwwroot/lib/codemirror/codemirror.js',
        'wwwroot/lib/downloadjs/download.js',
        'wwwroot/lib/mustache/mustache.js',
        "wwwroot/lib/pdfobject/pdfobject.js",
        "wwwroot/lib/print-js/print.min.js",
        'wwwroot/js/notifier/notifier.js',
        'wwwroot/lib/master-css/index.js'
    ], { allowEmpty: true })
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

gulp.task('basescripts', async function () {
    return gulp.src([
        'wwwroot/lib/jquery/jquery.js',
        'wwwroot/js/jquery.alertmodal/jquery.alertmodal.js',
        'wwwroot/lib/jquery-simplemodal/src/jquery.simplemodal.js',
        'wwwroot/lib/jquery.maskedinput/jquery.maskedinput.js',
        'wwwroot/js/jquery-wm/jquery.WM.js',
        "wwwroot/js/jquery-ui-contextmenu/jquery-ui.js",
        "wwwroot/js/jquery-ui-contextmenu/jquery.ui-contextmenu.js",
        "wwwroot/lib/orgchart/js/jquery.orgchart.js",
        "wwwroot/lib/fancytree/jquery.fancytree-all-deps.js",
        'wwwroot/lib/papaparse/papaparse.js',
        'wwwroot/lib/xlsx/xlsx.core.min.js',
        'wwwroot/lib/handsontable/dist/handsontable.full.js',
        'wwwroot/lib/handsontable/languages/ko-KR.js',
        "wwwroot/js/datatable/datatables.js",
        "wwwroot/js/datatable/dataTables.checkboxes.js",
        "wwwroot/lib/chart.js/chart.umd.js",
        "wwwroot/js/chart-utils/chart-utils.min.js",
        'wwwroot/js/color-picker/color-picker.js',
        'wwwroot/lib/ispin/dist/ispin.js',
        'wwwroot/lib/moment.js/moment.js',
        'wwwroot/lib/pikaday/pikaday.js',
        'wwwroot/lib/popper.js/umd/popper.js',
        'wwwroot/lib/tippy.js/tippy-bundle.umd.js',
        'wwwroot/lib/intro.js/intro.js',
        'wwwroot/lib/superplaceholder/superplaceholder.js',
        'wwwroot/lib/tail.select.js/js/tail.select.js',
        'wwwroot/lib/vanilla-masker/vanilla-masker.min.js',
        'wwwroot/lib/codemirror/codemirror.js',
        'wwwroot/lib/downloadjs/download.js',
        'wwwroot/lib/mustache/mustache.js',
        "wwwroot/lib/pdfobject/pdfobject.js",
        "wwwroot/lib/print-js/print.min.js",
        'wwwroot/js/notifier/notifier.js',
        'wwwroot/lib/master-css/index.js'
    ])
        .pipe(concat('syn.scripts.base.js'))
        .pipe(gulp.dest('wwwroot/js'))
        .pipe(uglify({
            mangle: true,
            compress: true
        }))
        .pipe(rename({
            basename: "syn.scripts.base.min",
            extname: ".js"
        }))
        .pipe(gulp.dest('wwwroot/js'));
});

gulp.task('controls', async function () {
    return gulp.src([
        'wwwroot/uicontrols/Chart/Chart.js',
        'wwwroot/uicontrols/CheckBox/CheckBox.js',
        'wwwroot/uicontrols/CodePicker/CodePicker.js',
        'wwwroot/uicontrols/ColorPicker/ColorPicker.js',
        'wwwroot/uicontrols/ContextMenu/ContextMenu.js',
        'wwwroot/uicontrols/DataSource/DataSource.js',
        'wwwroot/uicontrols/DatePicker/DatePicker.js',
        'wwwroot/uicontrols/DatePeriodPicker/DatePeriodPicker.js',
        'wwwroot/uicontrols/DropDownCheckList/DropDownCheckList.js',
        'wwwroot/uicontrols/DropDownList/DropDownList.js',
        'wwwroot/uicontrols/FileClient/FileClient.js',
        'wwwroot/uicontrols/GridList/GridList.js',
        'wwwroot/uicontrols/Guide/Guide.js',
        'wwwroot/uicontrols/RadioButton/RadioButton.js',
        'wwwroot/uicontrols/TextArea/TextArea.js',
        'wwwroot/uicontrols/TextBox/TextBox.js',
        'wwwroot/uicontrols/SourceEditor/SourceEditor.js',
        'wwwroot/uicontrols/HtmlEditor/HtmlEditor.js',
        'wwwroot/uicontrols/OrganizationView/OrganizationView.js',
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

gulp.task('obfusecontrols', async function () {
    return gulp.src([
        'wwwroot/uicontrols/Chart/Chart.js',
        'wwwroot/uicontrols/CheckBox/CheckBox.js',
        'wwwroot/uicontrols/CodePicker/CodePicker.js',
        'wwwroot/uicontrols/ColorPicker/ColorPicker.js',
        'wwwroot/uicontrols/ContextMenu/ContextMenu.js',
        'wwwroot/uicontrols/DataSource/DataSource.js',
        'wwwroot/uicontrols/DatePicker/DatePicker.js',
        'wwwroot/uicontrols/DatePeriodPicker/DatePeriodPicker.js',
        'wwwroot/uicontrols/DropDownCheckList/DropDownCheckList.js',
        'wwwroot/uicontrols/DropDownList/DropDownList.js',
        'wwwroot/uicontrols/FileClient/FileClient.js',
        'wwwroot/uicontrols/GridList/GridList.js',
        'wwwroot/uicontrols/Guide/Guide.js',
        'wwwroot/uicontrols/RadioButton/RadioButton.js',
        'wwwroot/uicontrols/TextArea/TextArea.js',
        'wwwroot/uicontrols/TextBox/TextBox.js',
        'wwwroot/uicontrols/SourceEditor/SourceEditor.js',
        'wwwroot/uicontrols/HtmlEditor/HtmlEditor.js',
        'wwwroot/uicontrols/OrganizationView/OrganizationView.js',
        'wwwroot/uicontrols/TreeView/TreeView.js',
        'wwwroot/uicontrols/WebGrid/WebGrid.js',
        'wwwroot/uicontrols/Element/Element.js'
    ])
        .pipe(concat('syn.controls.js'))
        .pipe(gulp.dest('wwwroot/js'))
        .pipe(javascriptObfuscator({
            compact: true
        }))
        .pipe(rename({
            basename: "syn.controls.min",
            extname: ".js"
        }))
        .pipe(gulp.dest('wwwroot/js'));
});

gulp.task('bundle', async function () {
    return gulp.src([
        'wwwroot/js/syn.scripts.js',
        'wwwroot/js/syn.js',
        'wwwroot/js/syn.controls.js',
    ], { allowEmpty: true })
        .pipe(concat('syn.bundle.js'))
        .pipe(gulp.dest('wwwroot/js'))
        .pipe(uglify({
            mangle: true,
            compress: true
        }))
        .pipe(rename({
            basename: "syn.bundle.min",
            extname: ".js"
        }))
        .pipe(gulp.dest('wwwroot/js'));
});

gulp.task('styles', async function () {
    return gulp.src([
        // syn.scripts.js
        'wwwroot/lib/tabler-core/dist/css/tabler.css',
        'wwwroot/css/tabler-icons.css',
        'wwwroot/lib/handsontable/dist/handsontable.full.css',
        'wwwroot/lib/tail.select.js/css/default/tail.select-light.css',
        'wwwroot/lib/ispin/dist/ispin.css',
        'wwwroot/js/css-checkbox/checkboxes.css',
        'wwwroot/js/color-picker/color-picker.css',
        'wwwroot/lib/codemirror/codemirror.css',
        "wwwroot/lib/fancytree/skin-win8/ui.fancytree.css",
        "wwwroot/js/jquery-ui-contextmenu/jquery-ui.css",
        "wwwroot/lib/orgchart/css/jquery.orgchart.css",
        "wwwroot/lib/print-js/print.min.css",
        'wwwroot/js/notifier/notifier.css',

        // syn.domain.js
        'wwwroot/css/layouts/Dialogs.css',
        'wwwroot/css/layouts/LoadingPage.css',
        'wwwroot/css/layouts/ProgressBar.css',
        'wwwroot/css/layouts/Tooltips.css',
        'wwwroot/css/layouts/WindowManager.css',
        'wwwroot/css/uicontrols/Control.css',

        // syn.controls.js
        'wwwroot/uicontrols/Chart/Chart.css',
        'wwwroot/uicontrols/CheckBox/CheckBox.css',
        'wwwroot/uicontrols/ColorPicker/ColorPicker.css',
        'wwwroot/uicontrols/ContextMenu/ContextMenu.css',
        'wwwroot/uicontrols/DataSource/DataSource.css',
        'wwwroot/uicontrols/DatePicker/DatePicker.css',
        'wwwroot/uicontrols/DatePeriodPicker/DatePeriodPicker.css',
        'wwwroot/uicontrols/DropDownCheckList/DropDownCheckList.css',
        'wwwroot/uicontrols/DropDownList/DropDownList.css',
        'wwwroot/uicontrols/FileClient/FileClient.css',
        'wwwroot/uicontrols/GridList/GridList.css',
        'wwwroot/uicontrols/Guide/Guide.css',
        'wwwroot/uicontrols/RadioButton/RadioButton.css',
        'wwwroot/uicontrols/TextArea/TextArea.css',
        'wwwroot/uicontrols/TextBox/TextBox.css',
        'wwwroot/uicontrols/SourceEditor/SourceEditor.css',
        'wwwroot/uicontrols/HtmlEditor/HtmlEditor.css',
        'wwwroot/uicontrols/OrganizationView/OrganizationView.css',
        'wwwroot/uicontrols/TreeView/TreeView.css',
        'wwwroot/uicontrols/WebGrid/WebGrid.css',

        // 프로젝트 화면 디자인
        'wwwroot/css/base.css',
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


gulp.task('basestyles', async function () {
    return gulp.src([
        // syn.scripts.js
        'wwwroot/lib/handsontable/dist/handsontable.full.css',
        'wwwroot/lib/tail.select.js/css/default/tail.select-light.css',
        'wwwroot/lib/ispin/dist/ispin.css',
        'wwwroot/js/css-checkbox/checkboxes.css',
        'wwwroot/js/color-picker/color-picker.css',
        'wwwroot/lib/codemirror/codemirror.css',
        "wwwroot/lib/fancytree/skin-win8/ui.fancytree.css",
        "wwwroot/js/jquery-ui-contextmenu/jquery-ui.css",
        "wwwroot/lib/orgchart/css/jquery.orgchart.css",
        "wwwroot/lib/print-js/print.min.css",
        'wwwroot/js/notifier/notifier.css',

        // syn.domain.js
        'wwwroot/css/layouts/Dialogs.css',
        'wwwroot/css/layouts/LoadingPage.css',
        'wwwroot/css/layouts/ProgressBar.css',
        'wwwroot/css/layouts/Tooltips.css',
        'wwwroot/css/layouts/WindowManager.css',
        'wwwroot/css/uicontrols/Control.css',

        // syn.controls.js
        'wwwroot/uicontrols/Chart/Chart.css',
        'wwwroot/uicontrols/CheckBox/CheckBox.css',
        'wwwroot/uicontrols/ColorPicker/ColorPicker.css',
        'wwwroot/uicontrols/ContextMenu/ContextMenu.css',
        'wwwroot/uicontrols/DataSource/DataSource.css',
        'wwwroot/uicontrols/DatePicker/DatePicker.css',
        'wwwroot/uicontrols/DatePeriodPicker/DatePeriodPicker.css',
        'wwwroot/uicontrols/DropDownCheckList/DropDownCheckList.css',
        'wwwroot/uicontrols/DropDownList/DropDownList.css',
        'wwwroot/uicontrols/FileClient/FileClient.css',
        'wwwroot/uicontrols/GridList/GridList.css',
        'wwwroot/uicontrols/Guide/Guide.css',
        'wwwroot/uicontrols/RadioButton/RadioButton.css',
        'wwwroot/uicontrols/TextArea/TextArea.css',
        'wwwroot/uicontrols/TextBox/TextBox.css',
        'wwwroot/uicontrols/SourceEditor/SourceEditor.css',
        'wwwroot/uicontrols/HtmlEditor/HtmlEditor.css',
        'wwwroot/uicontrols/OrganizationView/OrganizationView.css',
        'wwwroot/uicontrols/TreeView/TreeView.css',
        'wwwroot/uicontrols/WebGrid/WebGrid.css',
    ])
        .pipe(concat('syn.bundle.base.css'))
        .pipe(gulp.dest('wwwroot/css'))
        .pipe(uglifycss({
            "uglyComments": true
        }))
        .pipe(rename({
            basename: "syn.bundle.base.min",
            extname: ".css"
        }))
        .pipe(gulp.dest('wwwroot/css'));
});

gulp.task('watch', async function () {
    gulp.watch(files, gulp.series(['controls']));
});

gulp.task('default', gulp.series(['controls', 'basescripts', 'basestyles', 'scripts', 'styles', 'bundle']));

gulp.task('base', gulp.series(['controls', 'basescripts', 'basestyles']));
