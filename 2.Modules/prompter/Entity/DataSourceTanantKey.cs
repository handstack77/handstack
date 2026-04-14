namespace prompter.Entity
{
    public record DataSourceTanantKey
    {
        public string ApplicationID { get; set; }

        public string DataSourceID { get; set; }

        public string TanantPattern { get; set; }

        public string TanantValue { get; set; }

        public DataSourceTanantKey()
        {
            ApplicationID = "";
            DataSourceID = "";
            TanantPattern = "";
            TanantValue = "";
        }
    }
}
