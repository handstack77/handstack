using System;
using System.Collections.Generic;
using System.Reflection;

namespace HandStack.Web.Modules
{
    public class ModuleInfo
    {
        public string ModuleID { get; set; }

        public string Name { get; set; }

        public string BasePath { get; set; }

        public bool IsBundledWithHost { get; set; }

        public Version Version { get; set; }

        public Assembly? Assembly { get; set; }

        public List<string> EventAction { get; set; }

        public List<string> SubscribeAction { get; set; }

        public ModuleInfo()
        {
            ModuleID = "";
            Name = "";
            BasePath = "";
            IsBundledWithHost = false;
            Version = Version.Parse("0.0.0");
            Assembly = null;
            EventAction = new List<string>(); // ToModuleEventID
            SubscribeAction = new List<string>(); // SubscribeEventID
        }
    }
}
