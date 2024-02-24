'use strict';
let $HML011 = {
    transaction: {
        ID01: {
            inputs: [{ type: 'Row', dataFieldID: 'MainForm' }],
            outputs: [{ type: 'Form', dataFieldID: 'MainForm' }],
            callback: async (error, responseObject, addtionalData) => {
                if ($string.isNullOrEmpty(error) == true) {
                    if (syn.$l.get('txtInviteSendMail').value != '') {
                        var emailID = syn.$l.get('txtInviteSendMail').value;

                        var emails = $string.split(emailID, ',');
                        for (var i = 0; i < emails.length; i++) {
                            var email = emails[i];
                            var userName = $this.method.getUserName(email);
                            var roles = $this.method.getRoles(email);
                            var result = await syn.$w.apiHttp(`/checkup/api/account/invite-member?emailID=${email}&userName=${userName}&applicationName=${syn.$w.ManagedApp.ApplicationName}&roles=${roles}`).send();
                            if (result && $string.isNullOrEmpty(result.error) == true) {
                                syn.$w.notify('success', `${emailID} 초대 메일 발송`);
                            }
                            else {
                                syn.$w.notify('error', `${emailID} 초대 메일 발송 실패`);
                            }
                        }

                        $this.method.initInviteForm();
                    }
                }
                else {
                    syn.$w.notify('warning', '앱 담당자 저장에 실패했습니다. 오류: ' + error);
                }
            }
        },
    },

    hook: {
        pageLoad() {
            syn.$l.get('txtApplicationNo').value = syn.$w.ManagedApp.ApplicationNo;
            syn.$l.get('txtCreatedMemberNo').value = syn.$w.User.UserNo;
        },
    },

    event: {
        btnInviteSendMail_click(evt) {
            var sendMailYN = false;
            var userEmailID1 = syn.$l.get('txtUserEmailID1').value.trim();
            if (userEmailID1 != '') {
                if (syn.$l.get('chkRoleDevelop1').checked == false && syn.$l.get('chkRoleBusiness1').checked == false && syn.$l.get('chkRoleOperation1').checked == false && syn.$l.get('chkRoleManaged1').checked == false) {
                    syn.$w.alert(`'${userEmailID1}' 담당자의 역할이 하나 이상 필요합니다`);
                    return false;
                }

                sendMailYN = true;
            }

            var userEmailID2 = syn.$l.get('txtUserEmailID2').value.trim();
            if (userEmailID2 != '') {
                if (syn.$l.get('chkRoleDevelop2').checked == false && syn.$l.get('chkRoleBusiness2').checked == false && syn.$l.get('chkRoleOperation2').checked == false && syn.$l.get('chkRoleManaged2').checked == false) {
                    syn.$w.alert(`'${userEmailID2}' 담당자의 역할이 하나 이상 필요합니다`);
                    return false;
                }

                sendMailYN = true;
            }

            var userEmailID3 = syn.$l.get('txtUserEmailID3').value.trim();
            if (userEmailID3 != '') {
                if (syn.$l.get('chkRoleDevelop3').checked == false && syn.$l.get('chkRoleBusiness3').checked == false && syn.$l.get('chkRoleOperation3').checked == false && syn.$l.get('chkRoleManaged3').checked == false) {
                    syn.$w.alert(`'${userEmailID3}' 담당자의 역할이 하나 이상 필요합니다`);
                    return false;
                }

                sendMailYN = true;
            }

            if (sendMailYN == true) {
                syn.$w.transactionAction('ID01');
            }
            else {
                syn.$w.alert('초대 메일을 발송할 이메일을 입력하세요');
                return false;
            }
        }
    },

    method: {
        initInviteForm() {
            syn.$l.get('txtUserEmailID1').value = '';
            syn.$l.get('txtUserName1').value = '';
            syn.$l.get('chkRoleDevelop1').checked = true;
            syn.$l.get('chkRoleBusiness1').checked = false;
            syn.$l.get('chkRoleOperation1').checked = false;
            syn.$l.get('chkRoleManaged1').checked = false;

            syn.$l.get('txtUserEmailID2').value = '';
            syn.$l.get('txtUserName2').value = '';
            syn.$l.get('chkRoleDevelop2').checked = true;
            syn.$l.get('chkRoleBusiness2').checked = false;
            syn.$l.get('chkRoleOperation2').checked = false;
            syn.$l.get('chkRoleManaged2').checked = false;

            syn.$l.get('txtUserEmailID3').value = '';
            syn.$l.get('txtUserName3').value = '';
            syn.$l.get('chkRoleDevelop3').checked = true;
            syn.$l.get('chkRoleBusiness3').checked = false;
            syn.$l.get('chkRoleOperation3').checked = false;
            syn.$l.get('chkRoleManaged3').checked = false;
        },

        getUserName(emailID) {
            var result = '';
            if (emailID == syn.$l.get('txtUserEmailID1').value.trim()) {
                result = syn.$l.get('txtUserName1').value.trim();
            }
            else if (emailID == syn.$l.get('txtUserEmailID2').value.trim()) {
                result = syn.$l.get('txtUserName2').value.trim();
            }
            else if (emailID == syn.$l.get('txtUserEmailID3').value.trim()) {
                result = syn.$l.get('txtUserName3').value.trim();
            }

            return result;
        },

        getRoles(emailID) {
            var result = '';
            if (emailID == syn.$l.get('txtUserEmailID1').value.trim()) {
                result = $string.split(`${(syn.$l.get('chkRoleDevelop1').checked == true ? '개발' : '')},${(syn.$l.get('chkRoleBusiness1').checked == true ? '업무' : '')},${(syn.$l.get('chkRoleOperation1').checked == true ? '운영' : '')},${(syn.$l.get('chkRoleManaged1').checked == true ? '관리' : '')}`, ',').join(', ');
            }
            else if (emailID == syn.$l.get('txtUserEmailID2').value.trim()) {
                result = $string.split(`${(syn.$l.get('chkRoleDevelop2').checked == true ? '개발' : '')},${(syn.$l.get('chkRoleBusiness2').checked == true ? '업무' : '')},${(syn.$l.get('chkRoleOperation2').checked == true ? '운영' : '')},${(syn.$l.get('chkRoleManaged2').checked == true ? '관리' : '')}`, ',').join(', ');
            }
            else if (emailID == syn.$l.get('txtUserEmailID3').value.trim()) {
                result = $string.split(`${(syn.$l.get('chkRoleDevelop3').checked == true ? '개발' : '')},${(syn.$l.get('chkRoleBusiness3').checked == true ? '업무' : '')},${(syn.$l.get('chkRoleOperation3').checked == true ? '운영' : '')},${(syn.$l.get('chkRoleManaged3').checked == true ? '관리' : '')}`, ',').join(', ');
            }

            return result;
        }
    }
}
