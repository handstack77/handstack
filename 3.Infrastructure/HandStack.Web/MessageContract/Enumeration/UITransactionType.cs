namespace HandStack.Web.MessageContract.Enumeration
{
    public enum TransactionRequestType
    {
        Row = 1,
        List = 2
    }

    public enum TransactionResponseType
    {
        Form = 1,
        Grid = 2,
        jqGrid = 3,
        Chart = 4,
        DataSet = 5,
        Addtion = 6
    }

    public enum TransactionCommandType
    {
        API = 'A',
        Console = 'C',
        Data = 'D',
        File = 'F'
    }

    public enum TransactionParameterHandlingType
    {
        Rejected = 1,
        ByPassing = 2,
        DefaultValue = 3
    }

    public enum TransactionDataType
    {
        String = 0,
        Int32 = 1,
        Boolean = 2,
        DateTime = 3,
        Int64 = 4
    }
}
