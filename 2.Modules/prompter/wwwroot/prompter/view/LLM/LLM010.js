'use strict';
let $LLM010 = {
    prop: {
        focusFeature: null,
        promptFeatures: [
            {
                type: 'header',
                title: 'Classification (CLS): 분류, 의도 파악을 확인하는 프롬프트',
            },
            {
                type: 'item',
                value: 'LLM.CLS010.GP01',
                title: '문장 대화의 의도를 파악',
                description: 'Question (질문), Assertion (주장), Declaration (선언) 중 하나로 주어진 문장 대화의 의도를 파악합니다.',
                placeholder: '아빠가 방에 들어가셨다.',
            },
            {
                type: 'item',
                value: 'LLM.CLS020.GP01',
                title: 'IT 시스템 장애 등급 수준을 파악',
                description: '문장의 어조, 문맥, 내용 및 시간 민감도에 따라 IT 시스템의 장애 수준을 파악합니다.',
                placeholder: '두 번째 사전 장애 대응 후 60분 이내에 장애를 보고해야 합니다.',
            },
            {
                type: 'header',
                title: 'Grounding (GRD): 맥락 이해, 엔터티 들을 추론하는 프롬프트',
            },
            {
                type: 'item',
                value: 'LLM.GRD010.GP01',
                title: '지정된 주제와 관련된 엔티티를 추출',
                description: '주제의 맥락을 파악하여 예시 엔터티 목록을 기반으로 엔터티를 추출합니다',
                placeholder: `장돌뱅이인 허 생원은 어느 여름 낮에 충줏집과 농탕치는 동이를 보게 되고 화를 내게 됩니다. 그런 허 생원에게 동이는 나귀 일을 알려 주고 소문과 달리 착한 동이에게 미안해하며 둘은 화해하게 됩니다.
허 생원과 조선달, 동이는 메밀꽃이 핀 달밤을 함께 걸으며 대화장으로 향합니다.
그 길에서 허 생원은 젊은 날의 추억을 이야기합니다. 허 생원은 강원도 봉평에서 만난 성 서방에 처녀와 하룻밤을 지낸다. 다음날 성 서방네 처녀는 중북 제천으로 떠났고, 허 생원은 그녀를 찾으러 제천 장에도 들렀지만 그녀를 찾지 못했습니다.
그날 이후, 허 생원은 봉평장은 빠지지 않고 들립니다.
이야기를 하던 허 생원은 동이와 이야기를 하게 되는데 동이는 홀어머니 밑에서 자랐는데 충북 제천에서 태어났다고 말했습니다.
동이는 발을 헛디뎌 물에 빠진 허 생원을 업어줍니다.
허 생원은 동이가 자신과 같은 왼손잡이라는 점을 발견하게 됩니다.`,
                variables: [
                    {
                        "ID": "Topic",
                        "Value": "사람, 장소"
                    },
                    {
                        "ID": "Entities",
                        "Value": "허 생원, 충줏집, 동이, 장돌뱅이, 이효석, 봉평장, 충북 제천, 조선달, 대화장, 강원도, 봉평"
                    }
                ]
            },
            {
                type: 'header',
                title: 'Generater (GEN): 계획, 아이디어, 변환들을 생성하는 프롬프트',
            },
            {
                type: 'item',
                value: 'LLM.GEN010.GP01',
                title: '제로샷 프롬프트',
                description: '사전에 특정한 예시나 데이터를 제공받지 않고 새로운 요청을 수행합니다.',
                placeholder: '시맨틱 커널에 대해 요약해주세요.'
            },
            {
                type: 'item',
                value: 'LLM.GEN020.GP01',
                title: '국가 언어 변환',
                description: '국가의 언어를 다른 국가의 언어로 변경합니다.',
                placeholder: '세상은 넓고, 배울 것은 많다.',
                variables: [
                    {
                        "ID": "StartLanguageID",
                        "Value": "Korean"
                    },
                    {
                        "ID": "EndLanguageID",
                        "Value": "Japanese"
                    }
                ]
            },
            {
                type: 'item',
                value: 'LLM.GEN030.GP01',
                title: '회의 전 스몰 토크 주제',
                description: '최근 이슈를 기반으로 간단한 이야기 아이디어를 얻습니다.',
                placeholder: '30대 3명의 개발자와 20대 1명의 디자이너와 함께 오늘의 개발, 테스트, 배포 업무를 효율적으로 진행하기 위한 회의를 하는데, 긴장을 풀기 위해 최신의 재미있는 이야기 주제가 필요해',
                variables: [
                    {
                        "ID": "Topic",
                        "Value": "축구, 정치, 연예, 날씨, 사회, 유머"
                    }
                ]
            },
            {
                type: 'header',
                title: 'Coding (COD): 개발, 예제, 소스 코드들을 생성하는 프롬프트',
            },
            {
                type: 'item',
                value: 'LLM.COD010.GP01',
                title: '버그 수정 및 개선',
                description: '소스 코드에서 버그를 찾아 수정하고 알고리즘 개선합니다.',
                placeholder: `private void WriteCookie(HttpResponse response, string key, string value)
{
    CookieOptions cookieOptions = new CookieOptions();
    cookieOptions.HttpOnly = false;
    cookieOptions.SameSite = SameSiteMode.Lax

    response.Cookies.Append(key, value, cookieOptions);
}
                `,
                variables: [
                    {
                        "ID": "Language",
                        "Value": "C#"
                    }
                ]
            },
            {
                type: 'item',
                value: 'LLM.COD020.GP01',
                title: '소스 코드 주석 추가',
                description: '제공된 소스 코드의 적절한 위치에 주석을 추가합니다.',
                placeholder: `private void WriteCookie(HttpResponse response, string key, string value)
{
    CookieOptions cookieOptions = new CookieOptions();
    cookieOptions.HttpOnly = false;
    cookieOptions.SameSite = SameSiteMode.Lax

    response.Cookies.Append(key, value, cookieOptions);
}
                `,
                variables: [
                    {
                        "ID": "Language",
                        "Value": "C#"
                    }
                ]
            },
            {
                type: 'item',
                value: 'LLM.COD030.GP01',
                title: '데이터베이스 SQL 생성',
                description: '주어진 테이블에 대한 SQL 쿼리를 생성합니다.',
                placeholder: 'MetaField 테이블의 DELETE 쿼리와 MetaEntity PK 컬럼을 제외한 모든 컬럼을 변경하는 UPDATE 쿼리를 각각 생성 해주세요.',
                variables: [
                    {
                        "ID": "Database",
                        "Value": "SqlServer"
                    },
                    {
                        "ID": "TableSchemes",
                        "Value": `TABLE [MetaField] AS MF:
EntityNo,String,1,36
FieldID,String,1,50
FieldName,String,0,100
FieldType,String,0,50
PK,String,0,1
IX,String,0,1
UI,String,0,1
NN,String,0,1
AI,String,0,1
MaxLength,Int64,0,4
DefaultValue,String,0,2000
Comment,String,0,2000
SortingNo,Int32,0,4

TABLE [MetaEntity] AS ME:
EntityNo,String,1,36
ApplicationNo,String,0,36
EntityID,String,0,255
EntityName,String,0,50
CategoryName,String,0,50
Acronyms,String,0,10
SeedData,String,0,16
Comment,String,0,1000
DeletedAt,DateTime,0,8
CreatedMemberNo,String,0,36
CreatedAt,DateTime,0,8
ModifiedMemberNo,String,0,36
ModifiedAt,DateTime,0,8`
                    }
                ]
            },
            {
                type: 'header',
                title: 'Summarize (SMZ): 회의록, 요약, 대화 주제를 생성하는 프롬프트',
            },
            {
                type: 'item',
                value: 'LLM.SMZ010.GP01',
                title: '회의록 요약 정리',
                description: '주어진 미팅 노트를 기반으로, 회의록을 작성합니다.',
                placeholder: `• DB 및 공통
    A/S 처리가 완료가 되어있는데 최종 처리완료로 확정하지 않은 이유는?
        A/S 접수 관리 정보 표시 기준
            특정 기간 이후 부터 표시
            최근 1달 조회 범위로 표시
        기간에 상관없이 장기 미처리 A/S 접수에 대해 표시할 수 있어야 하는가?
    AS 업무 처리시 담당자가 확인한 접수일자 기준 
    지사장 관리 화면 및 AS 기사 관리는 코드로 관리하고 있는지?
    코드로 관리되고 있는 지사장 담당 지역 기준
        본사: 강원, 경기, 경남, 경북, 광주, 대구, 대전, 부산, 서울, 세종, 울산, 인천, 전남, 전북, 제주, 충남, 충북       
        양주: 강원, 경기, 경남, 경북, 광주, 대구, 
        호남: 강원, 경기, 세종, 울산, 인천, 전남, 전북, 제주, 충남, 충북
        영남: 세종, 울산, 인천, 전남, 전북, 제주, 충남, 충북
        기타협력: 강원, 경기, 경남, 경북, 광주,, 전남, 전북, 제주, 충남, 충북

    현재는 시간단위로 접수하고 있는것이 아니고 1일 기준으로 되어 48시간 기준

    A/S 업무 처리 기준
        접수: 본사 담당자 또는 지사 담당자가 접수확인한 일자 AS_RECEIVE.AS_DATE
        처리: 지사 담당자가 처리확인한 일자 MAX(AS_RESULT.RT_DATE)
        취소: 지사 담당자가 처리확인한 일자 AS_RECEIVE.AT_CANCEL_DATE
        완료: 본사 담당자가 처리확인 된 A/S 접수를 최종 확인한 일자 AS_RECEIVE.MOD_DATE 

• 통계 

    모델명 선택시, 2024년 모델별 AS 발생현황에서 최근월을 마지막 월로 해서 현재월 기준으로 과거 12개월의 현황을 보여주도록.
    2024년 현재월 모델별 AS 발생현황 -> 선택된 모델에 대한 에러코드 발생빈도를 표로 보여주도록
    기간 : 년/월만 선택할 수 있도록
    모델명 : 라디오버튼으로 삼상, 단상, 모니터링 선택할 수 있도록.
    
• 접수홈 
    
    POI 아이콘의 주요 정보
        품목구분: 인버터, 모니터링, 기타
        처리결과: 접수(녹색), 취소(파랑), 완료(회색)
        접수구분: 콜센터, 홈페이지, 카카오채널, 카카오챗봇, 기타
        진행일정: 당일, 48시간, 7일, 장기
    신규접수, 취소, 완료된 POI를 표시 안 해야 할 당일 기준 전일까지 표시
    본사, 호남, 영남외 기타 협력업체의 처리내용에 대해 어떻게 표현해줄것인지?
    주소지가 정확하지 않게 입력된 건에 대해서는 위치정보 표시

[답변 및 확정, 협의 내용]
  - 콜센터의 경우, 접수신청시 바로 접수완료처리하고 있음.
  - 지사 담당자가 AS처리완료를 하면 그때를 AS 처리 완료로 인지함.
  - 48시간 기준 : 접수당일 포함 안시킴, 익일(1일), 그 다음날(2일) 까지를 48시간으로 처리함.  즉, 월요일 접수시 화요일 까지를 24시간으로 본다. 수요일까지 처리가된것이면 48시간 이내로 처리.
  - 지사장 코드정보를 AS ERP에서 관리하는건, 알림톡을 발송하기 위해서 만들어 놓은 것임.
  - 기타협력사 : 제주도를 제외한 나머지 협력사는 전국구로 활동하시는 협력사임
  - 개발 완료시 1개월 이내의 정보부터 표시할 수 있도록 진행예정.  이 부분은 블라블라에서 조금 더 고민해서 회신 예정.
  - 주소 위치를 파악하지 못하는 지점이 발생하게 되면 화면 왼쪽 하단에 Warning Icon이 나타나고, Icon을 클릭하면 주소 목록이 나타나도록 표시
  - 접수 구분 : 총 3개로 나누어서 보여질 수 있도록 처리 요망(1.콜센터 : 콜, 기타 2.카카오 : 챗봇, 채널 3.통합관제 : 홈페이지)
  - 처리 예정 : 배정 되어서 처리할 예정인 상태로, 배정일자와 담당자가 배정되어 있는것으로 현재로써는 정보가 기입되고 있지 않음. 이 부분은 추후 빼도록 유도할 예정.

블라블라로 전달할 내용(기 전달 완료)
 - 코드로 관리되고 있는 지사장 담당 지역 기준에 대해 안선모 프로에게 내용 전달할것.
 - 아이콘 표시 중요도
   1. 인버터/모니터링
   2. 가동여부 Y/N (예를 들어, 인버터가 빨간색으로 표시되면 멈춰서 있는것이기 때문에 빠른 조치를 취할 수 있도록 표시해주었으면 함)
   3. ~~~
 - 미처리 주소 목록`,
                variables: [
                    {
                        "ID": "Attendees",
                        "Value": `블라블라: 상무, 팀장, 프로
큐씨엔: 사장, 부장, 차장, 이사`
                    },
                    {
                        "ID": "MeetingTime",
                        "Value": `2023.04.20. 15:00 `
                    },
                    {
                        "ID": "Location",
                        "Value": `경복궁 사무실 온라인 화상회의 `
                    }
                ]
            },
            {
                type: 'header',
                title: 'Writer (WTR): 보고서, 문서들을 생성하는 프롬프트',
            },
            {
                type: 'item',
                value: 'LLM.WTR010.GP01',
                title: '당신의 명언 또는 인용구',
                description: '오늘의 운세 기반의 추천 명언 또는 인용구를 제공합니다.',
                placeholder: (new Date(new Date().setFullYear(new Date().getFullYear() - 10)).toISOString().split('T')[0])
            },
            {
                type: 'item',
                value: 'LLM.WTR020.GP01',
                title: '한국어 문장 영어 번역',
                description: '프롬프트 엔지니어링을 위한 영어 문장으로 번역합니다.',
                placeholder: `영어 번역가, 맞춤법 교정자 및 개선자가 필요해.
한국어로 말하면 영어로 번역하고 수정 및 개선된 버전의 영어로 답변해주세요.
저의 단순화된 초등학교 수준의 단어와 문장을 더 아름답고 우아한 상위 수준의 영어 단어와 문장으로 바꿔야 할꺼야.
의미는 동일하게 유지하되 좀 더 명확하게 표현하고 싶어.
수정 사항과 개선 사항만 응답하면 되고, 그 외의 설명은 필요 없어.`
            }
        ]
    },

    hook: {
        pageLoad() {
            var dataSource = {
                items: $this.prop.promptFeatures
            };

            $this.method.drawHtmlTemplate('divFeatureList', 'tplFeatureItem', dataSource);
        }
    },

    event: {
        divFeatureItem_click(el, featureID) {
            $this.prop.focusFeature = $this.prop.promptFeatures.find(x => x.value == featureID);
            if ($this.prop.focusFeature != null) {
                syn.$m.removeClass(syn.$l.querySelector('.list-group-item.active'), 'active');
                syn.$m.addClass(el, 'active');

                syn.$l.get('lblFeatureID').innerText = `${$this.prop.focusFeature.value}: ${$this.prop.focusFeature.title}`;
                syn.$l.get('txtUserMessage').value = $this.prop.focusFeature.placeholder;

                var variables = $this.prop.focusFeature.variables || [];
                var values = [];

                for (var i = 0, length = variables.length; i < length; i++) {
                    var variable = variables[i];
                    values.push([i, 1, variable.ID]);
                    values.push([i, 2, variable.Value]);
                }

                syn.uicontrols.$grid.clear('grdParameters');
                syn.uicontrols.$grid.setDataAtRow('grdParameters', values);
            }
        },

        btnSearchPrompt_click() {
            if ($this.prop.focusFeature == null) {
                syn.$w.alert('프롬프트 거래 ID를 선택 하세요.');
                return;
            }

            if (syn.uicontrols.$grid.checkEmptyValueCol('grdParameters', 1) == true) {
                syn.$w.alert('매개변수 그리드의 변수 ID 컬럼의 값을 입력하세요.');
                return;
            }

            if (syn.uicontrols.$grid.checkUniqueValueCol('grdParameters', 1) == false) {
                syn.$w.alert('매개변수 그리드의 변수 ID 컬럼의 값은 고유해야 합니다.');
                return;
            }

            if (syn.$l.get('txtUserMessage').value.trim() == '') {
                syn.$w.alert('프롬프트를 입력하세요.', null, null, () => {
                    syn.$l.get('txtUserMessage').focus();
                });
                return;
            }

            var serverFunctionID = $this.prop.focusFeature.value;
            var businessID = serverFunctionID.split('.')[0];
            var transactionID = serverFunctionID.split('.')[1];
            var functionID = serverFunctionID.split('.')[2];

            syn.$l.get('txtPromptResult').value = '';

            var directObject = {
                programID: syn.Config.ApplicationID,
                businessID: businessID,
                transactionID: transactionID,
                functionID: functionID,
                inputObjects: [
                    { prop: 'UserMessage', val: syn.$l.get('txtUserMessage').value.trim() },
                ]
            };

            $this.method.setFunctionArguments(directObject.inputObjects);

            syn.$w.transactionDirect(directObject, function (responseData, addtionalData) {
                if (responseData && responseData.length > 0) {
                    var response = responseData[0].value;
                    if ($string.isNullOrEmpty(response.PromptResult) == false) {
                        syn.$l.get('txtPromptResult').value = response.PromptResult;
                    }
                    else {
                        syn.$l.get('txtPromptResult').value = JSON.stringify(responseData, null, 2);
                    }
                }
                else {
                    syn.$w.alert(`${serverFunctionID} 거래 확인 필요.`);
                }
            });
        },

        btnAddParameters_click() {
            syn.uicontrols.$grid.insertRow('grdParameters', {
                amount: 1,
                focusColumnID: 'VariableID'
            });
        },

        btnRemoveParameters_click() {
            syn.uicontrols.$grid.removeRow('grdParameters');
        }
    },

    method: {
        setFunctionArguments(inputObjects) {
            var items = syn.uicontrols.$grid.getSettings('grdParameters').data;
            for (var i = 0, length = items.length; i < length; i++) {
                var item = items[i];
                if (item.VariableID == 'UserMessage') {
                    continue;
                }

                inputObjects.push({ prop: item.VariableID, val: item.VariableValue });
            }
        },

        drawHtmlTemplate(elID, templateID, dataSource, prefixHtml) {
            var drawEl = syn.$l.get(elID);
            var tplEL = syn.$l.get(templateID);

            try {
                drawEl.innerHTML = '';
                var templateHtml = tplEL.innerHTML;
                drawEl.innerHTML = Mustache.render(templateHtml, dataSource);
            } catch (error) {
                syn.$l.eventLog('$this.method.drawHtmlTemplate', error.stack, 'Error');
            }
        }
    }
}
