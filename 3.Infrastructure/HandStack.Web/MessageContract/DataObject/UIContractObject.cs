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
            DataSource = [];
            Transactions = [];
        }

        [JsonProperty(nameof(ProgramID))]
        public string ProgramID { get; set; }

        [JsonProperty(nameof(BusinessID))]
        public string BusinessID { get; set; }

        [JsonProperty(nameof(SystemID))]
        public string SystemID { get; set; }

        [JsonProperty(nameof(TransactionID))]
        public string TransactionID { get; set; }

        [JsonProperty(nameof(Use))]
        public string Use { get; set; }

        [JsonProperty(nameof(ModifiedDate))]
        public string ModifiedDate { get; set; }

        [JsonProperty(nameof(Comment))]
        public string Comment { get; set; }

        [JsonProperty(nameof(DataSource))]
        public Dictionary<string, JToken> DataSource { get; set; }

        [JsonProperty(nameof(Transactions))]
        public List<Transaction> Transactions { get; set; }

        public static UIContractObject? FromJson(string json)
        {
            UIContractObject? result;
            if (string.IsNullOrWhiteSpace(json))
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
            Inputs = [];
            Outputs = [];
        }

        [JsonProperty(nameof(FunctionID))]
        public string FunctionID { get; set; }

        [JsonProperty(nameof(Comment))]
        public string Comment { get; set; }

        [JsonProperty(nameof(Inputs))]
        public List<UITransactionInput> Inputs { get; set; }

        [JsonProperty(nameof(Outputs))]
        public List<UITransactionOutput> Outputs { get; set; }
    }

    public class UITransactionInput
    {
        public UITransactionInput()
        {
            RequestType = "";
            DataFieldID = "";
            Items = [];
        }

        [JsonProperty(nameof(RequestType))]
        public string RequestType { get; set; }

        [JsonProperty(nameof(DataFieldID))]
        public string DataFieldID { get; set; }

        [JsonProperty(nameof(Items))]
        public Dictionary<string, FieldItem> Items { get; set; }
    }

    public class FieldItem
    {
        public FieldItem()
        {
            FieldID = "";
            DataType = "";
        }

        [JsonProperty(nameof(FieldID))]
        public string FieldID { get; set; }

        [JsonProperty(nameof(DataType))]
        public string DataType { get; set; }
    }

    public class UITransactionOutput
    {
        public UITransactionOutput()
        {
            ResponseType = "";
            DataFieldID = "";
            Items = [];
        }

        [JsonProperty(nameof(ResponseType))]
        public string ResponseType { get; set; }

        [JsonProperty(nameof(DataFieldID))]
        public string DataFieldID { get; set; }

        [JsonProperty(nameof(Items))]
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
        public static readonly JsonSerializerSettings Settings = new()
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

