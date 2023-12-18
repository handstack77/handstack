namespace HandStack.Web.MessageContract.DataObject
{
    public class TransactField
    {
        public TransactField()
        {
            FieldID = "";
            Length = -1;
            DataType = "String";
            Value = null;
        }

        public string FieldID { get; set; }

        public int Length { get; set; }

        public string DataType { get; set; }

        public object? Value { get; set; }
    }
}
