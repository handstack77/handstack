using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Threading.Tasks;

using forbes.Extensions;

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace forbes.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public sealed class DispatchController : ControllerBase
    {
        private readonly IConfiguration configuration;

        public DispatchController(IConfiguration configuration)
        {
            this.configuration = configuration;
        }

        // curl -X POST "http://localhost:8420/api/dispatch/repository" -H "Content-Type: application/json" -d "{\"eventType\":\"sync_config\",\"clientPayload\":{\"source\":\"external\",\"changedBy\":\"erp\"}}"
        [HttpPost("repository")]
        public async Task<IActionResult> Repository([FromBody] RepositoryDispatchRequest request)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            string owner = configuration["GitHubRepositoryOwner"] ?? string.Empty;
            string repositoryName = configuration["GitHubRepositoryName"] ?? string.Empty;

            if (string.IsNullOrWhiteSpace(owner) || string.IsNullOrWhiteSpace(repositoryName))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "GitHubRepositoryOwner 또는 GitHubRepositoryName 설정값이 비어 있습니다."
                });
            }

            object? payload = null;
            if (request.ClientPayload.HasValue && request.ClientPayload.Value.ValueKind != JsonValueKind.Undefined)
            {
                payload = ConvertJsonElement(request.ClientPayload.Value);
            }

            var gitHubSyncManager = GitHubSyncManager.CreateFromConfiguration(configuration);
            bool isTriggered = await gitHubSyncManager.TriggerRepositoryDispatchAsync(
                owner,
                repositoryName,
                request.EventType,
                payload);

            if (!isTriggered)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "repository_dispatch 요청 처리에 실패했습니다. tracelog를 확인하세요."
                });
            }

            return Ok(new
            {
                success = true,
                message = "repository_dispatch 요청을 전송했습니다.",
                owner,
                repository = repositoryName,
                eventType = request.EventType
            });
        }

        // curl -X POST "http://localhost:8420/api/dispatch/workflow" -H "Content-Type: application/json" -d "{\"workflowId\":\".github/workflows/manual.yml\",\"inputs\":{\"name\":\"erp\"}}"
        [HttpPost("workflow")]
        public async Task<IActionResult> Workflow([FromBody] WorkflowDispatchRequest request)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            string owner = configuration["GitHubRepositoryOwner"] ?? string.Empty;
            string repositoryName = configuration["GitHubRepositoryName"] ?? string.Empty;
            string defaultBranch = configuration["GitHubRepositoryBranch"] ?? "main";
            string gitReference = string.IsNullOrWhiteSpace(request.Ref) ? defaultBranch : request.Ref;

            if (string.IsNullOrWhiteSpace(owner) || string.IsNullOrWhiteSpace(repositoryName))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "GitHubRepositoryOwner 또는 GitHubRepositoryName 설정값이 비어 있습니다."
                });
            }

            object? inputs = null;
            if (request.Inputs.HasValue && request.Inputs.Value.ValueKind != JsonValueKind.Undefined)
            {
                inputs = ConvertJsonElement(request.Inputs.Value);
            }

            var gitHubSyncManager = GitHubSyncManager.CreateFromConfiguration(configuration);
            bool isTriggered = await gitHubSyncManager.TriggerWorkflowDispatchAsync(
                owner,
                repositoryName,
                request.WorkflowId,
                gitReference,
                inputs);

            if (!isTriggered)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "workflow_dispatch 요청 처리에 실패했습니다. workflowId/ref 및 tracelog를 확인하세요."
                });
            }

            return Ok(new
            {
                success = true,
                message = "workflow_dispatch 요청을 전송했습니다.",
                owner,
                repository = repositoryName,
                workflowId = request.WorkflowId,
                @ref = gitReference
            });
        }

        private static object? ConvertJsonElement(JsonElement element)
        {
            switch (element.ValueKind)
            {
                case JsonValueKind.Object:
                    var objectValue = new Dictionary<string, object?>();
                    foreach (JsonProperty property in element.EnumerateObject())
                    {
                        objectValue[property.Name] = ConvertJsonElement(property.Value);
                    }

                    return objectValue;

                case JsonValueKind.Array:
                    var arrayValue = new List<object?>();
                    foreach (JsonElement item in element.EnumerateArray())
                    {
                        arrayValue.Add(ConvertJsonElement(item));
                    }

                    return arrayValue;

                case JsonValueKind.String:
                    return element.GetString();

                case JsonValueKind.Number:
                    if (element.TryGetInt64(out long longValue))
                    {
                        return longValue;
                    }

                    if (element.TryGetDecimal(out decimal decimalValue))
                    {
                        return decimalValue;
                    }

                    return element.GetDouble();

                case JsonValueKind.True:
                    return true;

                case JsonValueKind.False:
                    return false;

                case JsonValueKind.Null:
                case JsonValueKind.Undefined:
                    return null;

                default:
                    return element.GetRawText();
            }
        }
    }

    public sealed class RepositoryDispatchRequest
    {
        [Required]
        public string EventType { get; set; } = string.Empty;

        public JsonElement? ClientPayload { get; set; }
    }

    public sealed class WorkflowDispatchRequest
    {
        [Required]
        public string WorkflowId { get; set; } = "manual.yml";

        public string Ref { get; set; } = string.Empty;

        public JsonElement? Inputs { get; set; }
    }
}
