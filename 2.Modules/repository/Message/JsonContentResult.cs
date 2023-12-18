namespace repository.Message
{
    public class JsonContentResult
    {
        public JsonContentResult()
        {
            Message = null;
            Result = false;
        }

        public dynamic? Message { get; set; }

        public bool Result { get; set; }
    }
}
