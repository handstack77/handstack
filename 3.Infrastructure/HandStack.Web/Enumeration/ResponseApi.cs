using System.Collections.Generic;

namespace HandStack.Web.Enumeration
{
    public enum ResponseApi
    {
        E10,
        E11,
        E12,
        E99,
        I20,
        I21,
        I22,
        I23,
        I24,
        I25,
        I31,
        I40,
        I41,
        I42
    }

    public static class ResponseApiExtensions
    {
        private static readonly Dictionary<ResponseApi, string> StringValues = new Dictionary<ResponseApi, string>
        {
            { ResponseApi.E10, "E10: APPLICATION_ERROR, 어플리케이션 오류" },
            { ResponseApi.E11, "E11: CONFIGURATION_ERROR, 설정 오류" },
            { ResponseApi.E11, "E12: SERVICE_EXECUTE_ERROR, 서비스 실행 오류" },
            { ResponseApi.E99, "E99: UNKNOWN_ERROR, 기타 오류" },
            { ResponseApi.I20, "I20: NO_OPENAPI_SERVICE_ERROR, 해당 오픈 API 서비스가 없거나 폐기됨" },
            { ResponseApi.I21, "I21: SERVICE_ACCESS_DENIED_ERROR, 서비스 접근 거부" },
            { ResponseApi.I22, "I22: LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR, 서비스 요청 제한 횟수 초과" },
            { ResponseApi.I23, "I23: REQUEST_REQUIRED_ERROR, 서비스 요청 정보 확인 필요" },
            { ResponseApi.I24, "I24: SERVICE_DATASOURCE_ERROR, 서비스 데이터 소스 확인 필요" },
            { ResponseApi.I25, "I25: SERVICE_SETTING_ERROR, 서비스 설정 정보 확인 필요" },
            { ResponseApi.I31, "I31: DEADLINE_HAS_EXPIRED_ERROR, 활용기간 만료" },
            { ResponseApi.I40, "I40: HTTP_ERROR, HTTP 에러" },
            { ResponseApi.I41, "I41: UNREGISTERED_SECRET_KEY_ERROR, 등록되지 않은 서비스 키" },
            { ResponseApi.I42, "I42: UNREGISTERED_IP_ERROR, 등록되지 않은 IP" }
        };

        public static string ToEnumString(this ResponseApi key)
        {
            return StringValues[key];
        }
    }
}
