using Newtonsoft.Json;

namespace HandStack.Web.Extensions
{
    public static class ObjectExtensions
    {
        public static string AsJson(this object @this, bool? format = false)
        {
            return JsonConvert.SerializeObject(@this, format == true ? Formatting.Indented : Formatting.None);
        }
    }
}
