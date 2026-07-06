'use strict';
let $extension_array = {
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
        btn_distinct_click() {
            var arr = ['Apple', 'Banana', 'Banana', 'Mango', 'Cherry'];
            syn.$l.get('txt_distinct').value = JSON.stringify($array.distinct(arr));
        },

        btn_sort_click() {
            var arr = ['Apple', 'Banana', 'Banana', 'Mango', 'Cherry'];
            syn.$l.get('txt_sort').value = JSON.stringify($array.sort(arr, true));
        },

        btn_objectSort_click() {
            var arr = [{ name: 'Apple', price: 10 }, { name: 'Banana', price: 5 }, , { name: 'Cherry', price: 5 }];
            syn.$l.get('txt_objectSort').value = JSON.stringify($array.objectSort(arr, 'price', true));
        },

        btn_groupBy_click() {
            var arr = [{ name: 'Apple', price: 10 }, { name: 'Banana', price: 5 }, , { name: 'Cherry', price: 5 }];
            syn.$l.get('txt_groupBy').value = JSON.stringify($array.groupBy(arr, 'price'));
        },

        btn_groupBy_length_click() {
            syn.$l.get('txt_groupBy').value = JSON.stringify($array.groupBy(["하나", "둘", "셋"], "length"));
        },

        btn_groupBy_floor_click() {
            syn.$l.get('txt_groupBy').value = JSON.stringify($array.groupBy([9.8, 7.1, 9.2], Math.floor));
        },

        btn_groupBy_predicate_click() {
            var arr = [{ name: 'Apple', price: 10 }, { name: 'Banana', price: 5 }, , { name: 'Cherry', price: 5 }];
            syn.$l.get('txt_groupBy').value = JSON.stringify($array.groupBy(arr, ({ price }) => {
                return price <= 5 ? 'buy' : 'not buy'
            }));
        },

        btn_shuffle_click() {
            syn.$l.get('txt_shuffle').value = JSON.stringify($array.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
        },

        btn_addAt_click() {
            var arr = ['Apple', 'Banana', 'Mango', 'Cherry'];
            syn.$l.get('txt_addAt').value = JSON.stringify($array.addAt(arr, 2, 'hello world'));
        },

        btn_removeAt_click() {
            var arr = ['Apple', 'Banana', 'Mango', 'Cherry'];
            syn.$l.get('txt_removeAt').value = JSON.stringify($array.removeAt(arr, 3));
        },

        btn_contains_click() {
            var arr = ['Apple', 'Banana', 'Mango', 'Cherry'];
            syn.$l.get('txt_contains').value = $array.contains(arr, 'Banana');
        },

        btn_merge_click() {
            var arr = ['Apple', 'Banana', 'Mango', 'Cherry'];
            syn.$l.get('txt_merge').value = JSON.stringify($array.merge(arr, ['Grape', 'Banana', 'BlueBarry']));
        },

        btn_union_click() {
            var arr = ['Apple', 'Banana', 'Mango', 'Cherry'];
            syn.$l.get('txt_union').value = JSON.stringify($array.union(arr, ['Grape', 'Banana', 'BlueBarry']));
        },

        btn_difference_click() {
            var arr = ['Apple', 'Banana', 'Mango', 'Cherry'];
            syn.$l.get('txt_difference').value = JSON.stringify($array.difference(arr, ['Grape', 'Banana', 'BlueBarry']));
        },

        btn_intersect_click() {
            var arr = ['Apple', 'Banana', 'Mango', 'Cherry'];
            syn.$l.get('txt_intersect').value = JSON.stringify($array.intersect(arr, ['Grape', 'Banana', 'BlueBarry']));
        },

        btn_symmetryDifference_click() {
            var arr = ['Apple', 'Banana', 'Mango', 'Cherry'];
            syn.$l.get('txt_symmetryDifference').value = JSON.stringify($array.symmetryDifference(arr, ['Grape', 'Banana', 'BlueBarry']));
        },

        btn_getValue_click() {
            var items = [
                { ParameterName: 'MaxCount', Value: '100' },
                { ParameterName: 'UseYN', Value: 'Y' }
            ];
            syn.$l.get('txt_getValue').value = `${$array.getValue(items, 'MaxCount', '0')}, ${$array.getValue(items, 'NotExists', 'default')}`;
        },

        btn_ranks_click() {
            var arr = [79, 5, 18, 5, 32, 1, 16, 1, 82, 13];
            syn.$l.get('txt_ranks').value = JSON.stringify($array.ranks(arr));
        },

        btn_arraySplit_click() {
            syn.$l.get('txt_arraySplit').value = JSON.stringify($array.split('Apple, Banana ,Mango,Cherry'));
        },
    },
};
