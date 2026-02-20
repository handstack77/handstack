using System;
using System.Collections.Generic;
using System.Globalization;

using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Linq;

namespace HandStack.Web.MessageContract.DataObject
{
    public class UIContractObject
    {
        public UIContractObject()
        {
            ProgramID = "";
            BusinessID = "";
            SystemID = "";
            TransactionID = "";
            Use = "";
            ModifiedDate = "";
            Comment = "";
            DataSource = new Dictionary<string, JToken>();
            Transactions = new List<Transaction>();
        }

        [JsonProperty("ProgramID")]
        public string ProgramID { get; set; }

        [JsonProperty("BusinessID")]
        public string BusinessID { get; set; }

        [JsonProperty("SystemID")]
        public string SystemID { get; set; }

        [JsonProperty("TransactionID")]
        public string TransactionID { get; set; }

        [JsonProperty("Use")]
        public string Use { get; set; }

        [JsonProperty("ModifiedDate")]
        public string ModifiedDate { get; set; }

        [JsonProperty("Comment")]
        public string Comment { get; set; }

        [JsonProperty("DataSource")]
        public Dictionary<string, JToken> DataSource { get; set; }

        [JsonProperty("Transactions")]
        public List<Transaction> Transactions { get; set; }

        public static UIContractObject? FromJson(string json)
        {
            UIContractObject? result = null;
            if (string.IsNullOrEmpty(json))
            {
                throw new Exception($"json 내용 확인 필요: {json}");
            }
            else
            {
                result = JsonConvert.DeserializeObject<UIContractObject>(json, UIContractObjectConverter.Settings);
            }

            return result;
        }
    }

    public class Transaction
    {
        public Transaction()
        {
            FunctionID = "";
            Comment = "";
            Inputs = new List<UITransactionInput>();
            Outputs = new List<UITransactionOutput>();
        }

        [JsonProperty("FunctionID")]
        public string FunctionID { get; set; }

        [JsonProperty("Comment")]
        public string Comment { get; set; }

        [JsonProperty("Inputs")]
        public List<UITransactionInput> Inputs { get; set; }

        [JsonProperty("Outputs")]
        public List<UITransactionOutput> Outputs { get; set; }
    }

    public class UITransactionInput
    {
        public UITransactionInput()
        {
            RequestType = "";
            DataFieldID = "";
            Items = new Dictionary<string, FieldItem>();
        }

        [JsonProperty("RequestType")]
        public string RequestType { get; set; }

        [JsonProperty("DataFieldID")]
        public string DataFieldID { get; set; }

        [JsonProperty("Items")]
        public Dictionary<string, FieldItem> Items { get; set; }
    }

    public class FieldItem
    {
        public FieldItem()
        {
            FieldID = "";
            DataType = "";
        }

        [JsonProperty("FieldID")]
        public string FieldID { get; set; }

        [JsonProperty("DataType")]
        public string DataType { get; set; }
    }

    public class UITransactionOutput
    {
        public UITransactionOutput()
        {
            ResponseType = "";
            DataFieldID = "";
            Items = new Dictionary<string, FieldItem>();
        }

        [JsonProperty("ResponseType")]
        public string ResponseType { get; set; }

        [JsonProperty("DataFieldID")]
        public string DataFieldID { get; set; }

        [JsonProperty("Items")]
        public Dictionary<string, FieldItem> Items { get; set; }
    }

    public static class UIContractObjectConverterSerialize
    {
        public static string ToJson(this UIContractObject self)
        {
            return JsonConvert.SerializeObject(self, Formatting.Indented, UIContractObjectConverter.Settings);
        }
    }

    internal static class UIContractObjectConverter
    {
        public static readonly JsonSerializerSettings Settings = new JsonSerializerSettings
        {
            MetadataPropertyHandling = MetadataPropertyHandling.Ignore,
            DateParseHandling = DateParseHandling.None,
            Converters =
            {
                new IsoDateTimeConverter { DateTimeStyles = DateTimeStyles.AssumeUniversal }
            },
        };
    }
}

