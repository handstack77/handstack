using System;

namespace HandStack.Core.Licensing.Validation
{
    public interface IValidationChainCondition : IFluentInterface
    {
        ICompleteValidationChain When(Predicate<License> predicate);
    }
}
