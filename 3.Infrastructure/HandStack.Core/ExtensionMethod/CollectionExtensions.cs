using System;
using System.Collections.Generic;
using System.Text;

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
            Array.Sort(@this);
            var result = new StringBuilder(@this.Length);
            foreach (var c in @this)
            {
                if (char.IsLetter(c))
                {
                    if (result.Length > 0)
                    {
                        result.Append(',');
                    }
                    result.Append(c);
                }
            }
            return result.ToString();
        }

        public static bool IsContains(this char[] @this, char character)
        {
            foreach (var c in @this)
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

