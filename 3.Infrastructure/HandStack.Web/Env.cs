using System;

using Microsoft.Extensions.Configuration;

namespace HandStack.Web
{
    internal sealed class Env
    {
        internal static string? Var(string name)
        {
            IConfigurationRoot? configuration;
            if (GlobalConfiguration.ConfigurationRoot == null)
            {
                configuration = new ConfigurationBuilder()
                    .AddUserSecrets<Env>()
                    .Build();
            }
            else
            {
                configuration = GlobalConfiguration.ConfigurationRoot;
            }

            var value = configuration[name];
            if (string.IsNullOrEmpty(value) == false)
            {
                return value;
            }

            value = Environment.GetEnvironmentVariable(name);

            return value;
        }
    }
}
