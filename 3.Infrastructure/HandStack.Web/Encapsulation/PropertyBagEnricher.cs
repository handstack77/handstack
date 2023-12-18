using System;
using System.Collections.Generic;

using Serilog.Core;
using Serilog.Events;

namespace HandStack.Web.Encapsulation
{
    /// <example>
    /// logger
    ///     .ForContext(
    ///       new PropertyBagEnricher()
    ///         .Add("ResponseCode", response?.ResponseCode)
    ///         .Add("EnrollmentStatus", response?.Enrolled)
    ///     ).Warning("");
    /// </example>
    public class PropertyBagEnricher : ILogEventEnricher
    {
        private readonly Dictionary<string, Tuple<object, bool>> properties;

        public PropertyBagEnricher()
        {
            properties = new Dictionary<string, Tuple<object, bool>>(StringComparer.OrdinalIgnoreCase);
        }

        public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
        {
            foreach (KeyValuePair<string, Tuple<object, bool>> prop in properties)
            {
                logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty(prop.Key, prop.Value.Item1, prop.Value.Item2));
            }
        }

        public PropertyBagEnricher Add(string key, object value, bool destructureObject = false)
        {
            if (string.IsNullOrEmpty(key)) throw new ArgumentNullException(nameof(key));

            if (!properties.ContainsKey(key)) properties.Add(key, Tuple.Create(value, destructureObject));

            return this;
        }
    }
}
