using System;
using System.Collections.Generic;

namespace forwarder.Models
{
    public enum ForwardClientKind
    {
        Browser = 1,
        Program = 2
    }

    public class ForwardProxyRequest
    {
        public string UserID { get; set; } = string.Empty;

        public ForwardSessionDescriptor Session { get; set; } = new ForwardSessionDescriptor();

        public ForwardClientKind ClientKind { get; set; } = ForwardClientKind.Program;

        public string TargetUrl { get; set; } = string.Empty;

        public string Method { get; set; } = "GET";

        public Dictionary<string, string> Headers { get; set; } = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        public byte[] Body { get; set; } = Array.Empty<byte>();

        public int? TimeoutMS { get; set; }
    }
}
