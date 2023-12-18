namespace HandStack.Core.DataModel
{
    public abstract class BusinessRule
    {
        public string PropertyName { get; set; }

        public string ErrorMessage { get; set; }

        public BusinessRule(string propertyName)
        {
            PropertyName = propertyName;
            ErrorMessage = propertyName + "은 유효하지 않습니다.";
        }

        public BusinessRule(string propertyName, string errorMessage) : this(propertyName)
        {
            ErrorMessage = errorMessage;
        }

        public abstract bool Validate(EntityObject businessObject);

        protected object? GetPropertyValue(EntityObject businessObject)
        {
            return businessObject?.GetType()?.GetProperty(PropertyName)?.GetValue(businessObject, null);
        }
    }
}
