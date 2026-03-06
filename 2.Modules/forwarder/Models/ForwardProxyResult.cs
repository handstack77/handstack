using System;
using System.Collections.Generic;

namespace forwarder.Models
{
    public class ForwardProxyResult
    {
        public int StatusCode { get; set; }

        public string StatusText { get; set; } = string.Empty;

        public string ResponseUrl { get; set; } = string.Empty;

        public Dictionary<string, string> Headers { get; set; } = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        public byte[] Body { get; set; } = Array.Empty<byte>();
    }
}
