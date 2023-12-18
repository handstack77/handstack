using System;

using Org.BouncyCastle.Asn1.Pkcs;
using Org.BouncyCastle.Crypto;
using Org.BouncyCastle.Security;
using Org.BouncyCastle.X509;

namespace HandStack.Core.Licensing.Security.Cryptography
{
    internal static class KeyFactory
    {
        private static readonly string keyEncryptionAlgorithm = PkcsObjectIdentifiers.PbeWithShaAnd3KeyTripleDesCbc.Id;

        public static string ToEncryptedPrivateKeyString(AsymmetricKeyParameter key, string passPhrase)
        {
            var salt = new byte[16];
            var secureRandom = SecureRandom.GetInstance("SHA256PRNG");
            secureRandom.SetSeed(SecureRandom.GetNextBytes(secureRandom, 16));
            secureRandom.NextBytes(salt);

            return Convert.ToBase64String(PrivateKeyFactory.EncryptKey(keyEncryptionAlgorithm, passPhrase.ToCharArray(), salt, 10, key));
        }

        public static AsymmetricKeyParameter FromEncryptedPrivateKeyString(string privateKey, string passPhrase)
        {
            return PrivateKeyFactory.DecryptKey(passPhrase.ToCharArray(), Convert.FromBase64String(privateKey));
        }

        public static string ToPublicKeyString(AsymmetricKeyParameter key)
        {
            return Convert.ToBase64String(SubjectPublicKeyInfoFactory.CreateSubjectPublicKeyInfo(key).ToAsn1Object().GetDerEncoded());
        }

        public static AsymmetricKeyParameter FromPublicKeyString(string publicKey)
        {
            return PublicKeyFactory.CreateKey(Convert.FromBase64String(publicKey));
        }
    }
}
