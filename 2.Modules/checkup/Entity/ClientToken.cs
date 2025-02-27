using System;

namespace checkup.Entity
{
	public record ClientToken
    {
        public string ClientIP = "";
        public DateTime LastedDownloadTime;
    }
}
