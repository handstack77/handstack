using System;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ack.Updates
{
    public static class UpdateStateStore
    {
        private static readonly JsonSerializerOptions JsonSerializerOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            WriteIndented = true,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        public static UpdateState Load(string stateFilePath)
        {
            try
            {
                if (File.Exists(stateFilePath) == false)
                {
                    return new UpdateState();
                }

                var text = File.ReadAllText(stateFilePath);
                if (string.IsNullOrWhiteSpace(text) == true)
                {
                    return new UpdateState();
                }

                return JsonSerializer.Deserialize<UpdateState>(text, JsonSerializerOptions) ?? new UpdateState();
            }
            catch
            {
                return new UpdateState();
            }
        }

        public static void Save(string stateFilePath, UpdateState state)
        {
            var directoryPath = Path.GetDirectoryName(stateFilePath);
            if (string.IsNullOrWhiteSpace(directoryPath) == false && Directory.Exists(directoryPath) == false)
            {
                Directory.CreateDirectory(directoryPath);
            }

            var json = JsonSerializer.Serialize(state, JsonSerializerOptions);
            File.WriteAllText(stateFilePath, json + Environment.NewLine);
        }
    }
}
