(function (context, $res) {
    if (!$res) {
        throw new Error('There are no $res resource objects.');
    }
    $resource.add('localeID', 'en-US');

    $resource.add('progress', 'In progress.');
    $resource.add('append', 'New input status.');
    $resource.add('appendPre', 'In the screen structure.');
    $resource.add('retrieve', 'It was normally inquired.');
    $resource.add('retrieveException', 'A problem generated data by the inquired process.');
    $resource.add('retrievePre', 'During data inquiry.');
    $resource.add('save', 'It was normally preserved.');
    $resource.add('saveException', 'A problem generated data by the preserved process.');
    $resource.add('savePre', 'It\'s being preserved.');
    $resource.add('update', 'It was normally corrected.');
    $resource.add('updateException', 'A problem generated data by the corrected process.');
    $resource.add('updatePre', 'It\'s being corrected.');
    $resource.add('remove', 'It was normally eliminated.');
    $resource.add('removeException', 'A problem generated data by the eliminated process.');
    $resource.add('removePre', 'It\'s eliminated.');
    $resource.add('copyAppend', 'Existence data was copied and it was changed by input status.');
    $resource.add('userInfoNothing', 'A problem occurred to user information.');

    $resource.add('isLogOut', 'Do you log out really?');
    $resource.add('waiting', 'Please wait only a moment...');
    $resource.add('notElemnet', 'Control wasn\'t found. Please check a query and the HyperText Markup Language design.');
    $resource.add('dualElemnet', 'The ID for "{0}" was found by control of the name I overlapped by the present page or the ID.');
    $resource.add('requiredKeyData', 'Indispensable input item slip');
    $resource.add('requiredInsertData', 'The lower item is an indispensable input item.');
    $resource.add('errorMessage', 'An error occurred.');
    $resource.add('serverErrorMessage', 'An error occurred by a server.');
    $resource.add('initialComplete', 'Screen structure completion');
    $resource.add('initialException', 'Screen structure failure');
    $resource.add('isDateTimeInsert', '"{0}" it has to input a day of the format and time.');
    $resource.add('isDateInsert', '"{0}" it has to input a day of the format.');
    $resource.add('isTimeInsert', '"{0}" it has to input time of the format.');
    $resource.add('isNumericInsert', 'It has to input a number.');
    $resource.add('forceSave', 'Is the data which is being edited preserved?');
    $resource.add('textMaxLength', 'The number of digits of "{0}" that can be entered has been exceeded. In English, other characters with one digit are calculated by two digits.');

    $resource.add('create', 'input');
    $resource.add('read', 'inquiry');
    $resource.add('find', 'search');
    $resource.add('edit', 'correction');
    $resource.add('delele', 'elimination');
    $resource.add('removeStatusNo', 'elimination isn\'t in the possible state. After inquiring data, I have to eliminate. ');
    $resource.add('removeConfirm', 'Is it eliminated in truth?');
    $resource.add('notData', 'there is no data. ');
    $resource.add('notCondData', 'there is no data which matches the input condition. ');
    $resource.add('notRetrieveCond', 'the item necessary to inquiry wasn\'t input. ');
    $resource.add('notDateBetween', 'it isn\'t possible to happen to starting sunshades of the complete weather of "{0}" "{1}" recently. ');
    $resource.add('notDate', 'a correct day is input, and I have to choose. ');
    $resource.add('notFindCond', 'it has to input sentences necessary to a search. It has to input more than two letter for a correct search. ');
    $resource.add('selectData', 'I have to choose data.');
    $resource.add('selectAll', 'whole');
    $resource.add('saveExcel', 'Excel It\'s during download.');
    $resource.add('saveExcelComplete', 'Excel  A file was downloaded.');
    $resource.add('saveExcelFail', 'Excel  File  I failed in download.');
    $resource.add('notSupportContent', 'the contents-type which aren\'t supported.');
})(globalRoot, globalRoot.$resource);
