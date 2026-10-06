using System;
using System.Collections.Generic;
using System.Linq;

namespace HandStack.Core.ExtensionMethod
{
    public static class ExceptionExtensions
    {
        public static Exception GetOriginalException(this Exception @this)
        {
            ArgumentNullException.ThrowIfNull(@this);

            if (@this.InnerException == null)
            {
                return @this;
            }

            return @this.InnerException.GetOriginalException();
        }

        public static string GetOriginalMessage(this Exception @this)
        {
            ArgumentNullException.ThrowIfNull(@this);

            if (@this.InnerException == null)
            {
                return @this.Message;
            }
            else
            {
                return @this.InnerException.GetOriginalMessage();
            }
        }

        public static IEnumerable<string> GetAllMessages(this Exception @this)
        {
            var result = Enumerable.Empty<string>();
            ArgumentNullException.ThrowIfNull(@this);
            if (@this.InnerException != null)
            {
                result = [.. @this.InnerException.GetAllMessages(), @this.Message];
            }
            return result;
        }

        public static string GetOriginalStackTrace(this Exception @this)
        {
            ArgumentNullException.ThrowIfNull(@this);

            if (@this.InnerException == null)
            {
                return @this.StackTrace ?? "";
            }
            else
            {
                return @this.InnerException.GetOriginalStackTrace();
            }
        }

        public static string GetOriginalSource(this Exception @this)
        {
            ArgumentNullException.ThrowIfNull(@this);

            if (@this.InnerException == null)
            {
                return @this.Source ?? "";
            }
            else
            {
                return @this.InnerException.GetOriginalSource();
            }
        }
    }
}
