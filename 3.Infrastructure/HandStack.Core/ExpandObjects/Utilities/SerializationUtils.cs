using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Text;
using System.Xml;
using System.Xml.Serialization;

namespace HandStack.Core.ExpendObjects
{
    internal static class SerializationUtils
    {
        public static bool SerializeObject(object instance, string fileName, bool throwExceptions)
        {
            bool result = true;

            try
            {
                XmlSerializer serializer = new XmlSerializer(instance.GetType());
                using (Stream fs = new FileStream(fileName, FileMode.Create))
                using (XmlTextWriter writer = new XmlTextWriter(fs, new UTF8Encoding()))
                {
                    writer.Formatting = Formatting.Indented;
                    writer.IndentChar = ' ';
                    writer.Indentation = 4;

                    serializer.Serialize(writer, instance);
                }
            }
            catch (Exception exception)
            {
                Debug.Write("SerializeObject exception: " + exception.GetBaseException().Message + "\r\n" + (exception.InnerException != null ? exception.InnerException.Message : ""), "West Wind");

                if (throwExceptions == true)
                {
                    throw;
                }
                result = false;
            }

            return result;
        }

        public static bool SerializeObject(object instance, XmlTextWriter writer, bool throwExceptions)
        {
            bool result = true;

            try
            {
                XmlSerializer serializer = new XmlSerializer(instance.GetType());
                writer.Formatting = Formatting.Indented;
                writer.IndentChar = ' ';
                writer.Indentation = 4;

                serializer.Serialize(writer, instance);
            }
            catch (Exception exception)
            {
                Debug.Write("SerializeObject exception: " + exception.GetBaseException().Message + "\r\n" + (exception.InnerException != null ? exception.InnerException.Message : ""), "West Wind");

                if (throwExceptions == true)
                {
                    throw;
                }

                result = false;
            }

            return result;
        }

        public static bool SerializeObject(object instance, out string xmlResultString)
        {
            return SerializeObject(instance, out xmlResultString, false);
        }

        public static bool SerializeObject(object instance, out string xmlResultString, bool throwExceptions)
        {
            xmlResultString = string.Empty;
            using (MemoryStream ms = new MemoryStream())
            using (XmlTextWriter writer = new XmlTextWriter(ms, new UTF8Encoding()))
            {
                if (SerializeObject(instance, writer, throwExceptions) == false)
                {
                    return false;
                }

                xmlResultString = Encoding.UTF8.GetString(ms.ToArray(), 0, (int)ms.Length);
            }

            return true;
        }

        public static string? SerializeObjectToString(object instance, bool throwExceptions = false)
        {
            string? result = null;
            if (SerializeObject(instance, out result, throwExceptions) == false)
            {
                return null;
            }

            return result;
        }

        public static object? DeSerializeObject(string fileName, Type objectType, bool throwExceptions)
        {
            object? instance = null;
            try
            {
                XmlSerializer serializer = new XmlSerializer(objectType);
                using (FileStream fs = new FileStream(fileName, FileMode.Open))
                using (XmlReader reader = new XmlTextReader(fs))
                {
                    instance = serializer.Deserialize(reader);
                }
            }
            catch (Exception exception)
            {
                Debug.Write("DeSerializeObject exception: " + exception.GetBaseException().Message + "\r\n" + (exception.InnerException != null ? exception.InnerException.Message : ""), "West Wind");

                if (throwExceptions == true)
                {
                    throw;
                }

                return null;
            }

            return instance;
        }

        public static object? DeSerializeObject(string xml, Type objectType)
        {
            XmlTextReader reader = new XmlTextReader(xml, XmlNodeType.Document, null);
            return DeSerializeObject(reader, objectType);
        }

        public static object? DeSerializeObject(XmlReader reader, Type objectType)
        {
            XmlSerializer serializer = new XmlSerializer(objectType);
            object? result = serializer.Deserialize(reader);
            reader.Close();

            return result;
        }

        public static string? ObjectToString(object instance, string separator, ObjectToStringTypes type)
        {
            string? result = null;
            FieldInfo[] fi = instance.GetType().GetFields();
            if (type == ObjectToStringTypes.Properties || type == ObjectToStringTypes.PropertiesAndFields)
            {
                foreach (PropertyInfo property in instance.GetType().GetProperties())
                {
                    object? value = property.GetValue(instance, null);
                    result += property.Name + ":" + (value == null ? "" : value).ToString() + separator;
                }
            }

            if (type == ObjectToStringTypes.Fields || type == ObjectToStringTypes.PropertiesAndFields)
            {
                foreach (FieldInfo field in fi)
                {
                    object? value = field.GetValue(instance);
                    result = result + field.Name + ": " + (value == null ? "" : value).ToString() + separator;
                }
            }
            return result;
        }
    }

    public enum ObjectToStringTypes
    {
        Properties,
        PropertiesAndFields,
        Fields
    }
}





