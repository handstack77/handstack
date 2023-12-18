using System;
using System.Collections.Generic;

namespace HandStack.Core.Licensing
{
    internal class LicenseBuilder : ILicenseBuilder
    {
        private readonly License license;

        public LicenseBuilder()
        {
            license = new License();
        }

        public ILicenseBuilder WithUniqueIdentifier(Guid id)
        {
            license.Id = id;
            return this;
        }

        public ILicenseBuilder As(LicenseType type)
        {
            license.Type = type;
            return this;
        }

        public ILicenseBuilder ExpiredAt(DateTime date)
        {
            license.Expiration = date.ToUniversalTime();
            return this;
        }

        public ILicenseBuilder WithMaximumUtilization(int utilization)
        {
            license.Quantity = utilization;
            return this;
        }

        public ILicenseBuilder LicensedTo(string name, string email)
        {
            if (license.Customer != null)
            {
                license.Customer.Name = name;
                license.Customer.Email = email;
            }
            return this;
        }

        public ILicenseBuilder LicensedTo(string name, string email, Action<Customer?> configureCustomer)
        {
            if (license.Customer != null)
            {
                license.Customer.Name = name;
                license.Customer.Email = email;
            }

            configureCustomer(license.Customer);
            return this;
        }

        public ILicenseBuilder LicensedTo(Action<Customer?> configureCustomer)
        {
            configureCustomer(license.Customer);
            return this;
        }

        public ILicenseBuilder WithProductFeatures(IDictionary<string, string> productFeatures)
        {
            if (license.ProductFeatures != null)
            {
                license.ProductFeatures.AddAll(productFeatures);
            }
            return this;
        }

        public ILicenseBuilder WithProductFeatures(Action<LicenseAttributes> configureProductFeatures)
        {
            if (license.ProductFeatures != null)
            {
                configureProductFeatures(license.ProductFeatures);
            }
            return this;
        }

        public ILicenseBuilder WithAdditionalAttributes(IDictionary<string, string> additionalAttributes)
        {
            if (license.AdditionalAttributes != null)
            {
                license.AdditionalAttributes.AddAll(additionalAttributes);
            }
            return this;
        }

        public ILicenseBuilder WithAdditionalAttributes(Action<LicenseAttributes> configureAdditionalAttributes)
        {
            if (license.AdditionalAttributes != null)
            {
                configureAdditionalAttributes(license.AdditionalAttributes);
            }
            return this;
        }

        public License CreateAndSignWithPrivateKey(string privateKey, string passPhrase)
        {
            license.Sign(privateKey, passPhrase);
            return license;
        }
    }
}
