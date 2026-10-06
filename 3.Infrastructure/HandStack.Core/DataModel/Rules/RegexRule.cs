using System.Text.RegularExpressions;

namespace HandStack.Core.DataModel.Rules
{
    public class RegexRule(string propertyName, string pattern) : BusinessRule(propertyName)
    {
        protected string Pattern { get; set; } = pattern;

        public RegexRule(string propertyName, string errorMessage, string pattern) : this(propertyName, pattern)
        {
            ErrorMessage = errorMessage;
        }

        public override bool Validate(EntityObject businessObject)
        {
            var value = GetPropertyValue(businessObject);
            bool result;
            if (value == null)
            {
                result = false;
            }
            else
            {
                var text = value.ToString();
                if (text == null)
                {
                    result = false;
                }
                else
                {
                    result = Regex.IsMatch(text, Pattern);
                }
            }
            return result;
        }
    }
}
