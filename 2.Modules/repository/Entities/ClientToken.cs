using System;

namespace repository.Entities
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
