'use strict';
let $practical = {
    prop: {
        agreeIDs: ['chkAgreeTerms', 'chkAgreePrivacy', 'chkAgreeMarketing'],
        menus: ['Customer', 'Order', 'Product', 'Report'],
        permissions: ['Read', 'Write', 'Delete']
    },

    hook: {
        pageLoad() {
            $this.method.refreshPermissionCount();
        }
    },

    method: {
        getYN(elID) {
            return syn.uicontrols.$checkbox.getValue(elID);
        },

        setYN(elID, isChecked) {
            syn.uicontrols.$checkbox.setValue(elID, isChecked == true ? 'Y' : '');
        },

        // 개별 약관 상태를 기준으로 '모든 약관에 동의' 체크 상태를 맞춘다.
        syncAgreeAll() {
            let allChecked = $this.prop.agreeIDs.every((id) => {
                return $this.method.getYN(id) == 'Y';
            });
            $this.method.setYN('chkAgreeAll', allChecked);
        },

        // 마케팅 수신에 동의한 경우에만 이메일/문자 세부 항목을 활성화한다.
        syncMarketing() {
            let isAgree = $this.method.getYN('chkAgreeMarketing') == 'Y';
            ['chkMarketingEmail', 'chkMarketingSms'].forEach((id) => {
                let el = syn.$l.get(id);
                el.disabled = isAgree == false;
                if (isAgree == false) {
                    syn.uicontrols.$checkbox.clear(id);
                }
            });
        },

        // 열(조회/등록/삭제) 머리글 체크 상태를 행 체크 상태에서 다시 계산한다.
        syncColumnHeaders() {
            $this.prop.permissions.forEach((permission) => {
                let allChecked = $this.prop.menus.every((menu) => {
                    return $this.method.getYN(`chk${menu}${permission}`) == 'Y';
                });
                $this.method.setYN(`chkCol${permission}`, allChecked);
            });
        },

        syncRowHeader(menu) {
            let allChecked = $this.prop.permissions.every((permission) => {
                return $this.method.getYN(`chk${menu}${permission}`) == 'Y';
            });
            $this.method.setYN(`chkRow${menu}`, allChecked);
        },

        // 권한 규칙: 등록/수정/삭제 권한이 있으면 조회 권한은 반드시 필요하다.
        enforceReadPermission(menu) {
            let needRead = $this.method.getYN(`chk${menu}Write`) == 'Y' || $this.method.getYN(`chk${menu}Delete`) == 'Y';
            if (needRead == true) {
                $this.method.setYN(`chk${menu}Read`, true);
            }
        },

        refreshPermissionCount() {
            let count = 0;
            $this.prop.menus.forEach((menu) => {
                $this.prop.permissions.forEach((permission) => {
                    if ($this.method.getYN(`chk${menu}${permission}`) == 'Y') {
                        count++;
                    }
                });
            });

            syn.$l.get('spnPermissionCount').innerText = `선택된 권한 ${count}건`;
        },

        onPermissionChanged(menu) {
            $this.method.enforceReadPermission(menu);
            $this.method.syncRowHeader(menu);
            $this.method.syncColumnHeaders();
            $this.method.refreshPermissionCount();
        },

        onColumnChanged(permission) {
            let isChecked = $this.method.getYN(`chkCol${permission}`) == 'Y';
            $this.prop.menus.forEach((menu) => {
                $this.method.setYN(`chk${menu}${permission}`, isChecked);
            });

            $this.prop.menus.forEach((menu) => {
                $this.method.enforceReadPermission(menu);
                $this.method.syncRowHeader(menu);
            });
            $this.method.syncColumnHeaders();
            $this.method.refreshPermissionCount();
        },

        onRowChanged(menu) {
            let isChecked = $this.method.getYN(`chkRow${menu}`) == 'Y';
            $this.prop.permissions.forEach((permission) => {
                $this.method.setYN(`chk${menu}${permission}`, isChecked);
            });

            $this.method.syncColumnHeaders();
            $this.method.refreshPermissionCount();
        },

        save() {
            if ($this.method.getYN('chkAgreeTerms') != 'Y') {
                syn.$w.alert('서비스 이용약관에 동의해야 저장할 수 있습니다.');
                return;
            }

            if ($this.method.getYN('chkAgreePrivacy') != 'Y') {
                syn.$w.alert('개인정보 수집 및 이용에 동의해야 저장할 수 있습니다.');
                return;
            }

            let permissions = [];
            $this.prop.menus.forEach((menu) => {
                let item = { MenuID: menu };
                $this.prop.permissions.forEach((permission) => {
                    item[`${permission}YN`] = $this.method.getYN(`chk${menu}${permission}`);
                });
                permissions.push(item);
            });

            let data = {
                AgreeTerms: $this.method.getYN('chkAgreeTerms'),
                AgreePrivacy: $this.method.getYN('chkAgreePrivacy'),
                AgreeMarketing: $this.method.getYN('chkAgreeMarketing'),
                MarketingEmail: $this.method.getYN('chkMarketingEmail'),
                MarketingSms: $this.method.getYN('chkMarketingSms'),
                Permissions: permissions
            };

            syn.$l.get('preResult').innerText = JSON.stringify(data, null, 2);
            syn.$l.eventLog('save', '약관 동의와 메뉴 권한을 저장했습니다.');
        },

        reset() {
            $this.prop.agreeIDs.concat(['chkAgreeAll', 'chkMarketingEmail', 'chkMarketingSms']).forEach((id) => {
                syn.uicontrols.$checkbox.clear(id);
            });

            $this.prop.menus.forEach((menu) => {
                syn.uicontrols.$checkbox.clear(`chkRow${menu}`);
                $this.prop.permissions.forEach((permission) => {
                    syn.uicontrols.$checkbox.clear(`chk${menu}${permission}`);
                });
            });

            $this.prop.permissions.forEach((permission) => {
                syn.uicontrols.$checkbox.clear(`chkCol${permission}`);
            });

            $this.method.syncMarketing();
            $this.method.refreshPermissionCount();
            syn.$l.get('preResult').innerText = '저장 버튼을 누르면 선택한 약관/권한이 JSON 으로 표시됩니다.';
        }
    },

    event: {
        btnSave_click() {
            $this.method.save();
        },

        btnReset_click() {
            $this.method.reset();
        },

        chkAgreeAll_change() {
            let isChecked = $this.method.getYN('chkAgreeAll') == 'Y';
            $this.prop.agreeIDs.forEach((id) => {
                $this.method.setYN(id, isChecked);
            });
            $this.method.syncMarketing();
        },

        chkAgreeTerms_change() {
            $this.method.syncAgreeAll();
        },

        chkAgreePrivacy_change() {
            $this.method.syncAgreeAll();
        },

        chkAgreeMarketing_change() {
            $this.method.syncAgreeAll();
            $this.method.syncMarketing();
        },

        chkColRead_change() { $this.method.onColumnChanged('Read'); },
        chkColWrite_change() { $this.method.onColumnChanged('Write'); },
        chkColDelete_change() { $this.method.onColumnChanged('Delete'); },

        chkRowCustomer_change() { $this.method.onRowChanged('Customer'); },
        chkRowOrder_change() { $this.method.onRowChanged('Order'); },
        chkRowProduct_change() { $this.method.onRowChanged('Product'); },
        chkRowReport_change() { $this.method.onRowChanged('Report'); },

        chkCustomerRead_change() { $this.method.onPermissionChanged('Customer'); },
        chkCustomerWrite_change() { $this.method.onPermissionChanged('Customer'); },
        chkCustomerDelete_change() { $this.method.onPermissionChanged('Customer'); },
        chkOrderRead_change() { $this.method.onPermissionChanged('Order'); },
        chkOrderWrite_change() { $this.method.onPermissionChanged('Order'); },
        chkOrderDelete_change() { $this.method.onPermissionChanged('Order'); },
        chkProductRead_change() { $this.method.onPermissionChanged('Product'); },
        chkProductWrite_change() { $this.method.onPermissionChanged('Product'); },
        chkProductDelete_change() { $this.method.onPermissionChanged('Product'); },
        chkReportRead_change() { $this.method.onPermissionChanged('Report'); },
        chkReportWrite_change() { $this.method.onPermissionChanged('Report'); },
        chkReportDelete_change() { $this.method.onPermissionChanged('Report'); }
    }
}
