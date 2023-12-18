namespace HandStack.Core.Licensing.Validation
{
    public interface IValidationFailure
    {
        string? Message { get; set; }

        string? HowToResolve { get; set; }
    }
}
