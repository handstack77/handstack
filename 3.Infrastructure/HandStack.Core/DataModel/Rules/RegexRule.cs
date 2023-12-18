using System.Text.RegularExpressions;

namespace HandStack.Core.DataModel.Rules
{
    public class RegexRule : BusinessRule
    {
        protected string Pattern { get; set; }

        public RegexRule(string propertyName, string pattern) : base(propertyName)
        {
            Pattern = pattern;
        }

        public RegexRule(string propertyName, string errorMessage, string pattern) : this(propertyName, pattern)
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
                    result = Regex.Match(text, Pattern).Success;
                }
            }
            return result;
        }
    }
}
