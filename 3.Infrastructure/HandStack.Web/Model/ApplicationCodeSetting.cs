namespace HandStack.Web.Model
{
    public class ApplicationCodeSetting
    {
        public ApplicationCodeSetting()
        {
            CodeID = "";
            Value = "";
            DataType = "";
            Area = "";
            CommonYN = false;
        }

        public string CodeID { get; set; }

        public string? Value { get; set; }

        public string? DataType { get; set; }

        public string? Area { get; set; }

        public bool CommonYN { get; set; }
    }
}
