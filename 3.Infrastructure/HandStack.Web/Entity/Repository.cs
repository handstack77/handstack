namespace HandStack.Web.Entity
{
    public partial record Repository
    {
        public string ApplicationID { get; set; } = "";

        public string AccessID { get; set; } = "";

        public string RepositoryID { get; set; } = "";

        public string RepositoryName { get; set; } = "";

        public string StorageType { get; set; } = "FileSystem";

        public string PhysicalPath { get; set; } = "";

        public string BlobContainerID { get; set; } = "";

        public string BlobConnectionString { get; set; } = "";

        public string BlobItemUrl { get; set; } = "";

        public string GcsBucketName { get; set; } = "";

        public string GcsCredentialFile { get; set; } = "";

        public string AwsBucketName { get; set; } = "";

        public string AwsRegion { get; set; } = "";

        public string AwsAccessKey { get; set; } = "";

        public string AwsSecretKey { get; set; } = "";

        public string AwsServiceUrl { get; set; } = "";

        public bool IsVirtualPath { get; set; } = false;

        public string AccessMethod { get; set; } = "protected";

        public bool IsFileUploadDownloadOnly { get; set; } = false;

        public bool IsMultiUpload { get; set; } = false;

        public bool IsFileOverWrite { get; set; } = false;

        public bool IsFileNameEncrypt { get; set; } = false;

        public bool IsKeepFileExtension { get; set; } = false;

        public bool IsAutoPath { get; set; } = false;

        public string PolicyPathID { get; set; } = "1";

        public string UploadTypeID { get; set; } = "";

        public string UploadExtensions { get; set; } = "";

        public int UploadCount { get; set; } = 0;

        public long UploadSizeLimit { get; set; } = 0;

        public bool IsLocalDbFileManaged { get; set; } = false;

        public string SQLiteConnectionString { get; set; } = "";

        public string TransactionGetItem { get; set; } = "";

        public string TransactionGetItems { get; set; } = "";

        public string TransactionDeleteItem { get; set; } = "";

        public string TransactionUpsertItem { get; set; } = "";

        public string TransactionUpdateDependencyID { get; set; } = "";

        public string TransactionUpdateFileName { get; set; } = "";

        public string? UserWorkID { get; set; } = "";

        public string? SettingFilePath { get; set; } = "";

        public string? UploadOptions { get; set; } = "";

        public string? Comment { get; set; } = "";

        public string? CreatedMemberID { get; set; } = "";

        public string? CreateUserName { get; set; } = "";

        public string? CreatedAt { get; set; } = "";

        public string? ModifiedAt { get; set; } = "";
    }
}
