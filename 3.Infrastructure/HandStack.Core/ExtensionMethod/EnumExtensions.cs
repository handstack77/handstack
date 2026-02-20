using System;
using System.Linq;

namespace HandStack.Core.ExtensionMethod
{
    public static class EnumExtensions
    {
        public static TEnum ParseEnumName<TEnum>(string name, string? defaultName = null) where TEnum : struct, Enum
        {
            if (Enum.TryParse(name, true, out TEnum result) == true)
            {
                return result;
            }

            if (!string.IsNullOrEmpty(defaultName))
            {
                if (Enum.TryParse(defaultName, true, out TEnum defaultResult) == true)
                {
                    return defaultResult;
                }
            }

            return Enum.GetValues(typeof(TEnum)).Cast<TEnum>().First();
        }
    }
}

