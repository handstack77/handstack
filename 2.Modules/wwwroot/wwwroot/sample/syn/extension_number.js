'use strict';
let $extension_number = {
    extends: [
        'parsehtml'
    ],

    hook: {
        pageLoad() {
            syn.$l.get('txt_version').value = syn.$m.version;
            setTimeout(() => {
                window.scrollTo(0, document.body.scrollHeight);
            }, 200);
        }
    },

    event: {
        btn_duration_click() {
            syn.$l.get('txt_duration').value = $number.duration(100000000);
        },

        btn_toByteString_click() {
            syn.$l.get('txt_toByteString').value = $number.toByteString(100000000);
        },

        btn_random_click() {
            syn.$l.get('txt_random').value = $number.random(1, 10000);
        },

        btn_isRange_click() {
            syn.$l.get('txt_isRange').value = $number.isRange($number.random(1, 100), 30, 80);
        },

        btn_limit_click() {
            syn.$l.get('txt_limit').value = $number.limit($number.random(1, 100), 30, 80);
        },

        btn_percent_click() {
            syn.$l.get('txt_percent').value = $number.percent($number.random(1, 10000), 10000);
        },

        btn_amount_click() {
            syn.$l.get('txt_amount').value = $number.amount(30, 10000);
        },

        btn_aggregate_sum_click() {
            syn.$l.get('txt_aggregate').value = $number.aggregate('SUM', [10, 20, 30, 40]);
        },

        btn_aggregate_avg_click() {
            syn.$l.get('txt_aggregate').value = $number.aggregate('AVG', [10, 20, 30, 40]);
        },

        btn_aggregate_min_click() {
            syn.$l.get('txt_aggregate').value = $number.aggregate('MIN', [10, 20, 30, 40]);
        },

        btn_aggregate_max_click() {
            syn.$l.get('txt_aggregate').value = $number.aggregate('MAX', [10, 20, 30, 40]);
        },

        btn_aggregate_count_click() {
            syn.$l.get('txt_aggregate').value = $number.aggregate('COUNT', [10, 20, 30, 40]);
        },

        btn_aggregate_median_click() {
            syn.$l.get('txt_aggregate').value = $number.aggregate('MEDIAN', [10, 20, 30, 40]);
        }
    }
};
