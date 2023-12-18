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
                string? value = GetPropertyValue(businessObject)?.ToString();

                if (string.IsNullOrEmpty(value) == true || minValue == null || maxValue == null)
                {
                    return false;
                }

                switch (validationType)
                {
                    case ValidationType.Integer:
                        string? iminData = minValue.ToString();
                        int imin = iminData == null ? 0 : int.Parse(iminData);
                        string? imaxData = maxValue.ToString();
                        int imax = imaxData == null ? 0 : int.Parse(imaxData);
                        int ival = int.Parse(value);

                        return (ival >= imin && ival <= imax);
                    case ValidationType.Long:
                        string? lminData = minValue.ToString();
                        long lmin = lminData == null ? 0 : long.Parse(lminData);
                        string? lmaxData = maxValue.ToString();
                        long lmax = lmaxData == null ? 0 : long.Parse(lmaxData);
                        long lval = long.Parse(value);

                        return (lval >= lmin && lval <= lmax);

                    case ValidationType.Double:
                        string? dminData = minValue.ToString();
                        double dmin = dminData == null ? 0 : double.Parse(dminData);
                        string? dmaxData = maxValue.ToString();
                        double dmax = dmaxData == null ? 0 : double.Parse(dmaxData);
                        double dval = double.Parse(value);

                        return (dval >= dmin && dval <= dmax);

                    case ValidationType.Float:
                        string? fminData = minValue.ToString();
                        float fmin = fminData == null ? 0 : float.Parse(fminData);
                        string? fmaxData = maxValue.ToString();
                        float fmax = fmaxData == null ? 0 : float.Parse(fmaxData);
                        float fval = float.Parse(value);

                        return (fval >= fmin && fval <= fmax);

                    case ValidationType.Decimal:
                        string? cminData = minValue.ToString();
                        decimal cmin = cminData == null ? 0 : decimal.Parse(cminData);
                        string? cmaxData = maxValue.ToString();
                        decimal cmax = cmaxData == null ? 0 : decimal.Parse(cmaxData);
                        decimal cval = decimal.Parse(value);

                        return (cval >= cmin && cval <= cmax);

                    case ValidationType.Date:
                        string? tminData = minValue.ToString();
                        DateTime tmin = tminData == null ? DateTime.MinValue : DateTime.Parse(tminData.ToString());
                        string? tmaxData = maxValue.ToString();
                        DateTime tmax = tmaxData == null ? DateTime.MinValue : DateTime.Parse(tmaxData.ToString());
                        DateTime tval = DateTime.Parse(value);

                        return (tval >= tmin && tval <= tmax);

                    case ValidationType.String:

                        string? smin = minValue.ToString();
                        string? smax = maxValue.ToString();

                        int result1 = string.Compare(smin, value);
                        int result2 = string.Compare(value, smax);

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
