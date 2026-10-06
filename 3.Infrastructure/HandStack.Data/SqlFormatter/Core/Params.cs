using System.Collections.Generic;
using System.Linq;

namespace HandStack.Data.SqlFormatter.Core
{
    internal sealed class Params(IReadOnlyDictionary<string, string>? parameters)
    {
        private readonly IReadOnlyDictionary<string, string>? parameters = parameters;
        private int index;

        internal string? Get(string key)
        {
            if (parameters is null)
            {
                return null;
            }

            if (key is not null && key.Length != 0)
            {
                parameters.TryGetValue(key, out var paramValue);
                return paramValue;
            }

            return parameters.ElementAtOrDefault(index++).Value ?? null;
        }
    }
}
