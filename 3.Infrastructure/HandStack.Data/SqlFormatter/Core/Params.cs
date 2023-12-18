using System.Collections.Generic;
using System.Linq;

namespace HandStack.Data.SqlFormatter.Core
{
    internal sealed class Params
    {
        private readonly IReadOnlyDictionary<string, string>? parameters;
        private int index;

        public Params(IReadOnlyDictionary<string, string>? parameters)
        {
            this.parameters = parameters;
        }

        internal string? Get(string key)
        {
            if (parameters is null)
            {
                return null;
            }

            if (key is not null && key.Length != 0)
            {
                parameters.TryGetValue(key, out string? paramValue);
                return paramValue;
            }

            return parameters.ElementAtOrDefault(index++).Value ?? null;
        }
    }
}
