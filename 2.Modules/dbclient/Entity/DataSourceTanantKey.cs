namespace dbclient.Entity
{
    public class DataSourceTanantKey
    {
        public string DataSourceID { get; set; }

        public string TanantPattern { get; set; }

        public string TanantValue { get; set; }

        public DataSourceTanantKey()
        {
            DataSourceID = "";
            TanantPattern = "";
            TanantValue = "";
        }
    }
}
