using System;
using System.Collections.Generic;
using System.Linq;

namespace HandStack.Core.ExtensionMethod
{
    public static class ExceptionExtensions
    {
        public static Exception GetOriginalException(this Exception @this)
        {
            if (@this.InnerException == null)
            {
                return @this;
            }

            return @this.InnerException.GetOriginalException();
        }

        public static string GetOriginalMessage(this Exception @this)
        {
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
            IEnumerable<string> result = Enumerable.Empty<string>();
            if (@this.InnerException != null)
            {
                result = new List<string>(@this.InnerException.GetAllMessages()) { @this.Message };
            }
            return result;
        }

        public static string GetOriginalStackTrace(this Exception @this)
        {
            if (@this.InnerException == null)
            {
                return @this.StackTrace == null ? "" : @this.StackTrace;
            }
            else
            {
                return @this.InnerException.GetOriginalStackTrace();
            }
        }

        public static string GetOriginalSource(this Exception @this)
        {
            if (@this.InnerException == null)
            {
                return @this.Source == null ? "" : @this.Source;
            }
            else
            {
                return @this.InnerException.GetOriginalSource();
            }
        }
    }
}
