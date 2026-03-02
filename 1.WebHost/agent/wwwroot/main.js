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

                $this.method.setText('txtEmailID', $this.method.getUserField(user, 'EmailID'));
                $this.method.setText('txtUserName', $this.method.getUserField(user, 'UserName'));
                $this.method.setText('txtRoles', $this.method.getUserField(user, 'Roles'));
                $this.method.setText('txtCreatedAt', $this.method.getUserField(user, 'CreatedAt'));
                $this.method.setText('txtExpiredAt', $this.method.getUserField(user, 'ExpiredAt'));
            }
            catch (error) {
                $this.method.setMessage('요청 처리 중 오류가 발생했습니다.', true);
            }
        },

        getUserField(user, fieldName) {
            const camelCaseFieldName = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
            const value = user?.[fieldName] ?? user?.[camelCaseFieldName];

            if (Array.isArray(value) === true) {
                return value.length > 0 ? value.join(', ') : '-';
            }

            if (value === null || value === undefined || value === '') {
                return '-';
            }

            return value;
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
