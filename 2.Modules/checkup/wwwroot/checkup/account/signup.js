'use strict';
let $signup = {
    config: {
        programID: 'HDS',
        businessID: 'SYS',
        systemID: 'BP01',
        transactionID: 'USR010',
    },

    prop: {
        issueID: '',
        validID: '',
        signID: '',
    },

    transaction: {
        UD01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [],
            callback: async (error, responseObject, addtionalData) => {
                if (error) {
                    syn.$l.eventLog('transaction', 'UD01 - error: {0}'.format(JSON.stringify(error)));
                    return;
                }

                var result = await syn.$w.apiHttp(`/checkup/api/account/sign-update?userID=${syn.$w.User.UserID}&issueID=${$this.prop.issueID}&validID=${$this.prop.validID}&signID=${$this.prop.signID}`).send();
                if ($string.isNullOrEmpty(result.error) == true) {
                    location.href = `/checkup/checkin.html?tick=${(new Date()).getTime()}`;
                }
                else {
                    syn.$w.alert(`부가 정보를 변경 할 수 없습니다.<br/>${result.error}`);
                    setTimeout(() => {
                        location.href = `/checkup/checkin.html?tick=${(new Date()).getTime()}`;
                    }, 3000);
                }
            }
        },
    },

    hook: {
        async pageLoad() {
            $this.prop.issueID = syn.$r.params['issueID'];
            $this.prop.validID = syn.$r.params['validID'];
            $this.prop.signID = syn.$r.params['signID'];

            var tokenID = syn.$r.getCookie(syn.Config.CookiePrefixName + '.TokenID');
            var member = syn.$r.getCookie(syn.Config.CookiePrefixName + '.Member');
            var variable = syn.$r.getCookie(syn.Config.CookiePrefixName + '.Variable');
            var bearerToken = syn.$r.getCookie(syn.Config.CookiePrefixName + '.BearerToken');

            if ($string.isNullOrEmpty(tokenID) == true
                || $string.isNullOrEmpty(member) == true
                || $string.isNullOrEmpty(variable) == true
                || $string.isNullOrEmpty(bearerToken) == true
                || $string.isNullOrEmpty($this.prop.issueID) == true
                || $string.isNullOrEmpty($this.prop.validID) == true
                || $string.isNullOrEmpty($this.prop.signID) == true) {

                var alertOptions = $object.clone(syn.$w.alertOptions);
                alertOptions.icon = 'warning';
                alertOptions.buttonType = '1';
                syn.$w.alert('보안상의 이유로 HandStack 액세스 토큰이 만료되었습니다. HandStack에 다시 로그인해야 합니다', 'System Logout', alertOptions, function (result) {
                    location.href = 'account/signin.html';
                });
                return false;
            }

            syn.$l.get('txtMemberNo').value = syn.$w.User.UserNo;
            syn.$l.get('txtUserID').value = syn.$w.User.UserID;
            syn.$l.get('txtMemberName').value = syn.$w.User.UserName;
            syn.$l.get('txtPositionName').value = syn.$w.User.PositionName;
            syn.$l.get('txtDepartmentName').value = syn.$w.User.DepartmentName;
            syn.$l.get('txtCompanyName').value = syn.$w.User.CompanyName;
        }
    },

    event: {
        async btnAction_click() {
            var memberName = syn.$l.get('txtMemberName').value.trim();
            if ($string.isNullOrEmpty(memberName) == true) {
                syn.$w.alert('회원 이름을 입력하세요');
                return;
            }

            var positionName = syn.$l.get('txtPositionName').value.trim();
            if ($string.isNullOrEmpty(positionName) == true) {
                syn.$w.alert('직급 또는 직책 이름을 입력하세요');
                return;
            }

            var departmentName = syn.$l.get('txtDepartmentName').value.trim();
            if ($string.isNullOrEmpty(departmentName) == true) {
                syn.$w.alert('부서 또는 역할 이름을 입력하세요');
                return;
            }

            var companyName = syn.$l.get('txtCompanyName').value.trim();
            if ($string.isNullOrEmpty(companyName) == true) {
                syn.$w.alert('회사 또는 조직 이름을 입력하세요');
                return;
            }

            syn.$w.transactionAction('UD01');
        }
    },

    method: {
    }
}
