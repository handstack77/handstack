'use strict';

let $login = {
    hook: {
        pageLoad() {
            $this.method.redirectIfAuthenticated();
            $this.method.bindEvents();
        }
    },

    event: {
        async formLogin_submit(submitEvent) {
            submitEvent.preventDefault();

            $this.method.setMessage('', false);

            const emailID = $this.method.getTrimmedValue('txtEmailID');
            const password = $this.method.getValue('txtPassword');
            if (emailID === '' || password === '') {
                $this.method.setMessage('EmailID와 Password를 입력하세요.', true);
                return;
            }

            try {
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        EmailID: emailID,
                        Password: password
                    }),
                    credentials: 'include'
                });

                if (response.ok) {
                    location.replace('/main.html');
                    return;
                }

                const payload = await response.json().catch(function () { return null; });
                $this.method.setMessage(payload?.message || '로그인에 실패했습니다.', true);
            }
            catch (error) {
                $this.method.setMessage('요청 처리 중 오류가 발생했습니다.', true);
            }
        }
    },

    method: {
        bindEvents() {
            const form = document.getElementById('formLogin');
            form.addEventListener('submit', $this.event.formLogin_submit);
        },

        async redirectIfAuthenticated() {
            try {
                const response = await fetch('/auth/me', { credentials: 'include' });
                if (response.ok) {
                    location.replace('/main.html');
                }
            }
            catch (error) {
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
        },

        getValue(elementID) {
            const element = document.getElementById(elementID);
            return element ? element.value : '';
        },

        getTrimmedValue(elementID) {
            return $this.method.getValue(elementID).trim();
        }
    }
};
