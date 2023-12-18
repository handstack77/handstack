namespace repository.Message
{
    public class DeleteResult
    {
        public DeleteResult()
        {
            Result = false;
            Message = "";
        }

        public bool Result { get; set; }

        public string Message { get; set; }
    }
}
