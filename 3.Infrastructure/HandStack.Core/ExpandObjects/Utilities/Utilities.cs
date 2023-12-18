using System;
using System.Reflection;

namespace HandStack.Core.ExpendObjects
{
    internal static class Utilities
    {
        public static Type? GetTypeFromName(string typeName)
        {
            Type? type = null;
            foreach (Assembly ass in AppDomain.CurrentDomain.GetAssemblies())
            {
                type = ass.GetType(typeName, false);

                if (type != null)
                {
                    break;
                }

            }
            return type;
        }

        public static string? MapTypeToXmlType(Type type)
        {
            string? result = null;
            if (type == typeof(string))
            {
                result = "string";
            }
            else if (type == typeof(char))
            {
                result = "char";
            }
            else if (type == typeof(short))
            {
                result = "short";
            }
            else if (type == typeof(ushort))
            {
                result = "ushort";
            }
            else if (type == typeof(int))
            {
                result = "int";
            }
            else if (type == typeof(uint))
            {
                result = "uint";
            }
            else if (type == typeof(long))
            {
                result = "long";
            }
            else if (type == typeof(ulong))
            {
                result = "ulong";
            }
            else if (type == typeof(bool))
            {
                result = "boolean";
            }
            else if (type == typeof(DateTime))
            {
                result = "datetime";
            }
            else if (type == typeof(DateTimeOffset))
            {
                result = "datetimeoffset";
            }
            else if (type == typeof(float))
            {
                result = "float";
            }
            else if (type == typeof(decimal))
            {
                result = "decimal";
            }
            else if (type == typeof(double))
            {
                result = "double";
            }
            else if (type == typeof(byte))
            {
                result = "byte";
            }
            else if (type == typeof(sbyte))
            {
                result = "sbyte";
            }
            else if (type == typeof(byte[]))
            {
                result = "base64";
            }

            return result;
        }


        public static Type? MapXmlTypeToType(string xmlType)
        {
            Type? result = null;
            xmlType = xmlType.ToLower();

            if (xmlType == "string")
            {
                result = typeof(string);
            }
            else if (xmlType == "char")
            {
                result = typeof(char);
            }
            else if (xmlType == "short")
            {
                result = typeof(short);
            }
            else if (xmlType == "ushort")
            {
                result = typeof(ushort);
            }
            else if (xmlType == "int")
            {
                result = typeof(int);
            }
            else if (xmlType == "uint")
            {
                result = typeof(uint);
            }
            else if (xmlType == "long")
            {
                result = typeof(long);
            }
            else if (xmlType == "ulong")
            {
                result = typeof(ulong);
            }
            else if (xmlType == "boolean")
            {
                result = typeof(bool);
            }
            else if (xmlType == "datetime")
            {
                result = typeof(DateTime);
            }
            else if (xmlType == "datetimeoffset")
            {
                result = typeof(DateTimeOffset);
            }
            else if (xmlType == "float")
            {
                result = typeof(float);
            }
            else if (xmlType == "decimal")
            {
                result = typeof(decimal);
            }
            else if (xmlType == "double")
            {
                result = typeof(double);
            }
            else if (xmlType == "byte")
            {
                result = typeof(byte);
            }
            else if (xmlType == "sbyte")
            {
                result = typeof(sbyte);
            }
            else if (xmlType == "base64")
            {
                result = typeof(byte[]);
            }

            return result;
        }
    }
}
