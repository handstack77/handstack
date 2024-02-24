namespace checkup.Entity
{
    public class AuthenticateResponse
    {
        public string ErrorMessage { get; set; } = string.Empty;

        public string UserAccountID { get; set; } = string.Empty;

        public string AccessToken { get; set; } = string.Empty;

        public string RefreshToken { get; set; } = string.Empty;
    }
}
