using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;

namespace HandStack.Core.ExtensionMethod
{
    public static class EnumerableExtensions
    {
        /// <code>
        /// var @list = new[] { "1", "2", "3" };
        /// list.ForEach(Console.WriteLine);
        /// </code>
        public static void ForEach<T>(this IEnumerable<T> @this, Action<T> action)
        {
            foreach (var value in @this)
            {
                action(value);
            }
        }

        /// <code>
        /// var query = list.Distinct(p => new { p.Id, p.Name });
        /// var query = list.Distinct(p => p.Id);
        /// </code>
        public static IEnumerable<TSource> Distinct<TSource, TKey>(this IEnumerable<TSource> @this, Func<TSource, TKey> keySelector)
        {
            HashSet<TKey> seenKeys = new HashSet<TKey>();
            foreach (TSource element in @this)
            {
                if (seenKeys.Add(keySelector(element)))
                {
                    yield return element;
                }
            }
        }

        public static string? GetDescriptionFromValue<T>(this T @this) where T : Enum
        {
            string strValue = @this.ToString();

            var description =
                typeof(T).GetField(strValue)?
                .GetCustomAttributes(typeof(DescriptionAttribute), false)
                .Cast<DescriptionAttribute>()
                .FirstOrDefault()
                ?.Description;

            return description ?? strValue;
        }
    }
}
