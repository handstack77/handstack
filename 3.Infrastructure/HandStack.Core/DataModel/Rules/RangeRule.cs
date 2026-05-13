using System;

using System.Globalization;

namespace HandStack.Core.DataModel.Rules
{
    public class RangeRule : BusinessRule
    {
        private ValidationType validationType { get; set; }
        private ValidationOperator validationOperator { get; set; }

        private object minValue { get; set; }
        private object maxValue { get; set; }

        public RangeRule(string propertyName, object min, object max, ValidationOperator compareOperator, ValidationType validation) : base(propertyName)
        {
            minValue = min;
            maxValue = max;

            validationOperator = compareOperator;
            validationType = validation;

            ErrorMessage = string.Concat(propertyName, " 값 범위 오류 minValue: ", min, ", maxValue: ", max);
        }

        public RangeRule(string propertyName, string errorMessage, object min, object max, ValidationOperator compareOperator, ValidationType validation) : this(propertyName, min, max, compareOperator, validation)
        {
            ErrorMessage = errorMessage;
        }

        public override bool Validate(EntityObject businessObject)
        {
            try
            {
                var value = GetPropertyValue(businessObject)?.ToString();

                if (string.IsNullOrWhiteSpace(value) || minValue == null || maxValue == null)
                {
                    return false;
                }

                switch (validationType)
                {
                    case ValidationType.Integer:
                        if (int.TryParse(minValue.ToString(), NumberStyles.Any, CultureInfo.CurrentCulture, out var imin) == false ||
                            int.TryParse(maxValue.ToString(), NumberStyles.Any, CultureInfo.CurrentCulture, out var imax) == false ||
                            int.TryParse(value, NumberStyles.Any, CultureInfo.CurrentCulture, out var ival) == false)
                        {
                            return false;
                        }

                        return (ival >= imin && ival <= imax);
                    case ValidationType.Long:
                        if (long.TryParse(minValue.ToString(), NumberStyles.Any, CultureInfo.CurrentCulture, out var lmin) == false ||
                            long.TryParse(maxValue.ToString(), NumberStyles.Any, CultureInfo.CurrentCulture, out var lmax) == false ||
                            long.TryParse(value, NumberStyles.Any, CultureInfo.CurrentCulture, out var lval) == false)
                        {
                            return false;
                        }

                        return (lval >= lmin && lval <= lmax);

                    case ValidationType.Double:
                        if (double.TryParse(minValue.ToString(), NumberStyles.Any, CultureInfo.CurrentCulture, out var dmin) == false ||
                            double.TryParse(maxValue.ToString(), NumberStyles.Any, CultureInfo.CurrentCulture, out var dmax) == false ||
                            double.TryParse(value, NumberStyles.Any, CultureInfo.CurrentCulture, out var dval) == false)
                        {
                            return false;
                        }

                        return (dval >= dmin && dval <= dmax);

                    case ValidationType.Float:
                        if (float.TryParse(minValue.ToString(), NumberStyles.Any, CultureInfo.CurrentCulture, out var fmin) == false ||
                            float.TryParse(maxValue.ToString(), NumberStyles.Any, CultureInfo.CurrentCulture, out var fmax) == false ||
                            float.TryParse(value, NumberStyles.Any, CultureInfo.CurrentCulture, out var fval) == false)
                        {
                            return false;
                        }

                        return (fval >= fmin && fval <= fmax);

                    case ValidationType.Decimal:
                        if (decimal.TryParse(minValue.ToString(), NumberStyles.Any, CultureInfo.CurrentCulture, out var cmin) == false ||
                            decimal.TryParse(maxValue.ToString(), NumberStyles.Any, CultureInfo.CurrentCulture, out var cmax) == false ||
                            decimal.TryParse(value, NumberStyles.Any, CultureInfo.CurrentCulture, out var cval) == false)
                        {
                            return false;
                        }

                        return (cval >= cmin && cval <= cmax);

                    case ValidationType.Date:
                        if (DateTime.TryParse(minValue.ToString(), CultureInfo.CurrentCulture, DateTimeStyles.None, out var tmin) == false ||
                            DateTime.TryParse(maxValue.ToString(), CultureInfo.CurrentCulture, DateTimeStyles.None, out var tmax) == false ||
                            DateTime.TryParse(value, CultureInfo.CurrentCulture, DateTimeStyles.None, out var tval) == false)
                        {
                            return false;
                        }

                        return (tval >= tmin && tval <= tmax);

                    case ValidationType.String:

                        var smin = minValue.ToString();
                        var smax = maxValue.ToString();

                        var result1 = string.Compare(smin, value);
                        var result2 = string.Compare(value, smax);

                        return result1 >= 0 && result2 <= 0;
                }

                return false;
            }
            catch
            {
                return false;
            }
        }
    }
}

