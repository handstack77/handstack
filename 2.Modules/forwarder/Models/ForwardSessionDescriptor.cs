using System;

namespace forwarder.Models
{
    public class ForwardSessionDescriptor
    {
        public string SessionKey { get; set; } = string.Empty;

        public string UserNo { get; set; } = string.Empty;

        public string UserID { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        public string DatabaseFilePath { get; set; } = string.Empty;
    }
}
