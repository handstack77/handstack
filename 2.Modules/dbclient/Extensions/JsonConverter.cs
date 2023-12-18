using System;
using System.Data;
using System.Globalization;
using System.IO;
using System.Text;
using System.Xml;

using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

using Serilog;

namespace dbclient.Extensions
{
    public sealed class JsonConverter
    {
        public static string Serialize(object serializeObject)
        {
            return Serialize(serializeObject, true);
        }

        public static string Serialize(object serializeObject, bool isStringNullValueEmpty)
        {
            string jsonString = "{}";
            try
            {
                JsonSerializer jsonSerializer = JsonSerializer.Create(null);

                if (isStringNullValueEmpty == true)
                {
                    jsonSerializer.Converters.Add(new DataTableConverter());
                    jsonSerializer.Converters.Add(new DataSetConverter());
                }
                jsonSerializer.Converters.Add(new IsoDateTimeConverter());

                jsonSerializer.NullValueHandling = NullValueHandling.Include;
                jsonSerializer.ObjectCreationHandling = ObjectCreationHandling.Replace;
                jsonSerializer.MissingMemberHandling = MissingMemberHandling.Ignore;
                jsonSerializer.ReferenceLoopHandling = ReferenceLoopHandling.Ignore;

                StringBuilder stringBuilder = new StringBuilder(1024);
                StringWriter stringWriter = new StringWriter(stringBuilder, CultureInfo.InvariantCulture);
                using (JsonTextWriter jsonTextWriter = new JsonTextWriter(stringWriter))
                {
                    jsonTextWriter.Formatting = Newtonsoft.Json.Formatting.None;
                    jsonSerializer.Serialize(jsonTextWriter, serializeObject);
                }
                jsonString = stringWriter.ToString();
            }
            catch (Exception exception)
            {
                Log.Logger.Error(exception, "[{LogCategory}] Json Serialize 오류", "JsonConverter/Serialize");
            }

            return jsonString;
        }

        public static string Serialize<T>(T serializeObject)
        {
            return Serialize(serializeObject, true);
        }

        public static string Serialize<T>(T serializeObject, bool isStringNullValueEmpty)
        {
            string jsonString = "{}";
            try
            {
                JsonSerializer jsonSerializer = JsonSerializer.Create(null);

                if (isStringNullValueEmpty == true)
                {
                    jsonSerializer.Converters.Add(new DataTableConverter());
                    jsonSerializer.Converters.Add(new DataSetConverter());
                }
                jsonSerializer.Converters.Add(new IsoDateTimeConverter());

                jsonSerializer.NullValueHandling = NullValueHandling.Include;
                jsonSerializer.ObjectCreationHandling = ObjectCreationHandling.Replace;
                jsonSerializer.MissingMemberHandling = MissingMemberHandling.Ignore;
                jsonSerializer.ReferenceLoopHandling = ReferenceLoopHandling.Ignore;

                StringBuilder stringBuilder = new StringBuilder(1024);
                StringWriter stringWriter = new StringWriter(stringBuilder, CultureInfo.InvariantCulture);
                using (JsonTextWriter jsonTextWriter = new JsonTextWriter(stringWriter))
                {
                    jsonTextWriter.Formatting = Newtonsoft.Json.Formatting.None;
                    jsonSerializer.Serialize(jsonTextWriter, serializeObject);
                }
                jsonString = stringWriter.ToString();
            }
            catch (Exception exception)
            {
                Log.Logger.Error(exception, "[{LogCategory}] Json Serialize 오류", "JsonConverter/Serialize<T>");
            }

            return jsonString;
        }

        public static T? Deserialize<T>(string jsonString) where T : class
        {
            try
            {
                return JsonConvert.DeserializeObject<T>(jsonString) as T;
            }
            catch (Exception exception)
            {
                Log.Logger.Error(exception, "[{LogCategory}] Json Serialize 오류", "JsonConverter/Deserialize<T>");
            }

            return default(T);
        }

        public static T? Deserialize<T>(string jsonString, T anonymousType)
        {
            try
            {
                return JsonConvert.DeserializeAnonymousType(jsonString, anonymousType);
            }
            catch (Exception exception)
            {
                Log.Logger.Error(exception, "[{LogCategory}] Json Serialize 오류", "JsonConverter/Deserialize<T>");
            }

            return default(T);
        }

        public static XmlDocument? Deserialize(string jsonString)
        {
            try
            {
                return JsonConvert.DeserializeXmlNode(jsonString);
            }
            catch (Exception exception)
            {
                Log.Logger.Error(exception, "[{LogCategory}] Json Serialize 오류", "JsonConverter/Deserialize<T>");
            }

            return null;
        }
    }

    public class DataTableConverter : Newtonsoft.Json.JsonConverter
    {
        public override void WriteJson(JsonWriter writer, object? value, JsonSerializer serializer)
        {
            using (DataTable? dataTable = value as DataTable)
            {
                if (dataTable != null)
                {
                    writer.WriteStartArray();
                    foreach (DataRow row in dataTable.Rows)
                    {
                        writer.WriteStartObject();
                        foreach (DataColumn column in row.Table.Columns)
                        {
                            if (serializer.NullValueHandling != NullValueHandling.Ignore || row[column] != null && row[column] != DBNull.Value)
                            {
                                writer.WritePropertyName(column.ColumnName);
                                serializer.Serialize(writer, (column.DataType == typeof(String) && row[column].GetType().Name == "DBNull") ? "" : row[column]);
                            }
                        }
                        writer.WriteEndObject();
                    }
                    writer.WriteEndArray();
                }
            }
        }

        public override bool CanConvert(Type valueType)
        {
            return valueType == typeof(DataTable);
        }

        public override object? ReadJson(JsonReader reader, Type objectType, object? existingValue, JsonSerializer serializer)
        {
            return null;
        }
    }

    public class DataSetConverter : Newtonsoft.Json.JsonConverter
    {
        public override void WriteJson(JsonWriter writer, object? value, JsonSerializer serializer)
        {
            using (DataSet? dataSet = value as DataSet)
            {
                if (dataSet != null)
                {
                    DataTableConverter dataTableConverter = new DataTableConverter();
                    writer.WriteStartObject();
                    foreach (DataTable table in dataSet.Tables)
                    {
                        writer.WritePropertyName((table.TableName));
                        dataTableConverter.WriteJson(writer, table, serializer);
                    }
                    writer.WriteEndObject();
                }
            }
        }

        public override bool CanConvert(Type valueType)
        {
            return valueType == typeof(DataSet);
        }

        public override object? ReadJson(JsonReader reader, Type objectType, object? existingValue, JsonSerializer serializer)
        {
            return null;
        }
    }
}
