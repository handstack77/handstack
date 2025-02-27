using System.Collections.Generic;

namespace checkup.Entity
{
    public record EnvironmentSetting
    {
        public Application Application { get; set; } = new Application();

        public Dictionary<string, object>? Cookie { get; set; }

        public Dictionary<string, object>? Header { get; set; }

        public Definition Definition { get; set; } = new Definition();
    }

    public record Application
    {
        public string LoaderPath { get; set; } = string.Empty;

        public bool IsDebugMode { get; set; } = true;

        public string CodeHelpID { get; set; } = string.Empty;
    }

    public record Definition
    {
        public List<string> Styles { get; set; } = new List<string>();

        public List<string> Scripts { get; set; } = new List<string>();

        public List<string> Controls { get; set; } = new List<string>();
    }
}
