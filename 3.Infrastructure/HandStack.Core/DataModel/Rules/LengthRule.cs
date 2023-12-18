namespace HandStack.Core.DataModel.Rules
{
    public class LengthRule : BusinessRule
    {
        private int minLength;
        private int maxLength;

        public LengthRule(string propertyName, int min, int max) : base(propertyName)
        {
            minLength = min;
            maxLength = max;

            ErrorMessage = string.Concat(propertyName, " 값 길이 오류 minLength: ", minLength, ", maxLength: ", maxLength);
        }

        public LengthRule(string propertyName, string errorMessage, int min, int max) : this(propertyName, min, max)
        {
            ErrorMessage = errorMessage;
        }

        public override bool Validate(EntityObject businessObject)
        {
            object? value = GetPropertyValue(businessObject);
            int length = 0;
            if (value == null)
            {
                return false;
            }
            else
            {
                string? data = value.ToString();
                length = data == null ? 0 : data.ToString().Length;
            }

            return length >= minLength && length <= maxLength;
        }
    }
}
