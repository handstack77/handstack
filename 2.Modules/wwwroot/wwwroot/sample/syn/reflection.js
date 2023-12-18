$w.initializeScript({
    btnGetType_click() {
        syn.$l.get('txtGetType').value = $object.getType('txtGetType')
    },
    btnIsDefined_click() {
        syn.$l.get('txtIsDefined').value = $object.isDefined('txtGetType');
    },
    btnIsNull_click() {
        if (pIsNull !== null) {
            syn.$l.get('txtIsNull').value = $object.isNull('pIsNull');
        }
        else
            syn.$l.get('txtIsNull').value = ('isNull!');
    },
    btnIsArray_click() {
        var ar = ['aaa', 'bbb', 'ccc'];
        syn.$l.getElementsById('pIsArray').innerHTML = ar
        syn.$l.get('txtIsArray').value = $object.isArray(ar);
    },
    btnIsDate_click() {
        alert($object.isDate(syn.$l.getElementsById('txtIsDate').value));
    },
    btnIsString_click() {
        var isstring = 'Hello World';
        syn.$l.getElementsById('pIsString').innerHTML = isstring
        syn.$l.get('txtIsString').value = $object.isString(isstring);
    },
    btnIsNumber_click() {
        var isnumber = 123456789;
        syn.$l.getElementsById('pIsNumber').innerHTML = isnumber
        syn.$l.get('txtIsNumber').value = $object.isNumber(isnumber);
    },
    btnIsFunction_click() {
        var isfunc = '$object.isNull';
        syn.$l.getElementsById('pIsFunction').innerHTML = isfunc
        syn.$l.get('txtIsFunction').value = $object.isFunction($object.isNull);
    },
    btnIsObject_click() {
        var member = {
            id: 'h960502',
            name: 'aaa'
        };
        syn.$l.getElementsById('pIsObject').innerHTML = member.name;
        syn.$l.get('txtIsObject').value = $object.isObject(member);
    },
    btnIsBoolean_click() {
        var isbool = true;
        syn.$l.getElementsById('pIsBoolean').innerHTML = isbool
        syn.$l.get('txtIsBoolean').value = $object.isBoolean(isbool);
    },
    btnClone_click() {
        var fruit = {
            apple: 'apple',
            banana: 'banana'
        };
        syn.$l.getElementsById('pClone').innerHTML = fruit.apple
        syn.$l.get('txtClone').value = $object.clone(fruit.apple);
        //cloneNode
    },
    btnMethod_click() {
        var targetObject = () => { };
        $object.method(targetObject, 'addFunc', function() {
            alert('addFunc !');
        });

        targetObject.prototype.addFunc();
    },
})
