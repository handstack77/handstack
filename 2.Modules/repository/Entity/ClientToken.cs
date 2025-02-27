using System;

namespace repository.Entity
{
	public record ClientToken
    {
        public ClientToken() {
            ClientIP = "";
            LastedDownloadTime = DateTime.Now;
        }

        public string ClientIP;
        public DateTime LastedDownloadTime;
    }
}
