using System.Collections.Generic;

namespace handstack.Entity
{
    public class Tasks
    {
        public string key = "";
        public string os = "";
        public string? basepath = "";
        public bool? ignoreExit = false;
        public List<string> commands = [];
        public Dictionary<string, string> environments = [];
    }
}
