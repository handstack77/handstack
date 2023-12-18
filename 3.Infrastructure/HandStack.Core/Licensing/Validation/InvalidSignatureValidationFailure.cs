namespace HandStack.Core.Licensing.Validation
{
    public class InvalidSignatureValidationFailure : IValidationFailure
    {
        public string? Message { get; set; }

        public string? HowToResolve { get; set; }
    }
}
