(function (context, $res) {
    if (!$res) {
        throw new Error('没有$res资源客体。');
    }
    $resource.add('localeID', 'zh-CN');

    $resource.add('progress', '是进行中。');
    $resource.add('append', '是新输入状态。');
    $resource.add('appendPre', '画面构成中，...');
    $resource.add('retrieve', '正常地被询问了。');
    $resource.add('retrieveException', '在询问数据的过程中问题发生了。');
    $resource.add('retrievePre', '数据查询中，...');
    $resource.add('save', '正常地被保存了。');
    $resource.add('saveException', '在保存数据的过程中问题发生了。');
    $resource.add('savePre', '保存中，...');
    $resource.add('update', '正常地被修正了。');
    $resource.add('updateException', '在修正数据的过程中问题发生了。');
    $resource.add('updatePre', '修正中，...');
    $resource.add('remove', '正常地被删除了。');
    $resource.add('removeException', '在删除数据的过程中问题发生了。');
    $resource.add('removePre', '删除中，...');
    $resource.add('copyAppend', '复制原有数据以输入状态转换了。');
    $resource.add('userInfoNothing', '问题发生了为使用者信息。');

    $resource.add('isLogOut', '真的对数(记录) 出界是不是做？');
    $resource.add('waiting', '请等只稍微的间。。。');
    $resource.add('notElemnet', '控制不被发现。 请调查查询和HTML设计。');
    $resource.add('dualElemnet', '"{0}"的ID以现在的页重复的名字或，由于ID的控制被发现了。');
    $resource.add('requiredKeyData', '必需输入项目错误');
    $resource.add('requiredInsertData', '下项目是必需输入项目。');
    $resource.add('errorMessage', '错误发生了。');
    $resource.add('serverErrorMessage', '用服务器错误发生了。');
    $resource.add('initialComplete', '画面构成完成');
    $resource.add('initialException', '画面构成失败');
    $resource.add('isDateTimeInsert', '与"{0}"格式的日必须输入时间。');
    $resource.add('isDateInsert', '必须输入"{0}"格式的日。');
    $resource.add('isTimeInsert', '必须输入"{0}"格式的时间。');
    $resource.add('isNumericInsert', '必须输入数字。');
    $resource.add('forceSave', '是不是保存编辑中的数据？');
    $resource.add('textMaxLength', '已超过可以输入的 "{0}"的位数。在英语中，具有一位数字的其他字符由两位数字计算。');

    $resource.add('create', '输入');
    $resource.add('read', '查询');
    $resource.add('find', '检索');
    $resource.add('edit', '修正');
    $resource.add('delele', '删除');
    $resource.add('removeStatusNo', '不是删除可以的状态。 必须询问数据之后删除。');
    $resource.add('removeConfirm', '真的是不是删除？');
    $resource.add('notData', '没有数据。');
    $resource.add('notCondData', '没有适合被输入的条件的数据。');
    $resource.add('notRetrieveCond', '为查询需要的项目不被输入。');
    $resource.add('notDateBetween', '"{0}"的完成日"{1}"的 开始星期日更加最近不能发生。');
    $resource.add('notDate', '必须输入正确的日或者选择。');
    $resource.add('notFindCond', '必须输入需要的文章为检索。 为了正确的检索必须二字以上输入。');
    $resource.add('selectData', '必须选择数据。');
    $resource.add('selectAll', '全部');
    $resource.add('saveExcel', 'Excel 下载中。');
    $resource.add('saveExcelComplete', '下载Excel 文件。');
    $resource.add('saveExcelFail', 'Excel 文件下载失败了');
    $resource.add('notSupportContent', '不支援的内容类型。');
})(globalRoot, globalRoot.$resource);
