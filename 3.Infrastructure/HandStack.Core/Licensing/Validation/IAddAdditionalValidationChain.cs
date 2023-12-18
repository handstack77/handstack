namespace HandStack.Core.Licensing.Validation
{
    public interface IAddAdditionalValidationChain : IFluentInterface
    {
        IStartValidationChain And();
    }
}