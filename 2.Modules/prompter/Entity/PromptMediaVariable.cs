namespace prompter.Entity
{
    public record PromptMediaVariable
    {
        public string Name { get; set; }

        public string Type { get; set; }

        public string MimeType { get; set; }

        public bool IsRequired { get; set; }

        public PromptMediaVariable()
        {
            Name = "";
            Type = "";
            MimeType = "";
            IsRequired = false;
        }
    }
}
