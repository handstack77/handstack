using Microsoft.AspNetCore.Http;

using Newtonsoft.Json;

namespace HandStack.Core.Extensions
{
    /// <code>
    /// if (HttpContext.Session.Get<DateTime>(SessionKeyTime) == default)
    /// {
    ///     HttpContext.Session.Set<DateTime>(SessionKeyTime, currentTime);
    /// }
    /// </code>
    public static class SessionExtensions
    {
        public static void Set<T>(this ISession session, string key, T value)
        {
            session.SetString(key, JsonConvert.SerializeObject(value));
        }

        public static T? Get<T>(this ISession session, string key)
        {
            var value = session.GetString(key);
            return value == null ? default(T) : JsonConvert.DeserializeObject<T>(value);
        }

        public static string SessionDecryptPad(this string text)
        {
            var padding = 3 - ((text.Length + 3) % 4);
            if (padding == 0)
            {
                return text;
            }
            return text + new string('=', padding);
        }
    }
}
