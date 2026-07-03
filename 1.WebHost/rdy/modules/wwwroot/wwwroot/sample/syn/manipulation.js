'use strict';
let $manipulation = {
    extends: [
        'parsehtml'
    ],

    hook: {
        pageLoad() {
            syn.$l.get('txt_version').value = syn.$m.version;
        }
    },

    event: {
        btn_childNodes_click() {
            var childNodes = syn.$m.childNodes(document.body);
            var nodes = [];
            for (var i = 0, length = childNodes.length; i < length; i++) {
                nodes.push(childNodes[i].nodeName + '\n');
            }

            syn.$l.get('txt_childNodes').value = nodes.join('');
        },

        btn_children_click() {
            var children = syn.$m.children(document.body);
            var nodes = [];
            for (var i = 0, length = children.length; i < length; i++) {
                nodes.push(children[i].nodeName + '\n');
            }

            syn.$l.get('txt_children').value = nodes.join('');
        },

        btn_firstChild_click() {
            syn.$l.get('txt_firstChild').value = syn.$m.firstChild(document.body);
        },

        btn_firstElementChild_click() {
            syn.$l.get('txt_firstElementChild').value = syn.$m.firstElementChild(document.body);
        },

        btn_lastChild_click() {
            syn.$l.get('txt_lastChild').value = syn.$m.lastChild(document.body);
        },

        btn_lastElementChild_click() {
            syn.$l.get('txt_lastElementChild').value = syn.$m.lastElementChild(document.body);
        },

        btn_nextSibling1_click() {
            syn.$l.get('txt_nextSibling').value = '';
            syn.$l.get('txt_nextSibling').value = syn.$m.nextSibling('nextSibling_item1').nodeName;
        },

        btn_nextSibling2_click() {
            syn.$l.get('txt_nextSibling').value = '';
            syn.$l.get('txt_nextSibling').value = syn.$m.nextSibling('nextSibling_item2').nodeName;
        },

        btn_nextElementSibling1_click() {
            syn.$l.get('txt_nextElementSibling').value = '';
            syn.$l.get('txt_nextElementSibling').value = syn.$m.nextElementSibling('nextElementSibling_item1').nodeName;
        },

        btn_nextElementSibling2_click() {
            syn.$l.get('txt_nextElementSibling').value = '';
            syn.$l.get('txt_nextElementSibling').value = syn.$m.nextElementSibling('nextElementSibling_item2').nodeName;
        },

        btn_previousSibling1_click() {
            syn.$l.get('txt_previousSibling').value = '';
            syn.$l.get('txt_previousSibling').value = syn.$m.previousSibling('previousSibling_item1').nodeName;
        },

        btn_previousSibling2_click() {
            syn.$l.get('txt_previousSibling').value = '';
            syn.$l.get('txt_previousSibling').value = syn.$m.previousSibling('previousSibling_item2').nodeName;
        },

        btn_previousElementSibling1_click() {
            syn.$l.get('txt_previousElementSibling').value = '';
            syn.$l.get('txt_previousElementSibling').value = syn.$m.previousElementSibling('previousElementSibling_item1').nodeName;
        },

        btn_previousElementSibling2_click() {
            syn.$l.get('txt_previousElementSibling').value = '';
            syn.$l.get('txt_previousElementSibling').value = syn.$m.previousElementSibling('previousElementSibling_item2').nodeName;
        },

        btn_siblings_click() {
            var siblingELs = syn.$m.siblings('btn_parentNode');
            var nodes = [];
            for (var i = 0, length = siblingELs.length; i < length; i++) {
                nodes.push(siblingELs[i].nodeName + '\n');
            }

            syn.$l.get('txt_siblings').value = nodes.join('');
        },

        btn_parentNode_click() {
            syn.$l.get('txt_parentNode').value = syn.$m.parentNode(document.body).nodeName;
        },

        btn_parentElement_click() {
            syn.$l.get('txt_parentElement').value = syn.$m.parentElement(document.body).nodeName;
        },

        btn_value_click() {
            syn.$m.value('txt_value', 'hello world');
        },

        btn_textContent_click() {
            syn.$m.textContent('div_textContent', 'hello world');
        },

        btn_innerText_click() {
            syn.$m.innerText('div_innerText', 'hello world');
        },

        btn_innerHTML_click() {
            syn.$m.innerHTML('div_innerHTML', '<b style="color: red;">hello world</b>');
        },

        btn_outerHTML_click() {
            syn.$l.get('txt_outerHTML').value =syn.$m.outerHTML('div_outerHTML');
        },

        btn_className_click() {
            syn.$l.get('txt_className').value = syn.$m.className('btn_className');
        },

        btn_removeAttribute_click() {
            syn.$l.get('txt_attribute').value = '';
            syn.$m.removeAttribute('txt_attribute', 'custom1');
        },

        btn_getAttribute_click() {
            syn.$l.get('txt_attribute').value = syn.$m.getAttribute('txt_attribute', 'custom1');
        },

        btn_setAttribute_click() {
            syn.$m.setAttribute('txt_attribute', 'custom1', 'hello world');
        },

        btn_appendChild_click() {
            var el = document.createElement('LI');
            el.textContent = 'Grape';
            syn.$m.appendChild('myList', el);
        },

        btn_setStyle_click() {
            syn.$m.setStyle('div_setStyle', 'color', 'red');
        },

        btn_addStyle_click() {
            syn.$m.addStyle('div_addStyle', { backgroundColor: 'blue', color: 'white', border: '2px solid red' });
        },

        btn_addCssText_click() {
            syn.$m.addCssText('div_addCssText', 'background-color: lightblue;');
        },

        btn_getStyle_click() {
            syn.$l.get('txt_getStyle').value = syn.$m.getStyle('div_getStyle', 'border');
        },

        btn_getComputedStyle_click() {
            syn.$l.get('txt_getComputedStyle').value = syn.$m.getComputedStyle('txt_getComputedStyle', 'border');
        },

        btn_hasHidden_click() {
            syn.$l.get('txt_hasHidden').value = syn.$m.hasHidden('txt_hasHidden');
        },

        btn_addClass_click() {
            syn.$m.addClass('div_className', syn.$l.get('txt_className1').value);
        },

        btn_hasClass_click() {
            syn.$l.get('txt_className1').value = syn.$m.hasClass('div_className', syn.$l.get('txt_className1').value);
        },

        btn_toggleClass_click() {
            syn.$m.toggleClass('div_className', syn.$l.get('txt_className1').value);
        },

        btn_removeClass_click() {
            syn.$m.removeClass('div_className', syn.$l.get('txt_className1').value);
        },

        btn_append_click() {
            syn.$m.append('div_append', 'input', 'txt' + syn.$l.random(), {
                styles: {
                    display: 'block',
                    color: 'red'
                },
                classNames: 'f:32 mb-2',
                value: 'hello world',
                text: 'hello world',
                content: 'hello world',
                html: 'hello world'
            });
        },

        btn_prepend_click() {
            var value = $date.toString(new Date(), 'a');
            var divEL = syn.$m.create({
                tag: 'div',
                styles: {
                    display: 'block',
                    color: 'red'
                },
                attributes: {
                    custom1: 'custom1',
                    readonly: 'readonly'
                },
                data: {
                    data1: 'data1',
                    data2: 'data2',
                    data3: 'data3'
                },
                className: 'form-control',
                classNames: 'f:32 mb-2',
                value: value,
                text: value,
                content: value,
                html: value
            });
            syn.$m.prepend(divEL, 'div_prepend');
        },

        btn_copy_click() {
            var copyEL = syn.$m.copy('div_copy');
            syn.$l.get('txt_copy').value = copyEL.outerHTML;
            copyEL.innerHTML = '';
        },

        btn_remove_click() {
            syn.$m.remove('div_remove');
        },

        btn_hasChild_click() {
            syn.$l.get('txt_hasChild').value = syn.$m.hasChild('txt_hasChild');
        },

        btn_insertAfter_click() {
            var divEL = syn.$m.create({
                text: $date.toString(new Date(), 'a'),
            });
            syn.$m.insertAfter(divEL, 'div_insertAfter');
        },

        btn_display_click() {
            syn.$m.display('div_display', syn.$l.get('chk_display').checked);
        },

        btn_toggleDisplay_click() {
            syn.$m.toggleDisplay('div_display');
        },

        btn_parent_click() {
            syn.$l.get('txt_parent').value = syn.$m.parent('btn_parent').outerHTML;
        },

        btn_parentID_click() {
            syn.$l.get('txt_parent').value = syn.$m.parent('btn_parent', 'div_parent').outerHTML;
        },

        btn_create_click() {
            var el = syn.$m.create(JSON.parse(syn.$l.get('txt_createJson').value));
            syn.$l.get('txt_create').value = el.outerHTML;
        },

        btn_each_click() {
            var nodes = [];
            var siblingELs = syn.$m.siblings('btn_parentNode');
            syn.$m.each(siblingELs, (item, index) => {
                nodes.push(`name: ${item.nodeName}, index: ${index}` + '\n');
            });
            syn.$l.get('txt_each').value = nodes.join('');
        },

        btn_setActive_click() {
            syn.$m.setActive('div_setActive', syn.$l.get('chk_setActive').checked);
        },

        btn_setSelected_click(evt) {
            syn.$m.setSelected('opt_setSelected_Item1', true, true);
            syn.$m.setSelected('opt_setSelected_Item2', true, true);
            syn.$m.setSelected('opt_setSelected_Item3', true, true);
        },

        btn_setChecked_click(evt) {
            syn.$m.setChecked('opt_setChecked_Item1', true);
            syn.$m.setChecked('opt_setChecked_Item2', true);
            syn.$m.setChecked('opt_setChecked_Item3', true);
        }
    }
};
