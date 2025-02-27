using System.Collections.Generic;

using Newtonsoft.Json;

namespace HandStack.Web.Entity
{
    public partial record AppSettings
    {
        [JsonProperty("ApplicationNo")]
        public string ApplicationNo { get; set; } = string.Empty;

        [JsonProperty("ApplicationID")]
        public string ApplicationID { get; set; } = string.Empty;

        [JsonProperty("Version")]
        public string Version { get; set; } = string.Empty;

        [JsonProperty("UseForumYN")]
        public string UseForumYN { get; set; } = "N";

        [JsonProperty("ApplicationName")]
        public string ApplicationName { get; set; } = string.Empty;

        [JsonProperty("AppSecret")]
        public string AppSecret { get; set; } = string.Empty;

        [JsonProperty("SignInID")]
        public string SignInID { get; set; } = string.Empty;

        [JsonProperty("Comment")]
        public string Comment { get; set; } = string.Empty;

        [JsonProperty("CreatedMemberID")]
        public string CreatedMemberID { get; set; } = string.Empty;

        [JsonProperty("CreatedAt")]
        public string CreatedAt { get; set; } = string.Empty;

        [JsonProperty("ModifiedMemberID")]
        public string ModifiedMemberID { get; set; } = string.Empty;

        [JsonProperty("ModifiedAt")]
        public string ModifiedAt { get; set; } = string.Empty;

        [JsonProperty("AllowAnonymousPath", NullValueHandling = NullValueHandling.Ignore)]
        public List<string>? AllowAnonymousPath { get; set; } = new List<string>();

        [JsonProperty("WithOrigin", NullValueHandling = NullValueHandling.Ignore)]
        public List<string>? WithOrigin { get; set; } = new List<string>();

        [JsonProperty("WithReferer", NullValueHandling = NullValueHandling.Ignore)]
        public List<string>? WithReferer { get; set; } = new List<string>();

        [JsonProperty("DataSource", NullValueHandling = NullValueHandling.Ignore)]
        public List<DataSource>? DataSource { get; set; } = new List<DataSource>();

        [JsonProperty("Storage", NullValueHandling = NullValueHandling.Ignore)]
        public List<AppStorage>? Storage { get; set; } = new List<AppStorage>();

        [JsonProperty("Public", NullValueHandling = NullValueHandling.Ignore)]
        public List<AppPublic>? Public { get; set; } = new List<AppPublic>();

        [JsonProperty("Routing", NullValueHandling = NullValueHandling.Ignore)]
        public List<Routing>? Routing { get; set; } = new List<Routing>();

        [JsonProperty("Receive", NullValueHandling = NullValueHandling.Ignore)]
        public List<AppReceive>? Receive { get; set; } = new List<AppReceive>();

        [JsonProperty("Publish", NullValueHandling = NullValueHandling.Ignore)]
        public List<AppPublish>? Publish { get; set; } = new List<AppPublish>();
    }

    public partial record AppPublic
    {
        [JsonProperty("ProjectID")]
        public string ProjectID { get; set; } = string.Empty;

        [JsonProperty("TransactionID")]
        public string TransactionID { get; set; } = string.Empty;

        [JsonProperty("Comment")]
        public string Comment { get; set; } = string.Empty;
    }

    public partial record AppPublish
    {
        [JsonProperty("DeployID")]
        public string DeployID { get; set; } = string.Empty;

        [JsonProperty("Protocol")]
        public string Protocol { get; set; } = string.Empty;

        [JsonProperty("ProtocolName")]
        public string ProtocolName { get; set; } = string.Empty;

        [JsonProperty("Host")]
        public string Host { get; set; } = string.Empty;

        [JsonProperty("AccessID")]
        public string AccessID { get; set; } = string.Empty;

        [JsonProperty("ManagedKey")]
        public string ManagedKey { get; set; } = string.Empty;

        [JsonProperty("Comment")]
        public string Comment { get; set; } = string.Empty;
    }

    public partial record AppReceive
    {
        [JsonProperty("DomainID")]
        public string DomainID { get; set; } = string.Empty;

        [JsonProperty("Protocol")]
        public string Protocol { get; set; } = string.Empty;

        [JsonProperty("AccessID")]
        public string AccessID { get; set; } = string.Empty;

        [JsonProperty("Comment")]
        public object Comment { get; set; } = string.Empty;

        [JsonProperty("ProtocolName")]
        public string ProtocolName { get; set; } = string.Empty;
    }

    public partial record AppStorage
    {
        [JsonProperty("ApplicationID")]
        public string ApplicationID { get; set; } = string.Empty;

        [JsonProperty("AccessID")]
        public string AccessID { get; set; } = string.Empty;

        [JsonProperty("RepositoryID")]
        public string RepositoryID { get; set; } = string.Empty;

        [JsonProperty("RepositoryName")]
        public string RepositoryName { get; set; } = string.Empty;

        [JsonProperty("StorageType")]
        public string StorageType { get; set; } = string.Empty;

        [JsonProperty("PhysicalPath")]
        public string PhysicalPath { get; set; } = string.Empty;

        [JsonProperty("BlobContainerID")]
        public string BlobContainerID { get; set; } = string.Empty;

        [JsonProperty("BlobConnectionString")]
        public string BlobConnectionString { get; set; } = string.Empty;

        [JsonProperty("BlobItemUrl")]
        public string BlobItemUrl { get; set; } = string.Empty;

        [JsonProperty("IsVirtualPath")]
        public bool IsVirtualPath { get; set; } = false;

        [JsonProperty("AccessMethod")]
        public string AccessMethod { get; set; } = string.Empty;

        [JsonProperty("IsFileUploadDownloadOnly")]
        public bool IsFileUploadDownloadOnly { get; set; } = false;

        [JsonProperty("IsMultiUpload")]
        public bool IsMultiUpload { get; set; } = false;

        [JsonProperty("IsFileOverWrite")]
        public bool IsFileOverWrite { get; set; } = false;

        [JsonProperty("IsFileNameEncrypt")]
        public bool IsFileNameEncrypt { get; set; } = false;

        [JsonProperty("IsKeepFileExtension")]
        public bool IsKeepFileExtension { get; set; } = false;

        [JsonProperty("IsAutoPath")]
        public bool IsAutoPath { get; set; } = false;

        [JsonProperty("PolicyPathID")]
        public string PolicyPathID { get; set; } = string.Empty;

        [JsonProperty("UploadTypeID")]
        public string UploadTypeID { get; set; } = string.Empty;

        [JsonProperty("UploadExtensions")]
        public string UploadExtensions { get; set; } = string.Empty;

        [JsonProperty("UploadCount")]
        public int UploadCount { get; set; } = 0;

        [JsonProperty("UploadSizeLimit")]
        public int UploadSizeLimit { get; set; } = 0;

        [JsonProperty("IsLocalDbFileManaged")]
        public bool IsLocalDbFileManaged { get; set; } = false;

        [JsonProperty("SQLiteConnectionString")]
        public string SQLiteConnectionString { get; set; } = string.Empty;

        [JsonProperty("TransactionGetItem")]
        public string TransactionGetItem { get; set; } = string.Empty;

        [JsonProperty("TransactionGetItems")]
        public string TransactionGetItems { get; set; } = string.Empty;

        [JsonProperty("TransactionDeleteItem")]
        public string TransactionDeleteItem { get; set; } = string.Empty;

        [JsonProperty("TransactionUpsertItem")]
        public string TransactionUpsertItem { get; set; } = string.Empty;

        [JsonProperty("TransactionUpdateDependencyID")]
        public string TransactionUpdateDependencyID { get; set; } = string.Empty;

        [JsonProperty("TransactionUpdateFileName")]
        public string TransactionUpdateFileName { get; set; } = string.Empty;

        [JsonProperty("Comment")]
        public string Comment { get; set; } = string.Empty;

        [JsonProperty("CreatedMemberID")]
        public string CreatedMemberID { get; set; } = string.Empty;

        [JsonProperty("CreateUserName")]
        public string CreateUserName { get; set; } = string.Empty;

        [JsonProperty("CreatedAt")]
        public string CreatedAt { get; set; } = string.Empty;

        [JsonProperty("ModifiedAt")]
        public string ModifiedAt { get; set; } = string.Empty;
    }
}
