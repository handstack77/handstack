namespace transact.Entity
{
    public record Input
    {
        public string JsonObjectType { get; set; }
        public string CommandText { get; set; }

        public Input()
        {
            JsonObjectType = "";
            CommandText = "";
        }
    }
}
