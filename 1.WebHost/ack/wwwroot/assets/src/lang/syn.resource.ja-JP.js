(function (context, $res) {
    if (!$res) {
        throw new Error('$resリソース客体がありません。');
    }
    $resource.add('localeID', 'ja-JP');

    $resource.add('progress', '進行中です。');
    $resource.add('append', '新規入力状態です。');
    $resource.add('appendPre', '画面構成中...');
    $resource.add('retrieve', '正常に照会されました。');
    $resource.add('retrieveException', 'データを問い合わせる過程で問題が発生しました。');
    $resource.add('retrievePre', 'データ照会中...');
    $resource.add('save', '正常に保存されました。');
    $resource.add('saveException', 'データを保存する過程で問題が発生しました。');
    $resource.add('savePre', '保存中...');
    $resource.add('update', '正常に修正されました。');
    $resource.add('updateException', 'データを修正する過程で問題が発生しました。');
    $resource.add('updatePre', '修正中...');
    $resource.add('remove', '正常に削除されました。');
    $resource.add('removeException', 'データを削除する過程で問題が発生しました。');
    $resource.add('removePre', '削除中...');
    $resource.add('copyAppend', '既存データをコピーして入力状態で切り替えました。');
    $resource.add('userInfoNothing', '使用者情報に問題が発生しました。');

    $resource.add('isLogOut', '本当にログ アウトしますか?');
    $resource.add('waiting', '少しの間だけ待って下さい。。。');
    $resource.add('notElemnet', 'コントロールが発見されなかったです。 クエリーやHTMLデザインを調べて下さい。');
    $resource.add('dualElemnet', '"{0}"のIDは現在のページで重複した名前または、IDのコントロールで発見されました。');
    $resource.add('requiredKeyData', '必須入力項目誤り');
    $resource.add('requiredInsertData', '下項目は必須入力項目です。');
    $resource.add('errorMessage', 'エラーが発生しました。');
    $resource.add('serverErrorMessage', 'サーバーでエラーが発生しました。');
    $resource.add('initialComplete', '画面構成完了');
    $resource.add('initialException', '画面構成失敗');
    $resource.add('isDateTimeInsert', '"{0}"フォーマットの日と時間を入力しなければなりません。');
    $resource.add('isDateInsert', '"{0}"フォーマットの日を入力しなければなりません。');
    $resource.add('isTimeInsert', '"{0}"フォーマットの時間を入力しなければなりません。');
    $resource.add('isNumericInsert', '数字を入力しなければなりません。');
    $resource.add('forceSave', '編集中のデータを保存しますか?');
    $resource.add('textMaxLength', '入力可能な "{0}"の桁数を超えました。英語は1桁の他の文字は、2桁のずつ計算されます。');

    $resource.add('create', '入力');
    $resource.add('read', '照会');
    $resource.add('find', '検索');
    $resource.add('edit', '修正');
    $resource.add('delele', '削除');
    $resource.add('removeStatusNo', '削除可能な状態ではありません。 データを問い合わせた後削除しなければなりません。');
    $resource.add('removeConfirm', '本当に削除しますか?');
    $resource.add('notData', 'データがありません。');
    $resource.add('notCondData', '入力された条件に合うデータがありません。');
    $resource.add('notRetrieveCond', '照会に必要な項目が入力されなかったです。');
    $resource.add('notDateBetween', '"{0}"の完了日より"{1}"の開始日がさらに最近起こることができません。');
    $resource.add('notDate', '正確な日を入力したり選択しなければなりません。');
    $resource.add('notFindCond', '検索に必要な文章を入力しなければなりません。 正確な検索のために二字以上入力しなければなりません。');
    $resource.add('selectData', 'データを選択しなければなりません。');
    $resource.add('selectAll', '全体');
    $resource.add('saveExcel', 'エクセル ダウンロード中です。');
    $resource.add('saveExcelComplete', 'エクセル ファイルをダウンロードしました。');
    $resource.add('saveExcelFail', 'エクセル ファイル ダウンロードを失敗しました');
    $resource.add('notSupportContent', '支援しないコンテンツ タイプです。');
})(globalRoot, globalRoot.$resource);
