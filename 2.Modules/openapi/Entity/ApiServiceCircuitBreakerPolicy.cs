using System;

using Polly.CircuitBreaker;

namespace openapi.Entity
{
    public record ApiServiceCircuitBreakerPolicy
    {
        public CircuitBreakerPolicy? ApplicationCircuitBreaker;
        public CircuitState ApplicationCircuitState;
        public DateTime? BreakDateTime;
    }
}
