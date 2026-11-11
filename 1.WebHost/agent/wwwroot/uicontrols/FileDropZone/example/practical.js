'use strict';
let $practical = {
    prop: {
        posts: []
    },

    event: {
        fdzAttach_change() {
            $this.method.showError('');
        },

        fdzAttach_uploadError(evt) {
            $this.method.showError(evt.detail.file.name + ': ' + evt.detail.message);
        },

        btnNew_click() {
            // 새 글: 화면 목록을 비우고 새 키를 사용합니다(서버 파일은 그대로).
            syn.uicontrols.$filedropzone.clear('fdzAttach');
            syn.uicontrols.$filedropzone.setDependencyID('fdzAttach', 'NEWPOST_' + Date.now());
            syn.$l.get('txtTitle').value = '';
            syn.$l.get('txtContent').value = '';
            $this.method.showError('');
        },

        async btnSave_click() {
            var title = syn.$l.get('txtTitle').value.trim();
            if (title === '') {
                $this.method.showError('제목을 입력해 주세요.');
                return;
            }

            if (syn.uicontrols.$filedropzone.isUploading('fdzAttach') == true) {
                $this.method.showError('파일 업로드가 끝난 뒤에 저장해 주세요.');
                return;
            }

            // 임시 키로 올린 첨부파일을 게시글 키로 옮깁니다.
            var postKey = 'EXAMPLE_POST_' + Date.now();
            var moved = await syn.uicontrols.$filedropzone.updateDependencyID('fdzAttach', postKey);
            if (moved == false) {
                $this.method.showError('첨부파일을 저장하지 못했습니다.');
                return;
            }

            // 서버로 보낼 게시글 정보: 첨부파일은 ItemID 만 보내도 서버가 키(dependencyID)로 다시 찾을 수 있습니다.
            var attachments = syn.uicontrols.$filedropzone.getValue('fdzAttach');
            var post = {
                postKey: postKey,
                title: title,
                content: syn.$l.get('txtContent').value,
                attachmentIDs: attachments.map(function (item) { return item.ItemID; })
            };

            $this.prop.posts.push({ postKey: postKey, title: title });
            syn.$l.get('preSaved').textContent = JSON.stringify(post, null, 2);
            $this.method.renderPosts();
            $this.method.showError('');

            // 다음 게시글을 위해 새 임시 키를 준비합니다.
            syn.uicontrols.$filedropzone.clear('fdzAttach');
            syn.uicontrols.$filedropzone.setDependencyID('fdzAttach', 'NEWPOST_' + Date.now());
            syn.$l.get('txtTitle').value = '';
            syn.$l.get('txtContent').value = '';
        },

        async btnPost_click(evt) {
            // await 이후에는 evt.currentTarget 이 null 이 되므로 먼저 변수에 담아 둡니다.
            var button = evt.currentTarget;
            var postKey = button.getAttribute('data-post');
            var items = await syn.uicontrols.$filedropzone.load('fdzAttach', postKey);
            syn.$l.get('txtTitle').value = button.textContent;
            $this.method.showError(items.length + '개의 첨부파일을 조회했습니다.');
        }
    },

    method: {
        showError(message) {
            syn.$l.get('divError').textContent = message;
        },

        renderPosts() {
            var box = syn.$l.get('divPosts');
            box.textContent = '';
            $this.prop.posts.forEach(function (post) {
                var button = document.createElement('button');
                button.type = 'button';
                button.textContent = post.title;
                button.setAttribute('data-post', post.postKey);
                button.addEventListener('click', $this.event.btnPost_click);
                box.appendChild(button);
            });
        }
    }
}
