using System;
using System.Collections.Generic;

using HandStack.Web.MessageContract.Contract;
using HandStack.Web.MessageContract.Converter;

using Newtonsoft.Json;

namespace HandStack.Web.MessageContract.DataObject
{
    public class BusinessContract
    {
        [JsonProperty(nameof(ApplicationID))]
        public string ApplicationID { get; set; }

        [JsonProperty(nameof(ProjectID))]
        public string ProjectID { get; set; }

        [JsonProperty(nameof(TransactionApplicationID))]
        public string? TransactionApplicationID { get; set; }

        [JsonProperty(nameof(TransactionProjectID))]
        public string TransactionProjectID { get; set; }

        [JsonProperty(nameof(TransactionID))]
        public string TransactionID { get; set; }

        [JsonProperty(nameof(Comment))]
        public string Comment { get; set; }

        [JsonProperty(nameof(ModifiedDate))]
        public string ModifiedDate { get; set; }

        [JsonProperty(nameof(Services))]
        public List<TransactionInfo> Services { get; set; }

        [JsonProperty(nameof(Models))]
        public List<Model> Models { get; set; }

        public static BusinessContract? FromJson(string json)
        {
            BusinessContract? result;
            if (string.IsNullOrWhiteSpace(json))
            {
                throw new Exception($"json 내용 확인 필요: {json}");
            }
            else
            {
                result = JsonConvert.DeserializeObject<BusinessContract>(json, ConverterSetting.Settings);
                result?.NormalizeWorkflowSteps();
            }

            return result;
        }

        private void NormalizeWorkflowSteps()
        {
            Services ??= [];
            foreach (var service in Services)
            {
                service.WorkflowSteps ??= [];
                foreach (var step in service.WorkflowSteps)
                {
                    step.ServiceOutputs ??= [];
                    step.InputMappings ??= [];
                    step.OutputMappings ??= [];
                    step.Assertions ??= [];
                    foreach (var assertion in step.Assertions)
                    {
                        assertion.Expected ??= new WorkflowAssertionValue();
                        assertion.Actual ??= new WorkflowAssertionValue();
                        assertion.Value ??= new WorkflowAssertionValue();
                        assertion.Min ??= new WorkflowAssertionValue();
                        assertion.Max ??= new WorkflowAssertionValue();
                        assertion.Collection ??= new WorkflowAssertionValue();
                    }
                }
            }
        }

        public BusinessContract()
        {
            ApplicationID = "";
            ProjectID = "";
            TransactionProjectID = "";
            TransactionID = "";
            Comment = "";
            ModifiedDate = "";
            Services = [];
            Models = [];
        }
    }

    public class Model
    {
        [JsonProperty(nameof(Name))]
        public string Name { get; set; }

        [JsonProperty(nameof(Owner))]
        public string Owner { get; set; }

        [JsonProperty(nameof(Comment))]
        public string Comment { get; set; }

        [JsonProperty(nameof(ModifiedDate))]
        public DateTimeOffset? ModifiedDate { get; set; }

        [JsonProperty(nameof(Columns))]
        public List<DatabaseColumn> Columns { get; set; }

        public Model()
        {
            Name = "";
            Owner = "";
            Comment = "";
            ModifiedDate = null;
            Columns = [];
        }
    }

    public class DatabaseColumn
    {
        [JsonProperty(nameof(Name))]
        public string Name { get; set; }

        [JsonProperty(nameof(Comment))]
        public string Comment { get; set; }

        [JsonProperty(nameof(DataType))]
        public string DataType { get; set; }

        [JsonProperty(nameof(Length))]
        public int Length { get; set; }

        [JsonProperty(nameof(Require))]
        public bool Require { get; set; }

        [JsonProperty(nameof(Default))]
        public string Default { get; set; }

        public DatabaseColumn()
        {
            Name = "";
            Comment = "";
            DataType = "";
            Length = 0;
            Require = false;
            Default = "";
        }
    }

    public class TransactionInfo
    {
        [JsonProperty(nameof(ServiceID))]
        public string ServiceID { get; set; }

        [JsonProperty(nameof(Authorize))]
        public bool Authorize { get; set; }

        [JsonProperty(nameof(Roles), NullValueHandling = NullValueHandling.Ignore)]
        public List<string>? Roles { get; set; }

        [JsonProperty(nameof(Policys), NullValueHandling = NullValueHandling.Ignore)]
        public Dictionary<string, List<string>>? Policys { get; set; }

        [JsonProperty(nameof(TransactionTokens), NullValueHandling = NullValueHandling.Ignore)]
        public List<string>? TransactionTokens { get; set; }

        [JsonProperty(nameof(AuthorizeMethod), NullValueHandling = NullValueHandling.Ignore)]
        public List<string>? AuthorizeMethod { get; set; } // Empty(All), Role, Policy, TransactionToken, TransactionTokenOnly

        [JsonProperty(nameof(CommandType))]
        public string CommandType { get; set; }

        [JsonProperty(nameof(TransactionScope))]
        public bool TransactionScope { get; set; }

        [JsonProperty("SequentialOption")]
        public List<SequentialOption> SequentialOptions { get; set; }

        [JsonProperty(nameof(ReturnType))]
        public string ReturnType { get; set; }

        [JsonProperty(nameof(AccessScreenID))]
        public List<string> AccessScreenID { get; set; }

        [JsonProperty(nameof(RoutingCommandUri))]
        public string RoutingCommandUri { get; set; }

        [JsonProperty(nameof(Comment))]
        public string Comment { get; set; }

        [JsonProperty(nameof(TransactionLog))]
        public bool TransactionLog { get; set; }

        [JsonProperty(nameof(Inputs))]
        public List<ModelInputContract> Inputs { get; set; }

        [JsonProperty(nameof(Outputs))]
        public List<ModelOutputContract> Outputs { get; set; }

        [JsonProperty(nameof(WorkflowSteps), NullValueHandling = NullValueHandling.Ignore)]
        public List<WorkflowStep> WorkflowSteps { get; set; }

        public TransactionInfo()
        {
            ServiceID = "";
            Authorize = false;
            CommandType = "";
            TransactionScope = false;
            SequentialOptions = [];
            ReturnType = "";
            AccessScreenID = [];
            RoutingCommandUri = "";
            Comment = "";
            TransactionLog = false;
            Inputs = [];
            Outputs = [];
            WorkflowSteps = [];
        }

        public bool ShouldSerializeWorkflowSteps()
        {
            return WorkflowSteps != null && WorkflowSteps.Count > 0;
        }
    }

    public class WorkflowStep
    {
        [JsonProperty(nameof(StepID))]
        public string StepID { get; set; }

        [JsonProperty(nameof(ApplicationID))]
        public string ApplicationID { get; set; }

        [JsonProperty(nameof(TransactionProjectID))]
        public string TransactionProjectID { get; set; }

        [JsonProperty(nameof(TransactionID))]
        public string TransactionID { get; set; }

        [JsonProperty(nameof(ServiceID))]
        public string ServiceID { get; set; }

        [JsonProperty(nameof(CommandType))]
        public string CommandType { get; set; }

        [JsonProperty(nameof(ReturnType))]
        public string ReturnType { get; set; }

        [JsonProperty(nameof(TransactionScope))]
        public bool? TransactionScope { get; set; }

        [JsonProperty(nameof(IncludeResult))]
        public bool IncludeResult { get; set; }

        [JsonProperty(nameof(ServiceOutputs))]
        public List<ModelOutputContract> ServiceOutputs { get; set; }

        [JsonProperty(nameof(InputMappings))]
        public List<WorkflowFieldMapping> InputMappings { get; set; }

        [JsonProperty(nameof(OutputMappings))]
        public List<WorkflowFieldMapping> OutputMappings { get; set; }

        [JsonProperty(nameof(Assertions))]
        public List<WorkflowAssertion> Assertions { get; set; }

        public WorkflowStep()
        {
            StepID = "";
            ApplicationID = "";
            TransactionProjectID = "";
            TransactionID = "";
            ServiceID = "";
            CommandType = "";
            ReturnType = "";
            TransactionScope = null;
            IncludeResult = true;
            ServiceOutputs = [];
            InputMappings = [];
            OutputMappings = [];
            Assertions = [];
        }
    }

    public class WorkflowAssertion
    {
        [JsonProperty(nameof(Assert))]
        public string Assert { get; set; }

        [JsonProperty(nameof(Expected))]
        public WorkflowAssertionValue Expected { get; set; }

        [JsonProperty(nameof(Actual))]
        public WorkflowAssertionValue Actual { get; set; }

        [JsonProperty(nameof(Value))]
        public WorkflowAssertionValue Value { get; set; }

        [JsonProperty(nameof(Min))]
        public WorkflowAssertionValue Min { get; set; }

        [JsonProperty(nameof(Max))]
        public WorkflowAssertionValue Max { get; set; }

        [JsonProperty(nameof(Collection))]
        public WorkflowAssertionValue Collection { get; set; }

        [JsonProperty(nameof(TypeName))]
        public string TypeName { get; set; }

        [JsonProperty(nameof(ExceptionType))]
        public string ExceptionType { get; set; }

        [JsonProperty(nameof(Message))]
        public string Message { get; set; }

        public WorkflowAssertion()
        {
            Assert = "";
            Expected = new WorkflowAssertionValue();
            Actual = new WorkflowAssertionValue();
            Value = new WorkflowAssertionValue();
            Min = new WorkflowAssertionValue();
            Max = new WorkflowAssertionValue();
            Collection = new WorkflowAssertionValue();
            TypeName = "";
            ExceptionType = "";
            Message = "";
        }
    }

    public class WorkflowAssertionValue
    {
        [JsonProperty(nameof(Source))]
        public string Source { get; set; }

        [JsonProperty(nameof(SourceStepID))]
        public string SourceStepID { get; set; }

        [JsonProperty(nameof(FieldID))]
        public string FieldID { get; set; }

        [JsonProperty(nameof(Value))]
        public object? Value { get; set; }

        public WorkflowAssertionValue()
        {
            Source = "Literal";
            SourceStepID = "";
            FieldID = "";
            Value = null;
        }
    }

    public class WorkflowFieldMapping
    {
        [JsonProperty(nameof(SourceStepID))]
        public string SourceStepID { get; set; }

        [JsonProperty(nameof(SourceFieldID))]
        public string SourceFieldID { get; set; }

        [JsonProperty(nameof(TargetFieldID))]
        public string TargetFieldID { get; set; }

        [JsonProperty(nameof(TargetInputIndex))]
        public int TargetInputIndex { get; set; }

        [JsonProperty(nameof(DbType))]
        public string DbType { get; set; }

        [JsonProperty(nameof(Length))]
        public int Length { get; set; }

        [JsonProperty(nameof(DefaultValue))]
        public object? DefaultValue { get; set; }

        [JsonProperty(nameof(Required))]
        public bool Required { get; set; }

        public WorkflowFieldMapping()
        {
            SourceStepID = "";
            SourceFieldID = "";
            TargetFieldID = "";
            TargetInputIndex = 0;
            DbType = "String";
            Length = -1;
            DefaultValue = null;
            Required = false;
        }
    }

    public partial class SequentialOption
    {
        [JsonProperty(nameof(TransactionProjectID))]
        public string TransactionProjectID { get; set; }

        [JsonProperty(nameof(TransactionID))]
        public string TransactionID { get; set; }

        [JsonProperty(nameof(ServiceID))]
        public string ServiceID { get; set; }

        [JsonProperty(nameof(CommandType))]
        public string CommandType { get; set; }

        [JsonProperty(nameof(ServiceInputFields))]
        public List<int> ServiceInputFields { get; set; }

        [JsonProperty(nameof(ServiceOutputs))]
        public List<ModelOutputContract> ServiceOutputs { get; set; }

        [JsonProperty(nameof(ResultHandling))]
        public string ResultHandling { get; set; }

        [JsonProperty(nameof(TargetInputFields))]
        public List<int> TargetInputFields { get; set; }

        [JsonProperty(nameof(ResultOutputFields))]
        public List<int> ResultOutputFields { get; set; }

        public SequentialOption()
        {
            TransactionProjectID = "";
            TransactionID = "";
            ServiceID = "";
            CommandType = "";
            ServiceInputFields = [];
            ServiceOutputs = [];
            ResultHandling = "";
            TargetInputFields = [];
            ResultOutputFields = [];
        }
    }

    public class BaseFieldMapping
    {
        [JsonProperty(nameof(BaseSequence))]
        public string BaseSequence { get; set; }

        [JsonProperty(nameof(SourceFieldID))]
        public string SourceFieldID { get; set; }

        [JsonProperty(nameof(TargetFieldID))]
        public string TargetFieldID { get; set; }

        public BaseFieldMapping()
        {
            BaseSequence = "";
            SourceFieldID = "";
            TargetFieldID = "";
        }
    }

    public class ModelInputContract
    {
        [JsonProperty(nameof(ModelID))]
        public string ModelID { get; set; }

        [JsonProperty(nameof(Fields))]
        public List<string> Fields { get; set; }

        [JsonProperty(nameof(BearerFields))]
        public List<string> BearerFields { get; set; }

        [JsonProperty(nameof(TestValues), NullValueHandling = NullValueHandling.Ignore)]
        public List<TestValue> TestValues { get; set; }

        [JsonProperty(nameof(DefaultValues), NullValueHandling = NullValueHandling.Ignore)]
        public List<DefaultValue> DefaultValues { get; set; }

        [JsonProperty(nameof(Type))]
        public string Type { get; set; }

        [JsonProperty(nameof(BaseFieldMappings), NullValueHandling = NullValueHandling.Ignore)]
        public List<BaseFieldMapping> BaseFieldMappings { get; set; }

        [JsonProperty(nameof(ParameterHandling))]
        public string ParameterHandling { get; set; } // Rejected, ByPassing, DefaultValue

        [JsonProperty(nameof(IgnoreResult))]
        public bool IgnoreResult { get; set; }

        public ModelInputContract()
        {
            ModelID = "";
            Fields = [];
            BearerFields = [];
            TestValues = [];
            DefaultValues = [];
            Type = "";
            BaseFieldMappings = [];
            ParameterHandling = "";
            IgnoreResult = false;
        }
    }

    public partial class BaseFieldRelation
    {
        [JsonProperty(nameof(RelationFieldID))]
        public string RelationFieldID { get; set; }

        [JsonProperty(nameof(BaseSequence))]
        public int BaseSequence { get; set; }

        [JsonProperty(nameof(RelationMappings))]
        public List<RelationMapping> RelationMappings { get; set; }

        [JsonProperty(nameof(ColumnNames), NullValueHandling = NullValueHandling.Ignore)]
        public List<string> ColumnNames { get; set; }

        [JsonProperty(nameof(DisposeResult), NullValueHandling = NullValueHandling.Ignore)]
        public bool DisposeResult { get; set; }

        public BaseFieldRelation()
        {
            RelationFieldID = "";
            BaseSequence = 0;
            RelationMappings = [];
            ColumnNames = [];
            DisposeResult = false;
        }
    }

    public partial class RelationMapping
    {
        [JsonProperty(nameof(BaseFieldID))]
        public string BaseFieldID { get; set; }

        [JsonProperty(nameof(ChildrenFieldID))]
        public string ChildrenFieldID { get; set; }

        public RelationMapping()
        {
            BaseFieldID = "";
            ChildrenFieldID = "";
        }
    }

    public class ModelOutputContract
    {
        [JsonProperty(nameof(ModelID))]
        public string ModelID { get; set; }

        [JsonProperty(nameof(Fields))]
        public List<string> Fields { get; set; }

        [JsonProperty(nameof(Type))]
        public string Type { get; set; }

        [JsonProperty(nameof(Maskings))]
        public List<Masking> Maskings { get; set; }

        [JsonProperty(nameof(BaseFieldRelation), NullValueHandling = NullValueHandling.Ignore)]
        public BaseFieldRelation? BaseFieldRelation { get; set; }

        [JsonProperty(nameof(ValidateRules))]
        public List<string>? ValidateRules { get; set; }

        [JsonProperty(nameof(FallbackTransaction))]
        public string? FallbackTransaction { get; set; }

        public ModelOutputContract()
        {
            ModelID = "";
            Fields = [];
            Type = "";
            Maskings = [];
            BaseFieldRelation = null;
            ValidateRules = null;
            FallbackTransaction = null;
        }
    }

    public struct TestValue
    {
        public int? Integer;
        public string? String;
        public bool? Boolean;

        public static implicit operator TestValue(int Integer) => new() { Integer = Integer };
        public static implicit operator TestValue(string String) => new() { String = String };
        public static implicit operator TestValue(bool Boolean) => new() { Boolean = Boolean };
        public bool IsNull => Integer == null && String == null && Boolean == null;
    }

    public struct DefaultValue
    {
        public int? Integer;
        public string? String;
        public bool? Boolean;

        public static implicit operator DefaultValue(int Integer) => new() { Integer = Integer };
        public static implicit operator DefaultValue(string String) => new() { String = String };
        public static implicit operator DefaultValue(bool Boolean) => new() { Boolean = Boolean };
        public bool IsNull => Integer == null && String == null && Boolean == null;
    }

    public static class BusinessContractSerialize
    {
        public static string ToJson(this BusinessContract self)
        {
            return JsonConvert.SerializeObject(self, Formatting.Indented, ConverterSetting.Settings);
        }
    }
}

