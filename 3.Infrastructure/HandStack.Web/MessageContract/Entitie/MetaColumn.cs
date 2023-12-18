namespace HandStack.Web.MessageContract.Entitie
{
    public partial class MetaColumn
    {
        public MetaColumn()
        {
            ColumnName = "";
            BaseColumnName = "";
            ColumnOrdinal = 0;
            ColumnSize = 0;
            NumericPrecision = 0;
            NumericScale = 0;
            DataType = "";
            DataTypeName = "";
            AllowDBNull = true;
            IsIdentity = false;
            IsAutoIncrement = false;
            IsReadOnly = false;
        }

        public string ColumnName { get; set; }

        public string BaseColumnName { get; set; }

        public int ColumnOrdinal { get; set; }

        public int ColumnSize { get; set; }

        public int NumericPrecision { get; set; }

        public int NumericScale { get; set; }

        public string DataType { get; set; }

        public string DataTypeName { get; set; }

        public bool AllowDBNull { get; set; }

        public bool IsIdentity { get; set; }

        public bool IsAutoIncrement { get; set; }

        public bool IsReadOnly { get; set; }
    }
}
