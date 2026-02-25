using System;

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
                        var iminData = minValue.ToString();
                        var imin = iminData == null ? 0 : int.Parse(iminData);
                        var imaxData = maxValue.ToString();
                        var imax = imaxData == null ? 0 : int.Parse(imaxData);
                        var ival = int.Parse(value);

                        return (ival >= imin && ival <= imax);
                    case ValidationType.Long:
                        var lminData = minValue.ToString();
                        var lmin = lminData == null ? 0 : long.Parse(lminData);
                        var lmaxData = maxValue.ToString();
                        var lmax = lmaxData == null ? 0 : long.Parse(lmaxData);
                        var lval = long.Parse(value);

                        return (lval >= lmin && lval <= lmax);

                    case ValidationType.Double:
                        var dminData = minValue.ToString();
                        var dmin = dminData == null ? 0 : double.Parse(dminData);
                        var dmaxData = maxValue.ToString();
                        var dmax = dmaxData == null ? 0 : double.Parse(dmaxData);
                        var dval = double.Parse(value);

                        return (dval >= dmin && dval <= dmax);

                    case ValidationType.Float:
                        var fminData = minValue.ToString();
                        var fmin = fminData == null ? 0 : float.Parse(fminData);
                        var fmaxData = maxValue.ToString();
                        var fmax = fmaxData == null ? 0 : float.Parse(fmaxData);
                        var fval = float.Parse(value);

                        return (fval >= fmin && fval <= fmax);

                    case ValidationType.Decimal:
                        var cminData = minValue.ToString();
                        var cmin = cminData == null ? 0 : decimal.Parse(cminData);
                        var cmaxData = maxValue.ToString();
                        var cmax = cmaxData == null ? 0 : decimal.Parse(cmaxData);
                        var cval = decimal.Parse(value);

                        return (cval >= cmin && cval <= cmax);

                    case ValidationType.Date:
                        var tminData = minValue.ToString();
                        var tmin = tminData == null ? DateTime.MinValue : DateTime.Parse(tminData.ToString());
                        var tmaxData = maxValue.ToString();
                        var tmax = tmaxData == null ? DateTime.MinValue : DateTime.Parse(tmaxData.ToString());
                        var tval = DateTime.Parse(value);

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

