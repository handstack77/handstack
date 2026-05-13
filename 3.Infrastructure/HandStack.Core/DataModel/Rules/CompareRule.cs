using System;

using System.Globalization;

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
                var propertyValue1 = businessObject?.GetType()?.GetProperty(PropertyName)?.GetValue(businessObject, null)?.ToString();
                var propertyValue2 = businessObject?.GetType()?.GetProperty(otherPropertyName)?.GetValue(businessObject, null)?.ToString();

                switch (validationType)
                {
                    case ValidationType.Integer:
                        if (string.IsNullOrWhiteSpace(propertyValue1) || string.IsNullOrWhiteSpace(propertyValue2))
                        {
                            return false;
                        }

                        if (int.TryParse(propertyValue1, NumberStyles.Any, CultureInfo.CurrentCulture, out var integerValue1) == false ||
                            int.TryParse(propertyValue2, NumberStyles.Any, CultureInfo.CurrentCulture, out var integerValue2) == false)
                        {
                            return false;
                        }

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
                        if (string.IsNullOrWhiteSpace(propertyValue1) || string.IsNullOrWhiteSpace(propertyValue2))
                        {
                            return false;
                        }

                        if (double.TryParse(propertyValue1, NumberStyles.Any, CultureInfo.CurrentCulture, out var doubleValue1) == false ||
                            double.TryParse(propertyValue2, NumberStyles.Any, CultureInfo.CurrentCulture, out var doubleValue2) == false)
                        {
                            return false;
                        }

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
                        if (string.IsNullOrWhiteSpace(propertyValue1) || string.IsNullOrWhiteSpace(propertyValue2))
                        {
                            return false;
                        }

                        if (decimal.TryParse(propertyValue1, NumberStyles.Any, CultureInfo.CurrentCulture, out var decimalValue1) == false ||
                            decimal.TryParse(propertyValue2, NumberStyles.Any, CultureInfo.CurrentCulture, out var decimalValue2) == false)
                        {
                            return false;
                        }

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
                        if (string.IsNullOrWhiteSpace(propertyValue1) || string.IsNullOrWhiteSpace(propertyValue2))
                        {
                            return false;
                        }

                        if (DateTime.TryParse(propertyValue1, CultureInfo.CurrentCulture, DateTimeStyles.None, out var dateValue1) == false ||
                            DateTime.TryParse(propertyValue2, CultureInfo.CurrentCulture, DateTimeStyles.None, out var dateValue2) == false)
                        {
                            return false;
                        }

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

                        var result = string.Compare(propertyValue1, propertyValue2, StringComparison.CurrentCulture);

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

