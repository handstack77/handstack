using System.Collections.Generic;

using HandStack.Web.Entity;

namespace HandStack.Core.Extensions
{
    public static class TransactionClientExtensions
    {
        public static void Add(this IList<ServiceParameter> parameters, string parameterName, object? value)
        {
            parameters.Add(new ServiceParameter() { prop = parameterName, val = value });
        }
    }
}
