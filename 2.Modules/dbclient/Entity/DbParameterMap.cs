namespace dbclient.Entity
{
    public class DbParameterMap
    {
        public string Name { get; set; }

        public string DefaultValue { get; set; }

        public string TestValue { get; set; }

        public string DbType { get; set; }

        public int Length { get; set; }

        public string Direction { get; set; }

        public DbParameterMap()
        {
            Name = "";
            DefaultValue = "";
            TestValue = "";
            DbType = "";
            Length = 0;
            Direction = "";
        }
    }
}
