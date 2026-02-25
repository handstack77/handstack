using System;
using System.Collections.Generic;

using HandStack.Web.MessageContract.Converter;

using Newtonsoft.Json;

namespace HandStack.Web.MessageContract.DataObject
{
    public partial class FunctionScriptContract
    {
        [JsonProperty("Header")]
        public FunctionHeader Header { get; set; }

        [JsonProperty("Commands")]
        public List<FunctionCommand> Commands { get; set; }

        public static FunctionScriptContract? FromJson(string json)
        {
            FunctionScriptContract? result = null;
            if (string.IsNullOrWhiteSpace(json))
            {
                throw new Exception($"json 내용 확인 필요: {json}");
            }
            else
            {
                result = JsonConvert.DeserializeObject<FunctionScriptContract>(json, ConverterSetting.Settings);
            }

            return result;
        }

        public FunctionScriptContract()
        {
            Header = new FunctionHeader();
            Commands = new List<FunctionCommand>();
        }
    }

    public partial class FunctionCommand
    {
        [JsonProperty("ID")]
        public string ID { get; set; }

        [JsonProperty("Seq")]
        public int Seq { get; set; }

        [JsonProperty("Use")]
        public bool Use { get; set; }

        [JsonProperty("Timeout")]
        public int Timeout { get; set; }

        [JsonProperty]
        public string? EntryType { get; set; }

        [JsonProperty]
        public string? EntryMethod { get; set; }

        [JsonProperty]
        public string BeforeTransaction { get; set; }

        [JsonProperty]
        public string AfterTransaction { get; set; }

        [JsonProperty]
        public string FallbackTransaction { get; set; }

        [JsonProperty("Comment")]
        public string Comment { get; set; }

        [JsonProperty("ModifiedAt")]
        public DateTimeOffset ModifiedAt { get; set; }

        [JsonProperty("Params")]
        public List<FunctionParam> Params { get; set; }

        public FunctionCommand()
        {
            ID = "";
            Seq = 0;
            Use = false;
            Timeout = 0;
            BeforeTransaction = "";
            AfterTransaction = "";
            FallbackTransaction = "";
            Comment = "";
            ModifiedAt = DateTimeOffset.Now;
            Params = new List<FunctionParam>();
        }
    }

    public partial class FunctionParam
    {
        [JsonProperty("id")]
        public string ID { get; set; }

        [JsonProperty("type")]
        public string Type { get; set; }

        [JsonProperty("length")]
        public int Length { get; set; }

        [JsonProperty("value")]
        public string? Value { get; set; }

        public FunctionParam()
        {
            ID = "";
            Type = "String";
            Length = -1;
            Value = null;
        }
    }

    public partial class FunctionHeader
    {
        [JsonProperty("ApplicationID")]
        public string ApplicationID { get; set; }

        [JsonProperty("ProjectID")]
        public string ProjectID { get; set; }

        [JsonProperty("TransactionID")]
        public string TransactionID { get; set; }

        [JsonProperty("ReferenceModuleID")]
        public string ReferenceModuleID { get; set; }

        [JsonProperty("IsHttpContext")]
        public bool IsHttpContext { get; set; }

        [JsonProperty("Use")]
        public bool Use { get; set; }

        [JsonProperty("DataSourceID")]
        public string DataSourceID { get; set; }

        [JsonProperty("LanguageType")]
        public string LanguageType { get; set; }

        [JsonProperty("Comment")]
        public string Comment { get; set; }

        [JsonProperty("Configuration")]
        public Dictionary<string, object>? Configuration { get; set; }

        public FunctionHeader()
        {
            ApplicationID = "";
            ProjectID = "";
            TransactionID = "";
            ReferenceModuleID = "";
            IsHttpContext = false;
            Use = false;
            DataSourceID = "";
            LanguageType = "";
            Comment = "";
        }
    }

    public static class FunctionScriptContractSerialize
    {
        public static string ToJson(this FunctionScriptContract self) => JsonConvert.SerializeObject(self, ConverterSetting.Settings);
    }
}

