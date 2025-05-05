using System;
using System.Collections.Generic;
using System.Linq;

using HandStack.Web.Entity;

using Newtonsoft.Json;

namespace HandStack.Web.Extensions
{
    public static class ObjectExtensions
    {
        public static string AsJson(this object @this, bool? format = false)
        {
            return JsonConvert.SerializeObject(@this, format == true ? Formatting.Indented : Formatting.None);
        }

        public static int GetRoleValue(this Role roles, object roleNames, bool isHighLow = true)
        {
            IEnumerable<string> namesArray;

            if (roleNames is IEnumerable<string> stringArray)
            {
                namesArray = stringArray;
            }
            else if (roleNames is string singleName)
            {
                namesArray = new[] { singleName };
            }
            else
            {
                return -1;
            }

            var values = namesArray
                .Select(name => Enum.TryParse<Role>(name, out var role) ? (int)role : -1)
                .ToList();

            if (values.Count() == 0)
            {
                return -1;
            }

            return isHighLow ? values.Min() : values.Max();
        }

        public static string? GetRoleName(this Role roles, object roleValues, bool isHighLow = true)
        {
            IEnumerable<int> valuesArray;

            if (roleValues is IEnumerable<int> intArray)
            {
                valuesArray = intArray;
            }
            else if (roleValues is int singleValue)
            {
                valuesArray = new[] { singleValue };
            }
            else
            {
                return null;
            }

            var numbers = valuesArray
                .Where(v => Enum.IsDefined(typeof(Role), v))
                .ToList();

            if (numbers.Count == 0)
            {
                return null;
            }

            var roleValue = isHighLow ? numbers.Min() : numbers.Max();
            return Enum.GetName(typeof(Role), roleValue);
        }
    }
}
