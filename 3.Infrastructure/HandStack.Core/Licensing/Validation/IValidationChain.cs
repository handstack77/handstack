namespace HandStack.Core.Licensing.Validation
{
    public interface IValidationChain : IValidationChainCondition, ICompleteValidationChain
    {
    }
}