namespace HandStack.Core.DataModel.Rules
{
    public class EmailRule : RegexRule
    {
        public EmailRule(string propertyName) : base(propertyName, @"\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*")
        {
            ErrorMessage = propertyName + "은 유효하지 않은 이메일 주소입니다.";
        }

        public EmailRule(string propertyName, string errorMessage) :
            this(propertyName)
        {
            ErrorMessage = errorMessage;
        }
    }
}
