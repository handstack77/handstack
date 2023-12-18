using System;

namespace HandStack.Core.Licensing.Validation
{
    public interface ILicenseValidator
    {
        Predicate<License>? Validate { get; set; }

        Predicate<License>? ValidateWhen { get; set; }

        IValidationFailure? FailureResult { get; set; }
    }
}
