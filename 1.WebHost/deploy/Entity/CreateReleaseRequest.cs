namespace deploy.Entity
{
    public sealed class CreateReleaseRequest
    {
        public string Channel { get; set; } = "stable";

        public string Platform { get; set; } = "win-x64";

        public string Notes { get; set; } = "";
    }
}
