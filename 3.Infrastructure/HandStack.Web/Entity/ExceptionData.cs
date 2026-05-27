namespace HandStack.Web.Entity
{
    public partial record ExceptionData
    {
        public string Error { get; set; } = string.Empty;

        public string Level { get; set; } = string.Empty;

        public string Message { get; set; } = string.Empty;

        public string StackTrace { get; set; } = string.Empty;

        public string TypeMember { get; set; } = string.Empty;
    }
}
