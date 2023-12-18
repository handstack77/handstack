namespace HandStack.Core.Licensing.Validation
{
    public class GeneralValidationFailure : IValidationFailure
    {
        public string? Message { get; set; }

        public string? HowToResolve { get; set; }
    }
}
