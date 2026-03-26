using System.Text.Json;
using System.Text.Json.Serialization;

namespace updater
{
    internal static class JsonSettingsAccessor
    {
        public static readonly JsonSerializerOptions JsonSerializerOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            WriteIndented = true,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };
    }
}
