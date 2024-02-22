using System.Collections.Generic;

using Serilog;

namespace HandStack.Web.MessageContract.DataObject
{
    public class DataContext
    {
        public string? accessToken { get; set; }

        public Dictionary<string, string>? loadOptions { get; set; }

        public string globalID { get; set; }

        public string environment { get; set; }

        public string platform { get; set; }

        public string? dataProvider { get; set; }

        public string? connectionString { get; set; }

        public string? workingDirectoryPath { get; set; }

        public ModuleScriptMap featureMeta { get; set; }

        public FunctionHeader functionHeader { get; set; }

        public string fileDirectory { get; set; }

        public string? featureSQLPath { get; set; }

        public ILogger? logger { get; set; }

        public DataContext()
        {
            globalID = "";
            environment = "";
            platform = "";
            featureMeta = new ModuleScriptMap();
            functionHeader = new FunctionHeader();
            fileDirectory = "";
        }
    }
}
