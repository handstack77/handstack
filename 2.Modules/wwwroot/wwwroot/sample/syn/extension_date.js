'use strict';
let $extension_date = {
    extends: [
        'parsehtml'
    ],

    hook: {
        pageLoad() {
            syn.$l.get('txt_version').value = syn.$m.version;
            syn.$l.get('txt_interval').value = JSON.stringify($date.interval);

            setTimeout(() => {
                window.scrollTo(0, document.body.scrollHeight);
            }, 200);
        }
    },

    event: {
        btn_now_click() {
            syn.$l.get('txt_now').value = $date.now().toString();
        },

        btn_clone_click() {
            var date = $date.now();
            var cloneDate = $date.clone(date);
            syn.$l.get('txt_clone').value = cloneDate.toString();
        },

        btn_isBetween_click() {
            var date = $date.now();
            syn.$l.get('txt_isBetween').value = $date.isBetween(date, new Date('2023-10-22T03:24:00'), new Date('2023-12-31T03:24:00'))
        },

        btn_equals_click() {
            var date = $date.now();
            var cloneDate = $date.clone(date);
            syn.$l.get('txt_equals').value = $date.equals(date, cloneDate);
        },

        btn_equalDay_click() {
            var date = $date.now();
            var cloneDate = $date.clone(date);
            syn.$l.get('txt_equalDay').value = $date.equalDay(date, cloneDate);
        },

        btn_isToday_click() {
            var date = $date.now();
            syn.$l.get('txt_isToday').value = $date.isToday(date);
        },

        btn_toString_d_click() {
            var date = $date.now();
            syn.$l.get('txt_toString').value = $date.toString(date, 'd');
        },

        btn_toString_t_click() {
            var date = $date.now();
            syn.$l.get('txt_toString').value = $date.toString(date, 't');
        },

        btn_toString_a_click() {
            var date = $date.now();
            syn.$l.get('txt_toString').value = $date.toString(date, 'a');
        },

        btn_toString_f_click() {
            var date = $date.now();
            syn.$l.get('txt_toString').value = $date.toString(date, 'f');
        },

        btn_toString_s_click() {
            var date = $date.now();
            syn.$l.get('txt_toString').value = $date.toString(date, 's');
        },

        btn_toString_n_click() {
            var date = $date.now();
            syn.$l.get('txt_toString').value = $date.toString(date, 'n');
        },

        btn_toString_mdn_click() {
            var date = $date.now();
            syn.$l.get('txt_toString').value = $date.toString(date, 'mdn');
        },

        btn_toString_w_click() {
            var date = $date.now();
            syn.$l.get('txt_toString').value = $date.toString(date, 'w');
        },

        btn_toString_wn_click() {
            var date = $date.now();
            syn.$l.get('txt_toString').value = $date.toString(date, 'wn');
        },

        btn_toString_m_click() {
            var date = $date.now();
            syn.$l.get('txt_toString').value = $date.toString(date, 'm');
        },

        btn_toString_ym_click() {
            var date = $date.now();
            syn.$l.get('txt_toString').value = $date.toString(date, 'ym');
        },

        btn_toString_day_click() {
            var date = $date.now();
            syn.$l.get('txt_toString').value = $date.toString(date);
        },

        btn_addSecond_click() {
            var date = $date.now();
            syn.$l.get('txt_toTimeCount').value = $date.addSecond(date, 1).toString();
        },

        btn_addMinute_click() {
            var date = $date.now();
            syn.$l.get('txt_toTimeCount').value = $date.addMinute(date, 1).toString();
        },

        btn_addHour_click() {
            var date = $date.now();
            syn.$l.get('txt_toTimeCount').value = $date.addHour(date, 1).toString();
        },

        btn_addDay_click() {
            var date = $date.now();
            syn.$l.get('txt_toTimeCount').value = $date.addDay(date, 1).toString();
        },

        btn_addWeek_click() {
            var date = $date.now();
            syn.$l.get('txt_toTimeCount').value = $date.addWeek(date, 1).toString();
        },

        btn_addMonth_click() {
            var date = $date.now();
            syn.$l.get('txt_toTimeCount').value = $date.addMonth(date, 1).toString();
        },

        btn_addYear_click() {
            var date = $date.now();
            syn.$l.get('txt_toTimeCount').value = $date.addYear(date, 1).toString();
        },

        btn_getFirstDate_click() {
            var date = $date.now();
            syn.$l.get('txt_getFirstLastDate').value = $date.getFirstDate(date).toString();
        },

        btn_getLastDate_click() {
            var date = $date.now();
            syn.$l.get('txt_getFirstLastDate').value = $date.getLastDate(date).toString();
        },

        btn_diff_second_click() {
            var date = $date.now();
            var diffDate = $date.addSecond(date, 10);
            syn.$l.get('txt_toDiffCount').value = $date.diff(date, diffDate, 'second').toString();
        },

        btn_diff_minute_click() {
            var date = $date.now();
            var diffDate = $date.addMinute(date, 1);
            syn.$l.get('txt_toDiffCount').value = $date.diff(date, diffDate, 'minute').toString();
        },

        btn_diff_hour_click() {
            var date = $date.now();
            var diffDate = $date.addHour(date, 1);
            syn.$l.get('txt_toDiffCount').value = $date.diff(date, diffDate, 'hour').toString();
        },

        btn_diff_day_click() {
            var date = $date.now();
            var diffDate = $date.addDay(date, 1);
            syn.$l.get('txt_toDiffCount').value = $date.diff(date, diffDate, 'day').toString();
        },

        btn_diff_week_click() {
            var date = $date.now();
            var diffDate = $date.addWeek(date, 1);
            syn.$l.get('txt_toDiffCount').value = $date.diff(date, diffDate, 'week').toString();
        },

        btn_diff_month_click() {
            var date = $date.now();
            var diffDate = $date.addMonth(date, 1);
            syn.$l.get('txt_toDiffCount').value = $date.diff(date, diffDate, 'month').toString();
        },

        btn_diff_year_click() {
            var date = $date.now();
            var diffDate = $date.addYear(date, 1);
            syn.$l.get('txt_toDiffCount').value = $date.diff(date, diffDate, 'year').toString();
        },

        btn_toTicks_click() {
            var date = $date.now();
            syn.$l.get('txt_toTicks').value = $date.toTicks(date);
        },

        btn_isDate_click() {
            syn.$l.get('txt_isDate').value = $date.isDate('2023-12-31T00:00:00');
        },

        btn_isISOString_click() {
            syn.$l.get('txt_isISOString').value = $date.isISOString('2023-12-11T01:51:53.115Z');
        },

        btn_weekOfMonth_click() {
            var weekOfMonths = $date.weekOfMonth(2023, 12);
            syn.$l.get('txt_weekOfMonth').value = JSON.stringify(weekOfMonths);
        },
    },
};
