'use strict';
let $visibilitytoggle = {
    method: {
        // 실무 코드(customerTypeVisible 패턴)와 동일하게, 어느 라디오가 change를 냈는지가 아니라
        // 그룹 전체에서 "지금 무엇이 체크돼 있는가"를 기준으로 화면을 갱신한다.
        customerTypeVisible() {
            if (syn.$l.get('rdoCustomerType1').checked == true) {
                syn.$l.get('rowCustomerName').style.display = '';
                syn.$l.get('rowBusinessCompany').style.display = 'none';
            }
            else {
                syn.$l.get('rowCustomerName').style.display = 'none';
                syn.$l.get('rowBusinessCompany').style.display = '';
            }
        }
    },

    event: {
        rdoCustomerType1_change() {
            $this.method.customerTypeVisible();
        },

        rdoCustomerType2_change() {
            $this.method.customerTypeVisible();
        }
    }
}
