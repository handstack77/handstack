using System.Collections.Generic;

using Newtonsoft.Json;

namespace HandStack.Web.Entity
{
    public partial record AppSettings
    {
        [JsonProperty(nameof(ApplicationNo))]
        public string ApplicationNo { get; set; } = string.Empty;

        [JsonProperty(nameof(ApplicationID))]
        public string ApplicationID { get; set; } = string.Empty;

        [JsonProperty(nameof(Version))]
        public string Version { get; set; } = string.Empty;

        [JsonProperty(nameof(UseForumYN))]
        public string UseForumYN { get; set; } = "N";

        [JsonProperty(nameof(ApplicationName))]
        public string ApplicationName { get; set; } = string.Empty;

        [JsonProperty(nameof(AppSecret))]
        public string AppSecret { get; set; } = string.Empty;

        [JsonProperty(nameof(SignInID))]
        public string SignInID { get; set; } = string.Empty;

        [JsonProperty(nameof(Comment))]
        public string Comment { get; set; } = string.Empty;

        [JsonProperty(nameof(CreatedMemberID))]
        public string CreatedMemberID { get; set; } = string.Empty;

        [JsonProperty(nameof(CreatedAt))]
        public string CreatedAt { get; set; } = string.Empty;

        [JsonProperty(nameof(ModifiedMemberID))]
        public string ModifiedMemberID { get; set; } = string.Empty;

        [JsonProperty(nameof(ModifiedAt))]
        public string ModifiedAt { get; set; } = string.Empty;

        [JsonProperty(nameof(AllowAnonymousPath), NullValueHandling = NullValueHandling.Ignore)]
        public List<string>? AllowAnonymousPath { get; set; } = [];

        [JsonProperty(nameof(WithOrigin), NullValueHandling = NullValueHandling.Ignore)]
        public List<string>? WithOrigin { get; set; } = [];

        [JsonProperty(nameof(WithReferer), NullValueHandling = NullValueHandling.Ignore)]
        public List<string>? WithReferer { get; set; } = [];

        [JsonProperty(nameof(DataSource), NullValueHandling = NullValueHandling.Ignore)]
        public List<DataSource>? DataSource { get; set; } = [];

        [JsonProperty(nameof(Storage), NullValueHandling = NullValueHandling.Ignore)]
        public List<AppStorage>? Storage { get; set; } = [];

        [JsonProperty(nameof(Public), NullValueHandling = NullValueHandling.Ignore)]
        public List<AppPublic>? Public { get; set; } = [];

        [JsonProperty(nameof(Routing), NullValueHandling = NullValueHandling.Ignore)]
        public List<Routing>? Routing { get; set; } = [];

        [JsonProperty(nameof(Receive), NullValueHandling = NullValueHandling.Ignore)]
        public List<AppReceive>? Receive { get; set; } = [];

        [JsonProperty(nameof(Publish), NullValueHandling = NullValueHandling.Ignore)]
        public List<AppPublish>? Publish { get; set; } = [];
    }

    public partial record AppPublic
    {
        [JsonProperty(nameof(ProjectID))]
        public string ProjectID { get; set; } = string.Empty;

        [JsonProperty(nameof(TransactionID))]
        public string TransactionID { get; set; } = string.Empty;

        [JsonProperty(nameof(Comment))]
        public string Comment { get; set; } = string.Empty;
    }

    public partial record AppPublish
    {
        [JsonProperty(nameof(DeployID))]
        public string DeployID { get; set; } = string.Empty;

        [JsonProperty(nameof(Protocol))]
        public string Protocol { get; set; } = string.Empty;

        [JsonProperty(nameof(ProtocolName))]
        public string ProtocolName { get; set; } = string.Empty;

        [JsonProperty(nameof(Host))]
        public string Host { get; set; } = string.Empty;

        [JsonProperty(nameof(AccessID))]
        public string AccessID { get; set; } = string.Empty;

        [JsonProperty(nameof(ManagedKey))]
        public string ManagedKey { get; set; } = string.Empty;

        [JsonProperty(nameof(Comment))]
        public string Comment { get; set; } = string.Empty;
    }

    public partial record AppReceive
    {
        [JsonProperty(nameof(DomainID))]
        public string DomainID { get; set; } = string.Empty;

        [JsonProperty(nameof(Protocol))]
        public string Protocol { get; set; } = string.Empty;

        [JsonProperty(nameof(AccessID))]
        public string AccessID { get; set; } = string.Empty;

        [JsonProperty(nameof(Comment))]
        public object Comment { get; set; } = string.Empty;

        [JsonProperty(nameof(ProtocolName))]
        public string ProtocolName { get; set; } = string.Empty;
    }

    public partial record AppStorage
    {
        [JsonProperty(nameof(ApplicationID))]
        public string ApplicationID { get; set; } = string.Empty;

        [JsonProperty(nameof(AccessID))]
        public string AccessID { get; set; } = string.Empty;

        [JsonProperty(nameof(RepositoryID))]
        public string RepositoryID { get; set; } = string.Empty;

        [JsonProperty(nameof(RepositoryName))]
        public string RepositoryName { get; set; } = string.Empty;

        [JsonProperty(nameof(StorageType))]
        public string StorageType { get; set; } = string.Empty;

        [JsonProperty(nameof(PhysicalPath))]
        public string PhysicalPath { get; set; } = string.Empty;

        [JsonProperty(nameof(BlobContainerID))]
        public string BlobContainerID { get; set; } = string.Empty;

        [JsonProperty(nameof(BlobConnectionString))]
        public string BlobConnectionString { get; set; } = string.Empty;

        [JsonProperty(nameof(BlobItemUrl))]
        public string BlobItemUrl { get; set; } = string.Empty;

        [JsonProperty(nameof(IsVirtualPath))]
        public bool IsVirtualPath { get; set; } = false;

        [JsonProperty(nameof(AccessMethod))]
        public string AccessMethod { get; set; } = string.Empty;

        [JsonProperty(nameof(IsFileUploadDownloadOnly))]
        public bool IsFileUploadDownloadOnly { get; set; } = false;

        [JsonProperty(nameof(IsMultiUpload))]
        public bool IsMultiUpload { get; set; } = false;

        [JsonProperty(nameof(IsFileOverWrite))]
        public bool IsFileOverWrite { get; set; } = false;

        [JsonProperty(nameof(IsFileNameEncrypt))]
        public bool IsFileNameEncrypt { get; set; } = false;

        [JsonProperty(nameof(IsKeepFileExtension))]
        public bool IsKeepFileExtension { get; set; } = false;

        [JsonProperty(nameof(IsAutoPath))]
        public bool IsAutoPath { get; set; } = false;

        [JsonProperty(nameof(PolicyPathID))]
        public string PolicyPathID { get; set; } = string.Empty;

        [JsonProperty(nameof(UploadTypeID))]
        public string UploadTypeID { get; set; } = string.Empty;

        [JsonProperty(nameof(UploadExtensions))]
        public string UploadExtensions { get; set; } = string.Empty;

        [JsonProperty(nameof(UploadCount))]
        public int UploadCount { get; set; } = 0;

        [JsonProperty(nameof(UploadSizeLimit))]
        public int UploadSizeLimit { get; set; } = 0;

        [JsonProperty(nameof(IsLocalDbFileManaged))]
        public bool IsLocalDbFileManaged { get; set; } = false;

        [JsonProperty(nameof(SQLiteConnectionString))]
        public string SQLiteConnectionString { get; set; } = string.Empty;

        [JsonProperty(nameof(TransactionGetItem))]
        public string TransactionGetItem { get; set; } = string.Empty;

        [JsonProperty(nameof(TransactionGetItems))]
        public string TransactionGetItems { get; set; } = string.Empty;

        [JsonProperty(nameof(TransactionDeleteItem))]
        public string TransactionDeleteItem { get; set; } = string.Empty;

        [JsonProperty(nameof(TransactionUpsertItem))]
        public string TransactionUpsertItem { get; set; } = string.Empty;

        [JsonProperty(nameof(TransactionUpdateDependencyID))]
        public string TransactionUpdateDependencyID { get; set; } = string.Empty;

        [JsonProperty(nameof(TransactionUpdateFileName))]
        public string TransactionUpdateFileName { get; set; } = string.Empty;

        [JsonProperty(nameof(Comment))]
        public string Comment { get; set; } = string.Empty;

        [JsonProperty(nameof(CreatedMemberID))]
        public string CreatedMemberID { get; set; } = string.Empty;

        [JsonProperty(nameof(CreateUserName))]
        public string CreateUserName { get; set; } = string.Empty;

        [JsonProperty(nameof(CreatedAt))]
        public string CreatedAt { get; set; } = string.Empty;

        [JsonProperty(nameof(ModifiedAt))]
        public string ModifiedAt { get; set; } = string.Empty;
    }
}
