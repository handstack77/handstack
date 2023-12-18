namespace repository.Message
{
    public class TokenResult
    {
        public TokenResult()
        {
            Token = "";
            Message = "";
            Result = false;
        }

        public string Token { get; set; }

        public string Message { get; set; }

        public bool Result { get; set; }
    }
}
