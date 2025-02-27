using System;

using Polly.CircuitBreaker;

namespace logger.Entity
{
    public record ApplicationCircuitBreakerPolicy
    {
        public CircuitBreakerPolicy? ApplicationCircuitBreaker;
        public CircuitState ApplicationCircuitState;
        public DateTime? BreakDateTime;
    }
}
