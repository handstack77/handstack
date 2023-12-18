namespace HandStack.Web.MessageContract.DataObject
{
    public class DynamicParameter
    {
        public DynamicParameter()
        {
            ParameterName = "";
            Value = null;
            DbType = "String";
            Length = -1;
        }

        public string ParameterName { get; set; }

        public object? Value { get; set; }

        public string DbType { get; set; }

        public int Length { get; set; }
    }
}
