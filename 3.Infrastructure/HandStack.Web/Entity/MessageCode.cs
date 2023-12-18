namespace HandStack.Web.Entity
{
    public static class MessageCode
    {
        public static string T100 = "(계속): 요청자는 요청을 계속해야 함. 서버는 이 코드를 제공하여 요청의 첫 번째 부분을 받았으며 나머지를 기다리고 있음";
        public static string T101 = "(프로토콜 전환): 요청자가 서버에 프로토콜 전환을 요청했으며 서버는 이를 승인하는 중";
        public static string T200 = "(성공): 서버가 요청을 제대로 처리";
        public static string T201 = "(작성됨): 성공적으로 요청되었으며 서버가 새 리소스를 작성";
        public static string T202 = "(허용됨): 서버가 요청을 접수했지만 아직 처리하지 않았음";
        public static string T203 = "(신뢰할 수 없는 정보): 서버가 요청을 성공적으로 처리했지만 다른 소스에서 수신된 정보를 제공하고 있음";
        public static string T204 = "(콘텐츠 없음): 서버가 요청을 성공적으로 처리했지만 콘텐츠를 제공하지 않음";
        public static string T205 = "(콘텐츠 재설정): 서버가 요청을 성공적으로 처리했지만 콘텐츠를 표시하지 않음";
        public static string T206 = "(일부 콘텐츠): 서버가 GET 요청의 일부만 성공적으로 처리함";
        public static string T305 = "(프록시 사용): 요청자는 프록시를 사용하여 요청한 페이지만 액세스 가능. 서버가 이 응답을 표시하면 요청자가 사용할 프록시를 가리키는 것이기도 함";
        public static string T307 = "(임시 리다이렉션): 현재 서버가 다른 위치의 페이지로 요청에 응답하고 있지만 요청자는 향후 요청 시 원래 위치를 계속 사용해야 함";
        public static string T400 = "(잘못된 요청): 서버가 요청의 구문을 인식하지 못함";
        public static string T401 = "(권한 없음): 이 요청은 인증이 필요. 서버는 로그인이 필요한 페이지에 대해 이 요청을 제공할 수 있음";
        public static string T402 = "(결제 필요): 이 요청은 책임자 승인 결제가 필요";
        public static string T403 = "(Forbidden, 금지됨): 서버가 요청을 거부함. 사용자가 리소스에 대한 필요 권한을 갖고 있지 않음";
        public static string T404 = "(Not Found, 찾을 수 없음): 서버가 요청 정보에 대한 응답 정보를 찾을 수 없음";
        public static string T405 = "(허용되지 않는 방법): 요청에 지정된 방법을 사용할 수 없음";
        public static string T406 = "(허용되지 않음): 요청한 페이지가 요청한 콘텐츠 특성으로 응답할 수 없음";
        public static string T408 = "(요청 시간초과): 서버의 요청 대기가 시간을 초과함";
        public static string T415 = "(지원되지 않는 미디어 유형): 요청이 지원하지 않는 형식으로 되어 있음";
        public static string T500 = "(내부 서버 오류): 서버에 오류가 발생하여 요청을 수행할 수 없음";
        public static string T501 = "(구현되지 않음): 서버에 요청을 수행할 수 있는 기능이 없음";
        public static string T502 = "(Bad Gateway, 불량 게이트웨이): 서버가 게이트웨이나 프록시 역할을 하고 있거나 또는 업스트림 서버에서 잘못된 응답을 받음";
        public static string T503 = "(서비스를 사용할 수 없음): 서버가 오버로드되었거나 유지관리를 위해 다운되었기 때문에 현재 서버를 사용할 수 없음";
        public static string T504 = "(게이트웨이 시간초과): 서버가 게이트웨이나 프록시 역할을 하고 있거나 또는 업스트림 서버에서 제때 요청을 받지 못함";
        public static string T520 = "(Unknown Error, 알 수 없음)";
        public static string T598 = "(네트워크 읽기 시간초과 오류, 알 수 없음)";
        public static string T599 = "(네트워크 연결 시간초과 오류, 알 수 없음)";
    }
}
