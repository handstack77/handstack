using System;
using System.Collections.Generic;

namespace HandStack.Core.Licensing
{
    public interface ILicenseBuilder : IFluentInterface
    {
        ILicenseBuilder WithUniqueIdentifier(Guid id);

        ILicenseBuilder As(LicenseType type);

        ILicenseBuilder ExpiredAt(DateTime date);

        ILicenseBuilder WithMaximumUtilization(int utilization);

        ILicenseBuilder LicensedTo(string name, string email);

        ILicenseBuilder LicensedTo(string name, string email, Action<Customer?> configureCustomer);

        ILicenseBuilder LicensedTo(Action<Customer?> configureCustomer);

        ILicenseBuilder WithProductFeatures(IDictionary<string, string> productFeatures);

        ILicenseBuilder WithProductFeatures(Action<LicenseAttributes?> configureProductFeatures);

        ILicenseBuilder WithAdditionalAttributes(IDictionary<string, string> additionalAttributes);

        ILicenseBuilder WithAdditionalAttributes(Action<LicenseAttributes?> configureAdditionalAttributes);

        License CreateAndSignWithPrivateKey(string privateKey, string passPhrase);
    }
}
