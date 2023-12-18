namespace HandStack.Core.Licensing.Validation
{
    public class LicenseExpiredValidationFailure : IValidationFailure
    {
        public string? Message { get; set; }

        public string? HowToResolve { get; set; }
    }
}
