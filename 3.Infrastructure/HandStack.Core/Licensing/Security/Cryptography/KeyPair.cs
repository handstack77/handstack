using Org.BouncyCastle.Crypto;

namespace HandStack.Core.Licensing.Security.Cryptography
{
    public class KeyPair
    {
        private readonly AsymmetricCipherKeyPair keyPair;

        internal KeyPair(AsymmetricCipherKeyPair keyPair)
        {
            this.keyPair = keyPair;

        }

        public string ToEncryptedPrivateKeyString(string passPhrase)
        {
            return KeyFactory.ToEncryptedPrivateKeyString(keyPair.Private, passPhrase);
        }

        public string ToPublicKeyString()
        {
            return KeyFactory.ToPublicKeyString(keyPair.Public);
        }
    }
}