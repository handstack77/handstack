using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

using HandStack.Web.Entity;

using Newtonsoft.Json.Linq;

namespace checkup.Services
{
    public interface IUserAccountService
    {
        Task RevokeToken(RefreshToken refreshToken, string ipAddress);

        Task<JToken?> GetUserAccountByID(string applicationID, string userAccountID);

        Tuple<UserAccount?, List<Claim>?>? CreateUserInformation(JToken? token);

        Task<JToken?> GetUserResultByRefreshToken(string token);

        Task RevokeDescendantRefreshTokens(RefreshToken refreshToken, UserAccount userAccount, string ipAddress);

        Task<RefreshToken> RotateRefreshToken(RefreshToken refreshToken, string ipAddress);

        Task RemoveOldRefreshTokens(UserAccount userAccount);
    }
}
