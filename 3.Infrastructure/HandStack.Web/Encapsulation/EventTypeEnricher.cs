using System;
using System.Text;

using Murmur;

using Serilog.Core;
using Serilog.Events;

namespace HandStack.Web.Encapsulation
{
    /// <example>
    /// logger
    ///     .ForContext(
    ///       new EventTypeEnricher()
    ///     ).Warning("");
    /// </example>
    public class EventTypeEnricher : ILogEventEnricher
    {
        public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
        {
            ArgumentNullException.ThrowIfNull(logEvent);

            ArgumentNullException.ThrowIfNull(propertyFactory);

            var murmur = MurmurHash.Create32();
            var bytes = Encoding.UTF8.GetBytes(logEvent.MessageTemplate.Text);
            var hash = murmur.ComputeHash(bytes);
            var hexadecimalHash = Convert.ToHexString(hash);
            var eventId = propertyFactory.CreateProperty("EventType", hexadecimalHash);
            logEvent.AddPropertyIfAbsent(eventId);
        }
    }
}
