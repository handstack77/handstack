using Newtonsoft.Json;

namespace checkup.Entity
{
    public class Menu
    {
        public string menuID { get; set; } = "";

        public string menuName { get; set; } = "";

        public string? parentMenuID { get; set; } = "";

        public string? parentMenuName { get; set; } = "";

        public string showYN { get; set; } = "";

        public string? directoryYN { get; set; }

        public string menuType { get; set; } = "";

        public string functions { get; set; } = "";

        public string projectID { get; set; } = "";

        public string fileID { get; set; } = "";

        public int sortingNo { get; set; }

        public int level { get; set; }

        public string icon { get; set; } = "";

        public string badge { get; set; } = "";

        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public string? projectType { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public string? extension { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public string? lastWriteTime { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public string? length { get; set; }

        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public string? md5 { get; set; }
    }
}
