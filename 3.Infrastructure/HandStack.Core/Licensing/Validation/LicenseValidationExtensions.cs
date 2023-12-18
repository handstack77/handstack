using System;
using System.ComponentModel;
using System.Linq;
using System.Reflection;

namespace HandStack.Core.Licensing.Validation
{
    public static class LicenseValidationExtensions
    {
        public static IStartValidationChain Validate(this License license)
        {
            return new ValidationChainBuilder(license);
        }

        public static IValidationChain ExpirationDate(this IStartValidationChain validationChain)
        {
            var validationChainBuilder = (ValidationChainBuilder)validationChain;
            var validator = validationChainBuilder.StartValidatorChain();
            validator.Validate = license => license.Expiration > DateTime.Now;

            validator.FailureResult = new LicenseExpiredValidationFailure()
            {
                Message = $"이 제품의 사용 기한 라이선스가 만료되었습니다",
                HowToResolve = @"라이선스를 갱신하려면 총판/공급업체에 문의하세요"
            };

            return validationChainBuilder;
        }

        public static IValidationChain ProductBuildDate(this IStartValidationChain validationChain, Assembly[] assemblies)
        {
            var validationChainBuilder = (ValidationChainBuilder)validationChain;
            var validator = validationChainBuilder.StartValidatorChain();

            validator.Validate = license => assemblies.All(
                    asm =>
                    asm.GetCustomAttributes(typeof(AssemblyBuildDateAttribute), false)
                       .Cast<AssemblyBuildDateAttribute>()
                       .All(a => a.BuildDate < license.Expiration));

            validator.FailureResult = new LicenseExpiredValidationFailure()
            {
                Message = "이 제품의 라이선스가 만료되었습니다",
                HowToResolve = @"라이선스를 갱신하려면 총판/공급업체에 문의하세요"
            };

            return validationChainBuilder;
        }

        public static IValidationChain AssertThat(this IStartValidationChain validationChain, Predicate<License> predicate, IValidationFailure failure)
        {
            var validationChainBuilder = (ValidationChainBuilder)validationChain;
            var validator = validationChainBuilder.StartValidatorChain();

            validator.Validate = predicate;
            validator.FailureResult = failure;

            return validationChainBuilder;
        }

        public static IValidationChain Signature(this IStartValidationChain validationChain, string publicKey)
        {
            var validationChainBuilder = (ValidationChainBuilder)validationChain;
            var validator = validationChainBuilder.StartValidatorChain();
            validator.Validate = license => license.VerifySignature(publicKey);

            validator.FailureResult = new InvalidSignatureValidationFailure()
            {
                Message = "라이선스 공개 키 서명 유효성 검증에 실패했습니다",
                HowToResolve = @"라이선스 서명과 데이터가 일치하지 않습니다. 이는 일반적으로 라이선스 파일이 손상되었거나 변경된 경우에 발생합니다"
            };

            return validationChainBuilder;
        }
    }
}
