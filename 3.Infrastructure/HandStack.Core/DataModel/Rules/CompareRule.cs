using System;

namespace HandStack.Core.DataModel.Rules
{
    public class CompareRule : BusinessRule
    {
        private string otherPropertyName { get; set; }
        private ValidationType validationType { get; set; }
        private ValidationOperator validationOperator { get; set; }

        public CompareRule(string propertyName, string compareName, ValidationOperator compareOperator, ValidationType validation) : base(propertyName)
        {

            otherPropertyName = compareName;
            validationOperator = compareOperator;
            validationType = validation;

            ErrorMessage = string.Concat("비교 식 오류 propertyName: ", propertyName, ", propertyName: ", compareName, " message: ", validationOperator.ToString());
        }

        public CompareRule(string propertyName, string compareName, string errorMessage, ValidationOperator compareOperator, ValidationType validation) : this(propertyName, compareName, compareOperator, validation)
        {
            ErrorMessage = errorMessage;
        }

        public override bool Validate(EntityObject businessObject)
        {
            try
            {
                string? propertyValue1 = businessObject?.GetType()?.GetProperty(PropertyName)?.GetValue(businessObject, null)?.ToString();
                string? propertyValue2 = businessObject?.GetType()?.GetProperty(otherPropertyName)?.GetValue(businessObject, null)?.ToString();

                switch (validationType)
                {
                    case ValidationType.Integer:
                        if (string.IsNullOrEmpty(propertyValue1) == true || string.IsNullOrEmpty(propertyValue2) == true)
                        {
                            return false;
                        }

                        int integerValue1 = int.Parse(propertyValue1);
                        int integerValue2 = int.Parse(propertyValue2);

                        switch (validationOperator)
                        {
                            case ValidationOperator.Equal: return integerValue1 == integerValue2;
                            case ValidationOperator.NotEqual: return integerValue1 != integerValue2;
                            case ValidationOperator.GreaterThan: return integerValue1 > integerValue2;
                            case ValidationOperator.GreaterThanEqual: return integerValue1 >= integerValue2;
                            case ValidationOperator.LessThan: return integerValue1 < integerValue2;
                            case ValidationOperator.LessThanEqual: return integerValue1 <= integerValue2;
                        }
                        break;

                    case ValidationType.Double:
                        if (string.IsNullOrEmpty(propertyValue1) == true || string.IsNullOrEmpty(propertyValue2) == true)
                        {
                            return false;
                        }

                        double doubleValue1 = double.Parse(propertyValue1);
                        double doubleValue2 = double.Parse(propertyValue2);

                        switch (validationOperator)
                        {
                            case ValidationOperator.Equal: return doubleValue1 == doubleValue2;
                            case ValidationOperator.NotEqual: return doubleValue1 != doubleValue2;
                            case ValidationOperator.GreaterThan: return doubleValue1 > doubleValue2;
                            case ValidationOperator.GreaterThanEqual: return doubleValue1 >= doubleValue2;
                            case ValidationOperator.LessThan: return doubleValue1 < doubleValue2;
                            case ValidationOperator.LessThanEqual: return doubleValue1 <= doubleValue2;
                        }
                        break;

                    case ValidationType.Decimal:
                        if (string.IsNullOrEmpty(propertyValue1) == true || string.IsNullOrEmpty(propertyValue2) == true)
                        {
                            return false;
                        }

                        decimal decimalValue1 = decimal.Parse(propertyValue1);
                        decimal decimalValue2 = decimal.Parse(propertyValue2);

                        switch (validationOperator)
                        {
                            case ValidationOperator.Equal: return decimalValue1 == decimalValue2;
                            case ValidationOperator.NotEqual: return decimalValue1 != decimalValue2;
                            case ValidationOperator.GreaterThan: return decimalValue1 > decimalValue2;
                            case ValidationOperator.GreaterThanEqual: return decimalValue1 >= decimalValue2;
                            case ValidationOperator.LessThan: return decimalValue1 < decimalValue2;
                            case ValidationOperator.LessThanEqual: return decimalValue1 <= decimalValue2;
                        }
                        break;

                    case ValidationType.Date:
                        if (string.IsNullOrEmpty(propertyValue1) == true || string.IsNullOrEmpty(propertyValue2) == true)
                        {
                            return false;
                        }

                        DateTime dateValue1 = DateTime.Parse(propertyValue1);
                        DateTime dateValue2 = DateTime.Parse(propertyValue2);

                        switch (validationOperator)
                        {
                            case ValidationOperator.Equal: return dateValue1 == dateValue2;
                            case ValidationOperator.NotEqual: return dateValue1 != dateValue2;
                            case ValidationOperator.GreaterThan: return dateValue1 > dateValue2;
                            case ValidationOperator.GreaterThanEqual: return dateValue1 >= dateValue2;
                            case ValidationOperator.LessThan: return dateValue1 < dateValue2;
                            case ValidationOperator.LessThanEqual: return dateValue1 <= dateValue2;
                        }
                        break;

                    case ValidationType.String:

                        int result = string.Compare(propertyValue1, propertyValue2, StringComparison.CurrentCulture);

                        switch (validationOperator)
                        {
                            case ValidationOperator.Equal: return result == 0;
                            case ValidationOperator.NotEqual: return result != 0;
                            case ValidationOperator.GreaterThan: return result > 0;
                            case ValidationOperator.GreaterThanEqual: return result >= 0;
                            case ValidationOperator.LessThan: return result < 0;
                            case ValidationOperator.LessThanEqual: return result <= 0;
                        }
                        break;

                }
                return false;
            }
            catch { return false; }
        }
    }
}
