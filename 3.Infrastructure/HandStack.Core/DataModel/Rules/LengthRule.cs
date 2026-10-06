namespace HandStack.Core.DataModel.Rules
{
    public class LengthRule : BusinessRule
    {
        private readonly int minLength;
        private readonly int maxLength;

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
            var value = GetPropertyValue(businessObject);
            int length;
            if (value == null)
            {
                return false;
            }
            else
            {
                var data = value.ToString();
                length = data == null ? 0 : data.ToString().Length;
            }

            return length >= minLength && length <= maxLength;
        }
    }
}
