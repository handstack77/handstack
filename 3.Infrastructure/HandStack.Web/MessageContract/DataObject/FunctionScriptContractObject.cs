using System;
using System.Collections.Generic;

using HandStack.Web.MessageContract.Converter;

using Newtonsoft.Json;

namespace HandStack.Web.MessageContract.DataObject
{
    public partial class FunctionScriptContract
    {
        [JsonProperty(nameof(Header))]
        public FunctionHeader Header { get; set; }

        [JsonProperty(nameof(Commands))]
        public List<FunctionCommand> Commands { get; set; }

        public static FunctionScriptContract? FromJson(string json)
        {
            FunctionScriptContract? result;
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
            Commands = [];
        }
    }

    public partial class FunctionCommand
    {
        [JsonProperty(nameof(ID))]
        public string ID { get; set; }

        [JsonProperty(nameof(Seq))]
        public int Seq { get; set; }

        [JsonProperty(nameof(Use))]
        public bool Use { get; set; }

        [JsonProperty(nameof(Timeout))]
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

        [JsonProperty(nameof(Description))]
        public string Description { get; set; }

        [JsonProperty(nameof(ModifiedAt))]
        public DateTimeOffset ModifiedAt { get; set; }

        [JsonProperty(nameof(Params))]
        public List<FunctionParam> Params { get; set; }

        [JsonProperty(nameof(OutputMetas))]
        public List<string> OutputMetas { get; set; }

        public FunctionCommand()
        {
            ID = "";
            Seq = 0;
            Use = false;
            Timeout = 0;
            BeforeTransaction = "";
            AfterTransaction = "";
            FallbackTransaction = "";
            Description = "";
            ModifiedAt = DateTimeOffset.Now;
            Params = [];
            OutputMetas = [];
        }
    }

    [JsonConverter(typeof(FunctionParamConverter))]
    public partial class FunctionParam
    {
        public string ID { get; set; }
        public string Type { get; set; }
        public int Length { get; set; }
        public bool IsRequired { get; set; }
        public string? Value { get; set; }

        public FunctionParam()
        {
            ID = "";
            Type = "String";
            Length = -1;
            IsRequired = false;
            Value = null;
        }
    }

    public partial class FunctionHeader
    {
        [JsonProperty(nameof(ApplicationID))]
        public string ApplicationID { get; set; }

        [JsonProperty(nameof(ProjectID))]
        public string ProjectID { get; set; }

        [JsonProperty(nameof(TransactionID))]
        public string TransactionID { get; set; }

        [JsonProperty(nameof(ReferenceModuleID))]
        public string ReferenceModuleID { get; set; }

        [JsonProperty(nameof(IsHttpContext))]
        public bool IsHttpContext { get; set; }

        [JsonProperty(nameof(Use))]
        public bool Use { get; set; }

        [JsonProperty(nameof(DataSourceID))]
        public string DataSourceID { get; set; }

        [JsonProperty(nameof(LanguageType))]
        public string LanguageType { get; set; }

        [JsonProperty(nameof(Comment))]
        public string Comment { get; set; }

        [JsonProperty(nameof(Configuration))]
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
        public static string ToJson(this FunctionScriptContract self)            => JsonConvert.SerializeObject(self, ConverterSetting.Settings);
    }
}
