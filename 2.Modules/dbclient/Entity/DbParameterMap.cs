namespace dbclient.Entity
{
    public record DbParameterMap
    {
        public string Name { get; set; }

        public string DefaultValue { get; set; }

        public string Transform { get; set; }

        public string TestValue { get; set; }

        public bool IsRequired { get; set; }

        public string DbType { get; set; }

        public int Length { get; set; }

        public string Direction { get; set; }

        public DbParameterMap()
        {
            Name = "";
            DefaultValue = "";
            Transform = "";
            TestValue = "";
            IsRequired = false;
            DbType = "";
            Length = 0;
            Direction = "";
        }
    }
}
