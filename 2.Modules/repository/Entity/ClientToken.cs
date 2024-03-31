using System;

namespace repository.Entity
{
	public class ClientToken
    {
        public ClientToken() {
            ClientIP = "";
            LastedDownloadTime = DateTime.Now;
        }

        public string ClientIP;
        public DateTime LastedDownloadTime;
    }
}
