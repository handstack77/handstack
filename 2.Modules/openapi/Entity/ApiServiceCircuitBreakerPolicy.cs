using System;

using Polly.CircuitBreaker;

namespace openapi.Entity
{
    public class ApiServiceCircuitBreakerPolicy
    {
        public CircuitBreakerPolicy? ApplicationCircuitBreaker;
        public CircuitState ApplicationCircuitState;
        public DateTime? BreakDateTime;
    }
}
