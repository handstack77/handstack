namespace HandStack.Core.DataModel.Rules
{
    public class RequiredRule : BusinessRule
    {
        public RequiredRule(string propertyName) : base(propertyName)
        {
            ErrorMessage = propertyName + " 필수 입력 확인";
        }

        public RequiredRule(string propertyName, string errorMessage) : base(propertyName)
        {
            ErrorMessage = errorMessage;
        }

        public override bool Validate(EntityObject businessObject)
        {
            bool result = false;
            object? value = GetPropertyValue(businessObject);
            if (value == null)
            {
                result = false;
            }
            else
            {
                string? text = value.ToString();
                if (text == null)
                {
                    result = false;
                }
                else
                {
                    result = text.Length > 0;
                }
            }
            return result;
        }
    }
}
