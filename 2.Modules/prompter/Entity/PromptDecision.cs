using Newtonsoft.Json.Linq;

namespace prompter.Entity
{
    public sealed record PromptDecision(string StateParameter, JObject Questions);
}
