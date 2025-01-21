using System;
using System.Collections.Generic;
using System.Reflection;

using Microsoft.Extensions.Configuration;

namespace HandStack.Web.Modules
{
    public class ModuleInfo
    {
        public string ModuleID { get; set; }

        public string Name { get; set; }

        public string BasePath { get; set; }

        public string ModuleSettingFilePath { get; set; }

        public IConfiguration? Configuration { get; set; }

        public bool IsBundledWithHost { get; set; }

        public bool IsCopyContract { get; set; }

        public bool IsPurgeContract { get; set; }

        public List<string> ContractBasePath { get; set; }

        public Version Version { get; set; }

        public Assembly? Assembly { get; set; }

        public List<string> EventAction { get; set; }

        public List<string> SubscribeAction { get; set; }

        public List<string> LoadPassAssemblyPath { get; set; }

        public ModuleInfo()
        {
            ModuleID = "";
            Name = "";
            BasePath = "";
            ModuleSettingFilePath = "";
            Configuration = null;
            IsBundledWithHost = false;
            IsCopyContract = true;
            IsPurgeContract = false;
            ContractBasePath = new List<string>();
            Version = Version.Parse("0.0.0");
            Assembly = null;
            EventAction = new List<string>(); // ToModuleEventID
            SubscribeAction = new List<string>(); // SubscribeEventID
            LoadPassAssemblyPath = new List<string>(); // SubscribeEventID
        }
    }
}
