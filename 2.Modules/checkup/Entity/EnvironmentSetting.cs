using System.Collections.Generic;

namespace checkup.Entity
{
    public class EnvironmentSetting
    {
        public Application Application { get; set; } = new Application();

        public Dictionary<string, object>? Cookie { get; set; }

        public Dictionary<string, object>? Header { get; set; }

        public Definition Definition { get; set; } = new Definition();
    }

    public class Application
    {
        public string LoaderPath { get; set; } = string.Empty;

        public bool IsDebugMode { get; set; } = true;

        public string CodeHelpID { get; set; } = string.Empty;
    }

    public class Definition
    {
        public List<string> Styles { get; set; } = new List<string>();

        public List<string> Scripts { get; set; } = new List<string>();

        public List<string> Controls { get; set; } = new List<string>();
    }
}
