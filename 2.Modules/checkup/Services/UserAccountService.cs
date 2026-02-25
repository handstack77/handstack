using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

using checkup.Extensions;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using Serilog;

namespace checkup.Services
{
    public class UserAccountService : IUserAccountService
    {
        private readonly ILogger logger;
        private readonly ModuleApiClient moduleApiClient;
        private readonly IJwtManager jwtManager;

        public UserAccountService(ILogger logger, ModuleApiClient moduleApiClient, IJwtManager jwtManager)
        {
            this.logger = logger;
            this.moduleApiClient = moduleApiClient;
            this.jwtManager = jwtManager;
        }

        public async Task RevokeToken(RefreshToken refreshToken, string ipAddress)
        {
            await RevokeRefreshToken(refreshToken, ipAddress);
        }

        public Tuple<UserAccount?, List<Claim>?>? CreateUserInformation(JToken? token)
        {
            Tuple<UserAccount?, List<Claim>?>? result = null;

            if (token != null)
            {
                try
                {
                    var userAccount = new UserAccount()
                    {
                        ApplicationID = token["ApplicationID"].ToStringSafe(),
                        UserAccountID = token["UserAccountID"].ToStringSafe(),
                        UserNo = token["UserNo"].ToStringSafe(),
                        UserID = token["UserID"].ToStringSafe(),
                        UserName = token["UserName"].ToStringSafe(),
                        Email = token["Email"].ToStringSafe(),
                        Roles = new List<string>(),
                        Claims = new Dictionary<string, string>(),
                        LoginedAt = DateTime.Now
                    };

                    if (string.IsNullOrWhiteSpace(userAccount.UserID) || string.IsNullOrWhiteSpace(userAccount.UserName) || string.IsNullOrWhiteSpace(userAccount.Email))
                    {
                        return null;
                    }

                    if (string.IsNullOrWhiteSpace(userAccount.UserNo))
                    {
                        userAccount.UserNo = userAccount.UserID;
                    }

                    var memberRoles = token["Roles"].ToStringSafe().Split(",", StringSplitOptions.RemoveEmptyEntries);
                    foreach (var memberRole in memberRoles)
                    {
                        if (Enum.TryParse<Role>(memberRole, out var role) == true)
                        {
                            if (userAccount.Roles.Contains(role.ToString()) == false)
                            {
                                userAccount.Roles.Add(role.ToString());
                            }
                        }
                    }

                    var claims = new List<Claim>
                    {
                        new Claim("UserID", userAccount.UserID),
                        new Claim("UserName", userAccount.UserName.ToStringSafe()),
                        new Claim("UserNo", userAccount.UserNo),
                        new Claim("Roles", string.Join(",", userAccount.Roles.ToArray())),
                        new Claim("LoginedAt", userAccount.LoginedAt.ToString("yyyy-MM-dd HH:mm:ss.fff"))
                    };

                    Dictionary<string, string>? memberClaims = null;
                    var accountClaims = token["Claims"].ToStringSafe();
                    if (!string.IsNullOrWhiteSpace(accountClaims))
                    {
                        try
                        {
                            memberClaims = JsonConvert.DeserializeObject<Dictionary<string, string>>(accountClaims);
                        }
                        catch
                        {
                            return null;
                        }
                    }

                    if (memberClaims != null)
                    {
                        foreach (var item in memberClaims)
                        {
                            var claimType = item.Key;
                            var claimValue = item.Value;
                            if (!string.IsNullOrWhiteSpace(claimType))
                            {
                                var claim = new Claim(claimType, claimValue);
                                if (claims.Contains(claim) == false)
                                {
                                    userAccount.Claims.Add(claimType, claimValue);
                                    claims.Add(claim);
                                }
                            }
                        }
                    }

                    userAccount.Celluar = token["Celluar"]?.ToString();
                    userAccount.PositionName = token["PositionName"]?.ToString();
                    userAccount.DepartmentName = token["DepartmentName"]?.ToString();
                    userAccount.CompanyName = token["CompanyName"]?.ToString();
                    userAccount.BirthDate = token["BirthDate"]?.ToString();
                    userAccount.Gender = token["Gender"]?.ToString();
                    userAccount.Address = token["Address"]?.ToString();
                    userAccount.ExtendOption = token["ExtendOption"]?.ToString();

                    result = new Tuple<UserAccount?, List<Claim>?>(userAccount, claims);
                }
                catch (Exception exception)
                {
                    logger.Error(exception, $"[{{LogCategory}}] 토큰 정보 사용자 변환 오류: {token?.ToString()}", "UserAccountService/CreateUserInformation");
                }
            }

            return result;
        }

        public async Task<JToken?> GetUserAccountByID(string applicationID, string userAccountID)
        {
            JToken? result = null;
            var serviceParameters = new List<ServiceParameter>();
            serviceParameters.Add("ApplicationID", applicationID);
            serviceParameters.Add("UserAccountID", userAccountID);

            var transactionResult = await moduleApiClient.TransactionDirect("HDS|JWT|JWT010|GD04", serviceParameters);
            if (transactionResult?.ContainsKey("HasException") == true)
            {
                var message = (transactionResult?["HasException"]?["ErrorMessage"]).ToStringSafe();
                logger.Error("[{LogCategory}] " + $"ServiceParameters: {JsonConvert.SerializeObject(serviceParameters)}, ErrorMessage: RefreshToken로 사용자 정보 조회 실패 {message}", "UserAccountService/GetUserAccountByID");
            }
            else
            {
                result = transactionResult?["FormData0"];
            }

            return result;
        }

        public async Task<JToken?> GetUserResultByRefreshToken(string token)
        {
            JToken? result = null;
            var serviceParameters = new List<ServiceParameter>();
            serviceParameters.Add("RefreshToken", token);

            var transactionResult = await moduleApiClient.TransactionDirect("HDS|JWT|JWT010|GD02", serviceParameters);
            if (transactionResult?.ContainsKey("HasException") == true)
            {
                var message = (transactionResult?["HasException"]?["ErrorMessage"]).ToStringSafe();
                logger.Error("[{LogCategory}] " + $"ServiceParameters: {JsonConvert.SerializeObject(serviceParameters)}, ErrorMessage: RefreshToken로 사용자 정보 조회 실패 {message}", "UserAccountService/GetUserResultByRefreshToken");
            }
            else
            {
                result = transactionResult?["FormData0"];
            }

            return result;
        }

        public async Task<RefreshToken> RotateRefreshToken(RefreshToken refreshToken, string ipAddress)
        {
            var newRefreshToken = jwtManager.GenerateRefreshToken(ipAddress);
            await RevokeRefreshToken(refreshToken, ipAddress, newRefreshToken.Token);
            return newRefreshToken;
        }

        public async Task RemoveOldRefreshTokens(UserAccount userAccount)
        {
            var serviceParameters = new List<ServiceParameter>();
            serviceParameters.Add("UserAccountID", userAccount.UserAccountID);
            var transactionResult = await moduleApiClient.TransactionDirect($"HDS|JWT|JWT010|DD01", serviceParameters);
            if (transactionResult?.ContainsKey("HasException") == true)
            {
                var message = $"Forbes 앱 오래된 사용자 RefreshToken 삭제 실패 {(transactionResult?["HasException"]?["ErrorMessage"]).ToStringSafe()}";
                logger.Error("[{LogCategory}] " + $"ServiceParameters: {JsonConvert.SerializeObject(serviceParameters)}, ErrorMessage: {message}", "UserAccountService/RemoveOldRefreshTokens");
            }
        }

        public async Task RevokeDescendantRefreshTokens(RefreshToken refreshToken, UserAccount userAccount, string ipAddress)
        {
            if (!string.IsNullOrWhiteSpace(refreshToken.ReplacedByToken))
            {
                var serviceParameters = new List<ServiceParameter>();
                serviceParameters.Add("RefreshToken", refreshToken.ReplacedByToken);
                var transactionResult = await moduleApiClient.TransactionDirect("HDS|JWT|JWT010|GD03", serviceParameters);
                if (transactionResult?.ContainsKey("HasException") == true)
                {
                    var message = (transactionResult?["HasException"]?["ErrorMessage"]).ToStringSafe();
                    logger.Error("[{LogCategory}] " + $"ServiceParameters: {JsonConvert.SerializeObject(serviceParameters)}, ErrorMessage: RefreshToken로 토큰 정보 조회 실패 {message}", "UserAccountService/RevokeDescendantRefreshTokens");
                }
                else
                {
                    var childToken = transactionResult?["FormData0"]?.ToObject<RefreshToken>();
                    if (childToken != null)
                    {
                        if (childToken.IsActive == true)
                        {
                            await RevokeRefreshToken(childToken, ipAddress);
                        }
                        else
                        {
                            await RevokeDescendantRefreshTokens(childToken, userAccount, ipAddress);
                        }
                    }
                }
            }
        }

        private async Task RevokeRefreshToken(RefreshToken token, string ipAddress, string? replacedByToken = null)
        {
            token.RevokedAt = DateTime.UtcNow;
            token.RevokedByIP = ipAddress;
            token.ReplacedByToken = replacedByToken;

            var serviceParameters = new List<ServiceParameter>();
            serviceParameters.Add("RefreshToken", token.Token);
            serviceParameters.Add("RevokedAt", token.RevokedAt?.ToString("yyyy-MM-dd HH:mm:ss.fff"));
            serviceParameters.Add("RevokedByIP", token.RevokedByIP);
            serviceParameters.Add("ReplacedByToken", token.ReplacedByToken);
            var transactionResult = await moduleApiClient.TransactionDirect("HDS|JWT|JWT010|UD01", serviceParameters);
            if (transactionResult?.ContainsKey("HasException") == true)
            {
                var message = (transactionResult?["HasException"]?["ErrorMessage"]).ToStringSafe();
                logger.Error("[{LogCategory}] " + $"ServiceParameters: {JsonConvert.SerializeObject(serviceParameters)}, ErrorMessage: RefreshToken 폐기 실패 {message}", "UserAccountService/RevokeRefreshToken");
            }
        }
    }
}

