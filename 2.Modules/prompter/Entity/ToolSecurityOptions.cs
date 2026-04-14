using System.Collections.Generic;

namespace prompter.Entity
{
    public record AllowedKernelPlugin
    {
        public string Name { get; set; }

        public List<string> Functions { get; set; }

        public AllowedKernelPlugin()
        {
            Name = "";
            Functions = new List<string>();
        }
    }

    public record AllowedExternalTool
    {
        public string Name { get; set; }

        public string CommandPrefix { get; set; }

        public string ArgsPrefix { get; set; }

        public string WorkingDirectory { get; set; }

        public int Timeout { get; set; }

        public AllowedExternalTool()
        {
            Name = "";
            CommandPrefix = "";
            ArgsPrefix = "";
            WorkingDirectory = "";
            Timeout = 10;
        }
    }
}
