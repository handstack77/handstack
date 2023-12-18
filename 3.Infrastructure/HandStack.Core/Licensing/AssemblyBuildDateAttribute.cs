using System;
using System.Globalization;

namespace HandStack.Core.Licensing
{
    [AttributeUsage(AttributeTargets.Assembly, Inherited = false)]
    public sealed class AssemblyBuildDateAttribute : Attribute
    {
        private readonly DateTime buildDate;

        public AssemblyBuildDateAttribute(DateTime buildDate)
        {
            this.buildDate = buildDate;
        }

        public AssemblyBuildDateAttribute(string buildDateString)
        {
            buildDate = DateTime.Parse(buildDateString, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal);
        }

        public DateTime BuildDate
        {
            get { return buildDate; }
        }
    }
}