namespace transact.Entity
{
    public class Input
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
