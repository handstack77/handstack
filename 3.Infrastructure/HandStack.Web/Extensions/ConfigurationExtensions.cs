using System;
using System.Collections.Generic;

using Microsoft.Extensions.Configuration;

namespace HandStack.Web.Extensions
{
    public static class ConfigurationExtensions
    {
        public static Dictionary<string, T> GetDictionarySection<T>(this IConfiguration configuration, string path) where T : class, new() { 
            ArgumentNullException.ThrowIfNull(configuration);

            return configuration.GetSection(path).Get<Dictionary<string, T>>() ?? []; 
        }
    }
}
