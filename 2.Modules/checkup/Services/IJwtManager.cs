using System.Threading.Tasks;

using HandStack.Web.Entity;

namespace checkup.Services
{
    public interface IJwtManager
    {
        public Task<string?> GenerateJwtToken(UserAccount account);

        public Task<bool> ValidateJwtToken(string token, string userWorkID, string applicationID);

        public RefreshToken GenerateRefreshToken(string ipAddress);

        public Task<UserAccount?> GetUserAccount(string token, string userWorkID, string applicationID);
    }
}
