using System;

namespace HandStack.Core.Licensing.Validation
{
    internal class LicenseValidator : ILicenseValidator
    {
        public Predicate<License>? Validate { get; set; }

        public Predicate<License>? ValidateWhen { get; set; }

        public IValidationFailure? FailureResult { get; set; }
    }
}
