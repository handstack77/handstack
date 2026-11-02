namespace dbclient.Entity
{
    public record DbParameterMap
    {
        public string Name { get; set; }

        public string DefaultValue { get; set; }

        public string Transform { get; set; }

        /// <summary>Bearer 토큰 값을 가리키는 입력 이름(예: $AgencyNo). 값이 있으면 요청의 같은 이름 값 대신 쓴다.</summary>
        public string Source { get; set; }

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
            Source = "";
            TestValue = "";
            IsRequired = false;
            DbType = "";
            Length = 0;
            Direction = "";
        }
    }
}
