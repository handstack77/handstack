using System.Collections.Generic;

namespace prompter.Entity
{
    public record PromptToolSettings
    {
        public string Mode { get; set; }

        public int MaxRounds { get; set; }

        public List<PromptToolDeclaration> Items { get; set; }

        public PromptToolSettings()
        {
            Mode = "none";
            MaxRounds = 3;
            Items = new List<PromptToolDeclaration>();
        }
    }

    public record PromptToolDeclaration
    {
        public string Kind { get; set; }

        public string Name { get; set; }

        public string Functions { get; set; }

        public string Command { get; set; }

        public string Args { get; set; }

        public int Timeout { get; set; }

        public PromptToolDeclaration()
        {
            Kind = "";
            Name = "";
            Functions = "";
            Command = "";
            Args = "";
            Timeout = 0;
        }
    }

    public record PromptAuthorization
    {
        public string Type { get; set; }

        public string Value { get; set; }

        public string Username { get; set; }

        public string Password { get; set; }

        public string Name { get; set; }

        public string Location { get; set; }

        public PromptAuthorization()
        {
            Type = "";
            Value = "";
            Username = "";
            Password = "";
            Name = "";
            Location = "header";
        }
    }

    public record PromptHeader
    {
        public string Name { get; set; }

        public string Value { get; set; }

        public PromptHeader()
        {
            Name = "";
            Value = "";
        }
    }

    public record PromptBody
    {
        public string Type { get; set; }

        public string RawText { get; set; }

        public List<PromptBodyPart> Parts { get; set; }

        public PromptBody()
        {
            Type = "";
            RawText = "";
            Parts = new List<PromptBodyPart>();
        }
    }

    public record PromptBodyPart
    {
        public string Type { get; set; }

        public string Name { get; set; }

        public string Value { get; set; }

        public string Path { get; set; }

        public string Base64 { get; set; }

        public string FileName { get; set; }

        public string ContentType { get; set; }

        public PromptBodyPart()
        {
            Type = "field";
            Name = "";
            Value = "";
            Path = "";
            Base64 = "";
            FileName = "";
            ContentType = "application/octet-stream";
        }
    }
}
