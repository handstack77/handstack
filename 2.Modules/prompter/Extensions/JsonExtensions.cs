namespace prompter.Extensions
{
    public static class JsonExtensions
    {
        public static string toMetaDataType(string dataType)
        {
            var result = dataType switch
            {
                "Boolean" => "bool",
                "DateTime" => "date",
                "Byte" or "Guid" or "Char" or "String" or "TimeSpan" or "SByte" => "string",
                "Decimal" or "Double" or "Single" => "numeric",
                "Int16" or "Int32" or "Int64" or "UInt16" or "UInt32" or "UInt64" => "number",
                _ => "string",
            };
            return result;
        }
    }
}
