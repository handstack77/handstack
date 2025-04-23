using System;
using System.Security.Cryptography;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.MessageContract.DataObject;

using Newtonsoft.Json;

namespace HandStack.Web.Helper
{
    public static class TokenHelper
    {
        public static string CreateBearerToken(string userID, BearerToken bearerToken)
        {
            return userID.EncodeBase64() + "." + JsonConvert.SerializeObject(bearerToken).EncryptAES(userID.PaddingRight(32)) + "." + GlobalConfiguration.HostAccessID.ToSHA256();
        }

        public static bool TryParseToken(string token, out BearerToken? bearerToken)
        {
            bearerToken = null;

            if (string.IsNullOrEmpty(token) == true)
            {
                return false;
            }

            try
            {
                string[] tokenArray = token.Split('.');
                if (tokenArray.Length == 0 || string.IsNullOrEmpty(tokenArray[0]))
                {
                    return false;
                }

                string userID = tokenArray[0].DecodeBase64();
                string signature = tokenArray.Length > 2 ? (tokenArray[2] == GlobalConfiguration.HostAccessID.ToSHA256() ? userID.PaddingRight(32) : "") : userID.PaddingRight(32);
                if (string.IsNullOrEmpty(signature) == true)
                {
                    Console.WriteLine($"토큰 검증 오류");
                    return false;
                }

                string decryptedText = token.DecryptAES(signature);

                bearerToken = JsonConvert.DeserializeObject<BearerToken>(decryptedText);
                if (bearerToken == null)
                {
                    return false;
                }

                return true;
            }
            catch (FormatException exception)
            {
                Console.WriteLine($"토큰 형식 오류: {exception.Message}");
            }
            catch (JsonException exception)
            {
                Console.WriteLine($"토큰 JSON 역직렬화 오류: {exception.Message}");
            }
            catch (CryptographicException exception)
            {
                Console.WriteLine($"토큰 복호화 오류: {exception.Message}");
            }
            catch (Exception exception)
            {
                Console.WriteLine($"예상치 못한 오류 발생: {exception.Message}");
            }

            bearerToken = null;
            return false;
        }
    }
}
