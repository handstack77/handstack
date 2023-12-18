using System;

namespace HandStack.Web.Modules
{
    public class MissingModuleManifestException : Exception
    {
        public string ModuleName { get; }

        public MissingModuleManifestException()
        {
            ModuleName = "";
        }

        public MissingModuleManifestException(string message) : base(message)
        {
            ModuleName = "";
        }

        public MissingModuleManifestException(string message, string moduleName) : this(message)
        {
            ModuleName = moduleName;
        }
    }
}
