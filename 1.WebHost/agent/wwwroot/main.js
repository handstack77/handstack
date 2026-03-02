'use strict';

let $main = {
    hook: {
        pageLoad() {
            $this.method.bindEvents();
            $this.method.loadProfile();
        }
    },

    event: {
        async btnLogout_click() {
            $this.method.setMessage('', false);

            try {
                const response = await fetch('/auth/logout', {
                    method: 'POST',
                    credentials: 'include'
                });

                if (response.ok) {
                    location.replace('/login.html');
                    return;
                }

                $this.method.setMessage('로그아웃 처리에 실패했습니다.', true);
            }
            catch (error) {
                $this.method.setMessage('요청 처리 중 오류가 발생했습니다.', true);
            }
        }
    },

    method: {
        bindEvents() {
            const logoutButton = document.getElementById('btnLogout');
            logoutButton.addEventListener('click', $this.event.btnLogout_click);
        },

        async loadProfile() {
            try {
                const response = await fetch('/auth/me', { credentials: 'include' });
                if (response.status === 401) {
                    location.replace('/login.html');
                    return;
                }

                if (response.ok === false) {
                    $this.method.setMessage('사용자 정보를 조회할 수 없습니다.', true);
                    return;
                }

                const payload = await response.json();
                const user = payload?.user || {};

                $this.method.setText('txtEmailID', user.EmailID || '-');
                $this.method.setText('txtUserName', user.UserName || '-');
                $this.method.setText('txtRoles', user.Roles || '-');
                $this.method.setText('txtCreatedAt', user.CreatedAt || '-');
                $this.method.setText('txtExpiredAt', user.ExpiredAt || '-');
            }
            catch (error) {
                $this.method.setMessage('요청 처리 중 오류가 발생했습니다.', true);
            }
        },

        setText(elementID, text) {
            const element = document.getElementById(elementID);
            if (element) {
                element.textContent = text;
            }
        },

        setMessage(message, isError) {
            const messageElement = document.getElementById('lblMessage');
            messageElement.textContent = message || '';

            if (message) {
                messageElement.classList.remove('d-none');
                messageElement.classList.toggle('alert-danger', isError === true);
                messageElement.classList.toggle('alert-success', isError !== true);
            }
            else {
                messageElement.classList.add('d-none');
                messageElement.classList.remove('alert-success');
                messageElement.classList.add('alert-danger');
            }
        }
    }
};
