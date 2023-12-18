using System;

using Polly.CircuitBreaker;

namespace logger.Entity
{
    public class ApplicationCircuitBreakerPolicy
    {
        public CircuitBreakerPolicy? ApplicationCircuitBreaker;
        public CircuitState ApplicationCircuitState;
        public DateTime? BreakDateTime;
    }
}
