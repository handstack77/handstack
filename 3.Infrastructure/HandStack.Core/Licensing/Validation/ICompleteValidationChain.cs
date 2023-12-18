namespace HandStack.Core.Licensing.Validation
{
    public interface ICompleteValidationChain : IAddAdditionalValidationChain, IAssertValidation
    {
    }
}