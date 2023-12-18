using repository.Entities;

using System;
using System.Collections.Generic;
using System.Linq;

namespace repository.Extensions
{
    public static class ClientSessionManager
    {
        public static int PurgeTokenTimeout = 1200000;
        private static Dictionary<string, ClientToken> sessionTokens = new Dictionary<string, ClientToken>();

        public static string GetToken(string clientIP)
        {
            string result = "";
            string tokenID = sessionTokens.FirstOrDefault(item => item.Value.ClientIP == clientIP).Key;

            if (string.IsNullOrEmpty(tokenID) == false)
            {
                result = tokenID;
                sessionTokens[result].LastedDownloadTime = DateTime.Now;
            }
            else
            {
                result = Guid.NewGuid().ToString("N");
                lock (sessionTokens)
                {
                    sessionTokens.Add(result, new ClientToken()
                    {
                        ClientIP = clientIP,
                        LastedDownloadTime = DateTime.Now
                    });
                }
            }

            return result;
        }

        public static bool HasToken(string tokenID)
        {
            return sessionTokens.Select(item => item.Key == tokenID).FirstOrDefault();
        }

        public static bool IsToken(string clientIP)
        {
            return string.IsNullOrEmpty(sessionTokens.FirstOrDefault(item => item.Value.ClientIP == clientIP).Key) == false;
        }

        public static void PurgeSessions()
        {
            lock (sessionTokens)
            {
                var removeClientSessions = sessionTokens.Where(item => item.Value.LastedDownloadTime.AddSeconds(PurgeTokenTimeout) < DateTime.Now);

                foreach (var item in removeClientSessions)
                {
                    sessionTokens.Remove(item.Key);
                }
            }
        }

        public static void DeleteSessions(string tokenID)
        {
            lock (sessionTokens)
            {
                sessionTokens.Remove(tokenID);
            }
        }
    }
}
