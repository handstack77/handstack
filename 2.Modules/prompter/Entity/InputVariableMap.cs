namespace prompter.Entity
{
    public class InputVariableMap
    {
        public string Name { get; set; }

        public string DefaultValue { get; set; }

        public string TestValue { get; set; }

        public string DbType { get; set; }

        public bool IsRequired { get; set; }

        public string Description { get; set; }

        public InputVariableMap()
        {
            Name = "";
            DefaultValue = "";
            TestValue = "";
            DbType = "";
            IsRequired = false;
            Description = "";
        }
    }
}
