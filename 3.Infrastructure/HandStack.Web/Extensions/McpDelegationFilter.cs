using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Threading.Tasks;

using HandStack.Web.MessageContract.DataObject;
using HandStack.Web.MessageContract.Message;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

using Newtonsoft.Json.Linq;

namespace HandStack.Web.Extensions
{
    public sealed class McpDelegationOptions
    {
        public bool Enabled { get; set; }
        public bool RequireForExecute { get; set; }
        public string Issuer { get; set; } = "";
        public string Audience { get; set; } = "handstack-transact";
        public string PublicKeyPath { get; set; } = "";
        public Dictionary<string, List<string>> ContractRoots { get; set; } = [];
    }

    public sealed class McpDelegationFilter : IAsyncResourceFilter, IActionFilter
    {
        private const string ContextKey = "HandStack.Mcp.Delegation";
        private const string UserKey = "HandStack.Mcp.User";
        private static readonly ConcurrentDictionary<string, long> Nonces = new();
        private readonly IMcpDelegationContext contextProvider;

        public McpDelegationFilter(IMcpDelegationContext contextProvider)
        {
            this.contextProvider = contextProvider;
        }

        public static BearerToken? GetUser(HttpContext context)
        {
            return context.Items.TryGetValue(UserKey, out var value) ? value as BearerToken : null;
        }

        public async Task OnResourceExecutionAsync(ResourceExecutingContext context, ResourceExecutionDelegate next)
        {
            var http = context.HttpContext;
            var options = contextProvider.Options;
            if (!http.Request.Headers.TryGetValue(McpDelegationProtocol.Header, out var value))
            {
                if (options.RequireForExecute)
                {
                    context.Result = new UnauthorizedObjectResult(new { message = "MCP 사용자 위임이 필요합니다" });
                    return;
                }

                await next();
                return;
            }

            try
            {
                if (!options.Enabled || value.Count != 1 || !File.Exists(options.PublicKeyPath))
                {
                    throw new InvalidOperationException();
                }

                http.Request.EnableBuffering();
                using var body = new MemoryStream();
                var buffer = new byte[8192];
                int count;
                while ((count = await http.Request.Body.ReadAsync(buffer, http.RequestAborted)) > 0)
                {
                    if (body.Length + count > 1048576)
                    {
                        throw new InvalidOperationException();
                    }

                    body.Write(buffer, 0, count);
                }

                http.Request.Body.Position = 0;
                using var rsa = RSA.Create();
                rsa.ImportFromPem(File.ReadAllText(options.PublicKeyPath));
                var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                var claims = McpDelegationProtocol.Verify(value.ToString(), rsa, options.Issuer, options.Audience, http.Request.Path.ToString(), McpDelegationProtocol.Hash(body.ToArray()), now);
                if (Nonces.Count > 10000)
                {
                    foreach (var old in Nonces.Where(x => x.Value <= now))
                    {
                        Nonces.TryRemove(old.Key, out _);
                    }
                }

                if (Nonces.Count > 20000 || !Nonces.TryAdd(claims.Issuer + ":" + claims.Nonce, claims.ExpiresAt))
                {
                    throw new InvalidOperationException();
                }

                foreach (var stamp in claims.Files)
                {
                    if (!options.ContractRoots.TryGetValue(stamp.Kind, out var roots) || Path.IsPathRooted(stamp.RelativePath))
                    {
                        throw new InvalidOperationException();
                    }

                    var found = false;
                    foreach (var root in roots)
                    {
                        var directory = Path.GetFullPath(GlobalConfiguration.GetBaseDirectoryPath(root));
                        var file = Path.GetFullPath(Path.Combine(directory, stamp.RelativePath));
                        if (!file.StartsWith(directory.TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
                        {
                            throw new InvalidOperationException();
                        }

                        if (File.Exists(file) && McpDelegationProtocol.Hash(File.ReadAllBytes(file)) == stamp.Hash)
                        {
                            found = true;
                            break;
                        }
                    }

                    if (!found)
                    {
                        throw new InvalidOperationException();
                    }
                }

                if (claims.Files.Count == 0)
                {
                    throw new InvalidOperationException();
                }

                http.Items[ContextKey] = claims;
            }
            catch (Exception exception)when (exception is not OperationCanceledException)
            {
                context.Result = new UnauthorizedObjectResult(new { message = "MCP 사용자 위임 또는 계약 검증 실패" });
                return;
            }

            await next();
        }

        public void OnActionExecuting(ActionExecutingContext context)
        {
            if (!context.HttpContext.Items.TryGetValue(ContextKey, out var value) || value is not McpDelegationClaims claims)
            {
                return;
            }

            try
            {
                var request = context.ActionArguments.Values.OfType<TransactionRequest>().Single();
                var id = $"{request.System.ProgramID}|{request.Transaction.BusinessID}|{request.Transaction.TransactionID}|{request.Transaction.FunctionID}";
                if (id != claims.ContractId || request.Transaction.OperatorID != claims.UserName || request.Action != "SYN" || request.AccessToken?.Length > 0 || request.LoadOptions?.Count > 0 || context.HttpContext.Request.Headers.ContainsKey("X-Workflow-Contract"))
                {
                    throw new InvalidOperationException();
                }

                ValidateContract(id, claims, new HashSet<string>());
                var variables = new JObject
                {
                    ["UserID"] = claims.UserName,
                    ["UserNo"] = claims.Subject
                };
                foreach (var item in claims.Claims)
                {
                    variables[item.Key] = item.Value;
                }

                var token = new BearerToken
                {
                    TokenID = claims.Nonce,
                    IssuerName = claims.Issuer,
                    CreatedAt = DateTime.UtcNow,
                    ExpiredAt = DateTimeOffset.FromUnixTimeSeconds(claims.ExpiresAt).UtcDateTime,
                    Policy = new Policy
                    {
                        UserID = claims.UserName,
                        UserNo = claims.Subject,
                        Roles = [..claims.Roles],
                        Claims = claims.Claims
                    },
                    Variable = variables
                };
                context.HttpContext.Items[UserKey] = token;
            }
            catch
            {
                context.Result = new ObjectResult(new { message = "MCP 거래 권한 검증 실패" })
                {
                    StatusCode = 403
                };
            }
        }

        private void ValidateContract(string id, McpDelegationClaims claims, HashSet<string> path)
        {
            if (!claims.AllowedContracts.Contains(id, StringComparer.Ordinal) || !path.Add(id))
            {
                throw new InvalidOperationException();
            }

            try
            {
                var parts = id.Split('|');
                if (parts.Length != 4)
                {
                    throw new InvalidOperationException();
                }

                var contract = contextProvider.GetBusinessContract(parts[0], parts[1], parts[2]) ?? throw new InvalidOperationException();
                var service = contract.Services.Single(x => x.ServiceID == parts[3]);
                if (service.AuthorizeMethod?.Any(x => x.StartsWith("TransactionToken", StringComparison.Ordinal)) == true)
                {
                    throw new InvalidOperationException();
                }

                if (service.Authorize)
                {
                    var checks = new List<bool>();
                    var methods = service.AuthorizeMethod;
                    if ((methods == null || methods.Count == 0 || methods.Contains("Role")) && service.Roles?.Count > 0)
                    {
                        checks.Add(service.Roles.Any(required => claims.Roles.Any(role => role == required || (Enum.TryParse<HandStack.Web.Entity.Role>(role, out var userRole) && Enum.TryParse<HandStack.Web.Entity.Role>(required, out var requiredRole) && (int)userRole <= (int)requiredRole))));
                    }

                    if ((methods == null || methods.Count == 0 || methods.Contains("Policy")) && service.Policys?.Count > 0)
                    {
                        checks.Add(service.Policys.Any(x => claims.Claims.TryGetValue(x.Key, out var claim) && (x.Value == null || x.Value.Contains(claim))));
                    }

                    // 설정된 역할/정책 중 하나를 충족해야 한다. 미설정 검사를 true로 취급하지 않는다.
                    if (checks.Count > 0 && !checks.Any(x => x))
                    {
                        throw new InvalidOperationException();
                    }
                }

                if (service.CommandType == "W")
                {
                    foreach (var step in service.WorkflowSteps)
                    {
                        var app = string.IsNullOrEmpty(step.ApplicationID) ? parts[0] : step.ApplicationID;
                        var project = string.IsNullOrEmpty(step.TransactionProjectID) ? parts[1] : step.TransactionProjectID;
                        var transaction = string.IsNullOrEmpty(step.TransactionID) ? parts[2] : step.TransactionID;
                        var function = string.IsNullOrEmpty(step.ServiceID) ? parts[3] : step.ServiceID;
                        ValidateContract($"{app}|{project}|{transaction}|{function}", claims, path);
                        var target = contextProvider.GetBusinessContract(app, project, transaction)?.Services.Single(x => x.ServiceID == function);
                        if (!string.IsNullOrWhiteSpace(step.CommandType) && target?.CommandType != step.CommandType)
                        {
                            throw new InvalidOperationException();
                        }
                    }
                }

                if (service.CommandType == "S")
                {
                    foreach (var step in service.SequentialOptions)
                    {
                        var project = string.IsNullOrEmpty(step.TransactionProjectID) ? parts[1] : step.TransactionProjectID;
                        var transaction = string.IsNullOrEmpty(step.TransactionID) ? parts[2] : step.TransactionID;
                        ValidateContract($"{parts[0]}|{project}|{transaction}|{step.ServiceID}", claims, path);
                        var target = contextProvider.GetBusinessContract(parts[0], project, transaction)?.Services.Single(x => x.ServiceID == step.ServiceID);
                        if (!string.IsNullOrWhiteSpace(step.CommandType) && target?.CommandType != step.CommandType)
                        {
                            throw new InvalidOperationException();
                        }
                    }
                }
            }
            finally
            {
                path.Remove(id);
            }
        }

        public void OnActionExecuted(ActionExecutedContext context)
        {
        }
    }
}
