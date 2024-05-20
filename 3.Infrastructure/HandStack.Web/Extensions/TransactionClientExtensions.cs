using System.Collections.Generic;
using System.Data;

using HandStack.Web.Entity;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace HandStack.Web.Extensions
{
    public static class TransactionClientExtensions
    {
        public static void Add(this IList<ServiceParameter> parameters, string parameterName, object? value)
        {
            parameters.Add(new ServiceParameter() { prop = parameterName, val = value });
        }

        public static DataSet? ToDataSet(this Dictionary<string, JToken>? transactionResult)
        {
            DataSet? result = null;
            if (transactionResult != null && transactionResult.Count > 0)
            {
                result = new DataSet();
                foreach (var dataItem in transactionResult)
                {
                    DataTable? dataTable = null;
                    var jToken = dataItem.Value;

                    if (jToken is JObject)
                    {
                        dataTable = JsonConvert.DeserializeObject<DataTable>($"[{jToken}]");
                    }
                    else if (jToken is JArray)
                    {
                        dataTable = JsonConvert.DeserializeObject<DataTable>($"{jToken}");
                    }

                    if (dataTable != null)
                    {
                        dataTable.TableName = dataItem.Key;
                        result.Tables.Add(dataTable);
                    }
                }
            }

            return result;
        }
    }
}
