using System;
using System.Collections.Generic;
using System.IO;

namespace HandStack.Core.ExtensionMethod
{
    public static class TextReaderExtensions
    {
        /// <example>
        /// 	<code>
        /// 		using(var @this = fileInfo.OpenText()) {
        /// 		    foreach(var line in @this.IterateLines()) {
        /// 		    }
        /// 		}
        /// 	</code>
        /// </example>
        public static IEnumerable<string> IterateLines(this TextReader @this)
        {
            string? line = null;
            while ((line = @this.ReadLine()) != null)
            {
                yield return line;
            }
        }

        /// <example>
        /// 	<code>
        /// 		using(var @this = fileInfo.OpenText()) {
        /// 		    @this.IterateLines(line => Console.WriteLine(line));
        /// 		}
        /// 	</code>
        /// </example>
        public static void IterateLines(this TextReader @this, Action<string> action)
        {
            foreach (var line in @this.IterateLines())
            {
                action(line);
            }
        }
    }
}
