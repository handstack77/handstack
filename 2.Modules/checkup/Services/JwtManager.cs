using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

using HandStack.Core.ExtensionMethod;
using HandStack.Web;
using HandStack.Web.Entity;

using Microsoft.IdentityModel.Tokens;

using Newtonsoft.Json;

namespace checkup.Services
{
    public class JwtManager : IJwtManager
    {
        // private readonly ILogger logger;
        // private readonly ModuleApiClient moduleApiClient;

        // public JwtManager(ModuleApiClient moduleApiClient, ILogger logger)
        public JwtManager()
        {
            // this.moduleApiClient = moduleApiClient;
            // this.logger = logger;
        }

        public async Task<string?> GenerateJwtToken(UserAccount userAccount)
        {
            string? result = null;
            var appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userAccount.ApplicationID);
            var settingFilePath = PathExtensions.Combine(appBasePath, "settings.json");
            if (File.Exists(settingFilePath) == true && GlobalConfiguration.DisposeTenantApps.Contains(userAccount.ApplicationID) == false)
            {
                var appSettingText = await System.IO.File.ReadAllTextAsync(settingFilePath);
                var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                if (appSetting != null)
                {
                    var claims = new List<Claim>();
                    if (!string.IsNullOrWhiteSpace(userAccount.UserAccountID))
                    {
                        claims.Add(new Claim("UserAccountID", userAccount.UserAccountID));
                    }
                    claims.Add(new Claim("ApplicationID", userAccount.ApplicationID));
                    claims.Add(new Claim("UserID", userAccount.UserID));
                    claims.Add(new Claim("UserName", userAccount.UserName));
                    claims.Add(new Claim("Email", userAccount.Email));

                    if (userAccount.Roles.Count > 0)
                    {
                        var accountRoles = new List<string>();
                        foreach (var item in userAccount.Roles)
                        {
                            accountRoles.Add(item.ToString());
                        }
                        claims.Add(new Claim("Roles", string.Join(",", accountRoles)));
                    }

                    claims.Add(new Claim("Claims", JsonConvert.SerializeObject(userAccount.Claims)));

                    if (!string.IsNullOrWhiteSpace(userAccount.UserNo))
                    {
                        claims.Add(new Claim("UserNo", userAccount.UserNo));
                    }

                    if (!string.IsNullOrWhiteSpace(userAccount.PositionName))
                    {
                        claims.Add(new Claim("PositionName", userAccount.PositionName));
                    }

                    if (!string.IsNullOrWhiteSpace(userAccount.DepartmentName))
                    {
                        claims.Add(new Claim("DepartmentName", userAccount.DepartmentName));
                    }

                    if (!string.IsNullOrWhiteSpace(userAccount.CompanyName))
                    {
                        claims.Add(new Claim("CompanyName", userAccount.CompanyName));
                    }

                    if (!string.IsNullOrWhiteSpace(userAccount.BirthDate))
                    {
                        claims.Add(new Claim("BirthDate", userAccount.BirthDate));
                    }

                    if (!string.IsNullOrWhiteSpace(userAccount.Gender))
                    {
                        claims.Add(new Claim("Gender", userAccount.Gender));
                    }

                    if (!string.IsNullOrWhiteSpace(userAccount.Address))
                    {
                        claims.Add(new Claim("Address", userAccount.Address));
                    }

                    if (!string.IsNullOrWhiteSpace(userAccount.ExtendOption))
                    {
                        claims.Add(new Claim("ExtendOption", userAccount.ExtendOption));
                    }

                    if (!string.IsNullOrWhiteSpace(userAccount.SessionKey))
                    {
                        claims.Add(new Claim("SessionKey", userAccount.SessionKey));
                    }

                    claims.Add(new Claim("LoginedAt", userAccount.LoginedAt.ToString("yyyy-MM-dd HH:mm:ss.fff")));
                    claims.Add(new Claim("CreatedAt", DateTime.Now.ToString()));

                    var tokenHandler = new JwtSecurityTokenHandler();
                    var key = new byte[64];
                    var secret = Encoding.UTF8.GetBytes(appSetting.AppSecret);
                    Buffer.BlockCopy(secret, 0, key, 0, (secret.Length > 64 ? 64 : secret.Length));

                    var tokenDescriptor = new SecurityTokenDescriptor
                    {
                        Issuer = GlobalConfiguration.SystemID,
                        Subject = new ClaimsIdentity(claims),
                        Expires = DateTime.UtcNow.AddMinutes(60),
                        SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
                    };

                    var token = tokenHandler.CreateToken(tokenDescriptor);
                    result = tokenHandler.WriteToken(token);
                }
            }

            return result;
        }

        public async Task<bool> ValidateJwtToken(string token, string userWorkID, string applicationID)
        {
            var result = false;
            if (string.IsNullOrWhiteSpace(token))
            {
                return result;
            }

            var tenantID = $"{userWorkID}|{applicationID}";
            var appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
            var settingFilePath = PathExtensions.Combine(appBasePath, "settings.json");
            if (File.Exists(settingFilePath) == true && GlobalConfiguration.DisposeTenantApps.Contains(tenantID) == false)
            {
                var appSettingText = await System.IO.File.ReadAllTextAsync(settingFilePath);
                var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                if (appSetting != null)
                {
                    var tokenHandler = new JwtSecurityTokenHandler();
                    var key = new byte[64];
                    var secret = Encoding.UTF8.GetBytes(appSetting.AppSecret);
                    Buffer.BlockCopy(secret, 0, key, 0, (secret.Length > 64 ? 64 : secret.Length));
                    try
                    {
                        tokenHandler.ValidateToken(token, new TokenValidationParameters
                        {
                            ValidateIssuerSigningKey = true,
                            IssuerSigningKey = new SymmetricSecurityKey(key),
                            ValidateIssuer = true,
                            ValidIssuer = GlobalConfiguration.SystemID,
                            ValidateAudience = false,
                            ClockSkew = TimeSpan.Zero
                        }, out var validatedToken);

                        var jwtToken = (JwtSecurityToken)validatedToken;

                        result = true;
                    }
                    catch
                    {
                        result = false;
                    }
                }
            }

            return result;
        }

        public RefreshToken GenerateRefreshToken(string ipAddress)
        {
            var refreshToken = new RefreshToken
            {
                Token = Convert.ToHexString(RandomNumberGenerator.GetBytes(64)),
                ExpiredAt = DateTime.UtcNow.AddDays(3),
                CreatedAt = DateTime.UtcNow,
                CreatedByIP = ipAddress
            };

            return refreshToken;
        }

        public async Task<UserAccount?> GetUserAccount(string token, string userWorkID, string applicationID)
        {
            UserAccount? result = null;
            if (string.IsNullOrWhiteSpace(token))
            {
                return result;
            }

            var tenantID = $"{userWorkID}|{applicationID}";
            var appBasePath = PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID);
            var settingFilePath = PathExtensions.Combine(appBasePath, "settings.json");
            if (File.Exists(settingFilePath) == true && GlobalConfiguration.DisposeTenantApps.Contains(tenantID) == false)
            {
                var appSettingText = await File.ReadAllTextAsync(settingFilePath);
                var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                if (appSetting != null)
                {
                    var tokenHandler = new JwtSecurityTokenHandler();
                    var key = new byte[64];
                    var secret = Encoding.UTF8.GetBytes(appSetting.AppSecret);
                    Buffer.BlockCopy(secret, 0, key, 0, (secret.Length > 64 ? 64 : secret.Length));
                    try
                    {
                        tokenHandler.ValidateToken(token, new TokenValidationParameters
                        {
                            ValidateIssuerSigningKey = true,
                            IssuerSigningKey = new SymmetricSecurityKey(key),
                            ValidateIssuer = true,
                            ValidIssuer = GlobalConfiguration.SystemID,
                            ValidateAudience = false,
                            ClockSkew = TimeSpan.Zero
                        }, out var validatedToken);

                        var jwtToken = (JwtSecurityToken)validatedToken;

                        result = new UserAccount();
                        result.UserAccountID = jwtToken.Claims.First(x => x.Type == "UserAccountID").Value;
                        result.ApplicationID = jwtToken.Claims.First(x => x.Type == "ApplicationID").Value;
                        result.UserID = jwtToken.Claims.First(x => x.Type == "UserID").Value;
                        result.UserName = jwtToken.Claims.First(x => x.Type == "UserName").Value;
                        result.Email = jwtToken.Claims.First(x => x.Type == "Email").Value;

                        if (DateTime.TryParse(jwtToken.Claims.First(x => x.Type == "LoginedAt").Value, out var loginedAt) == true)
                        {
                            result.LoginedAt = loginedAt;
                        }

                        var tokenRoles = (jwtToken.Claims.FirstOrDefault(x => x.Type == "Roles")?.Value).ToStringSafe().Split(",", StringSplitOptions.RemoveEmptyEntries);
                        foreach (var tokenRole in tokenRoles)
                        {
                            if (Enum.TryParse<Role>(tokenRole, out var role) == true)
                            {
                                if (result.Roles.Contains(role.ToString()) == false)
                                {
                                    result.Roles.Add(role.ToString());
                                }
                            }
                        }

                        var tokenClaims = JsonConvert.DeserializeObject<Dictionary<string, string>>(jwtToken.Claims.First(x => x.Type == "Claims").Value);
                        if (tokenClaims == null || tokenClaims.Count == 0)
                        {
                            result.Claims = new Dictionary<string, string>();
                        }
                        else
                        {
                            result.Claims = tokenClaims;
                        }

                        result.PositionName = jwtToken.Claims.FirstOrDefault(x => x.Type == "PositionName")?.Value;
                        result.DepartmentName = jwtToken.Claims.FirstOrDefault(x => x.Type == "DepartmentName")?.Value;
                        result.CompanyName = jwtToken.Claims.FirstOrDefault(x => x.Type == "CompanyName")?.Value;
                        result.BirthDate = jwtToken.Claims.FirstOrDefault(x => x.Type == "BirthDate")?.Value;
                        result.Gender = jwtToken.Claims.FirstOrDefault(x => x.Type == "Gender")?.Value;
                        result.Address = jwtToken.Claims.FirstOrDefault(x => x.Type == "Address")?.Value;
                        result.ExtendOption = jwtToken.Claims.FirstOrDefault(x => x.Type == "ExtendOption")?.Value;
                    }
                    catch
                    {
                        result = null;
                    }
                }
            }

            return result;
        }
    }
}

