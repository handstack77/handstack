using System.ComponentModel;

using Microsoft.SemanticKernel;

namespace prompter.KernelPlugin
{
    public sealed class MathPlugin
    {
        [KernelFunction, Description("Adds an amount to a value")]
        [return: Description("The sum")]
        public int Add(
            [Description("The value to add")] int value,
            [Description("Amount to add")] int amount) =>
            value + amount;

        [KernelFunction, Description("Subtracts an amount from a value")]
        [return: Description("The difference")]
        public int Subtract(
            [Description("The value to subtract")] int value,
            [Description("Amount to subtract")] int amount) =>
            value - amount;
    }
}
