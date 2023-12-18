using System;
using System.Collections.Generic;

namespace HandStack.Core.Licensing.Validation
{
    internal class ValidationChainBuilder : IStartValidationChain, IValidationChain
    {
        private readonly Queue<ILicenseValidator> validators;
        private ILicenseValidator? currentValidatorChain;
        private readonly License license;

        public ValidationChainBuilder(License license)
        {
            this.license = license;
            validators = new Queue<ILicenseValidator>();
        }

        public ILicenseValidator StartValidatorChain()
        {
            return currentValidatorChain = new LicenseValidator();
        }

        public void CompleteValidatorChain()
        {
            if (currentValidatorChain == null)
                return;

            validators.Enqueue(currentValidatorChain);
            currentValidatorChain = null;
        }

        public ICompleteValidationChain When(Predicate<License> predicate)
        {
            if (currentValidatorChain != null)
            {
                currentValidatorChain.ValidateWhen = predicate;
            }
            return this;
        }

        public IStartValidationChain And()
        {
            CompleteValidatorChain();
            return this;
        }

        public IValidationFailure? AssertValidLicense()
        {
            CompleteValidatorChain();

            while (validators.Count > 0)
            {
                var validator = validators.Dequeue();
                if (validator.ValidateWhen != null && !validator.ValidateWhen(license))
                {
                    continue;
                }

#pragma warning disable CS8602
                if (!validator.Validate(license))
                {
                    return validator.FailureResult ?? new GeneralValidationFailure
                    {
                        Message = "라이선스 유효성 검사 실패"
                    };
                }
#pragma warning restore CS8602
            }

            return null;
        }
    }
}
