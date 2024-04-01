namespace openapi.Extensions
{
    public static class JsonExtensions
    {
        public static string toMetaDataType(string dataType)
        {
            string result = "string";

            switch (dataType)
            {
                case "Boolean":
                    result = "bool";
                    break;
                case "DateTime":
                    result = "date";
                    break;
                case "Byte":
                case "Guid":
                case "Char":
                case "String":
                case "TimeSpan":
                case "SByte":
                    result = "string";
                    break;
                case "Decimal":
                case "Double":
                case "Single":
                    result = "number";
                    break;
                case "Int16":
                case "Int32":
                case "Int64":
                case "UInt16":
                case "UInt32":
                case "UInt64":
                    result = "int";
                    break;
                default:
                    result = "string";
                    break;
            }

            return result;
        }
    }
}
