namespace HandStack.Core.Licensing.Validation
{
    public interface IAssertValidation : IFluentInterface
    {
        IValidationFailure? AssertValidLicense();
    }
}
