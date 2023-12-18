using System;
using System.Collections.Generic;

namespace HandStack.Core.ExtensionMethod
{
    public static class CollectionExtensions
    {
        public static bool AddUnique<T>(this ICollection<T> @this, T value)
        {
            if (@this.Contains(value) == false)
            {
                @this.Add(value);
                return true;
            }

            return false;
        }

        public static bool AddUnique<T>(this IList<T> @this, int index, T item)
        {
            if (@this.Contains(item) == false)
            {
                @this.Insert(index, item);
                return true;
            }

            return false;
        }

        public static string CharArrayToString(this char[] @this)
        {
            string result = "";
            Array.Sort(@this);
            foreach (char c in @this)
            {
                if (char.IsLetter(c))
                {
                    result += c;
                    result += ',';
                }
            }
            if (result.Length > 1)
            {
                result = result.Substring(0, result.Length - 1);
            }
            return result;
        }

        public static bool IsContains(this char[] @this, char character)
        {
            foreach (char c in @this)
            {
                if (c.Equals(character))
                {
                    return true;
                }
            }
            return false;
        }

        public static void AddCommaSeperatedValues(this ICollection<string> current, string raw)
        {
            if (current == null)
            {
                return;
            }

            var valuesToAdd = raw.SplitComma();
            foreach (var value in valuesToAdd)
            {
                current.Add(value);
            }
        }
    }
}
