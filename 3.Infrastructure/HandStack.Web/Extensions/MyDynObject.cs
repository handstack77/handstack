using System;
using System.Collections.Generic;
using System.Dynamic;

namespace HandStack.Web.Extensions
{
    /// <code>
    /// var dyn = GetDynamicObject(new Dictionary<string, object>()
    /// {
    ///     {"prop1", 12},
    /// });
    /// 
    /// Console.WriteLine(dyn.prop1);
    /// </code>
    public sealed class MyDynObject(Dictionary<string, object?> properties) : DynamicObject
    {
        private readonly Dictionary<string, object?> properties = properties;

        public override IEnumerable<string> GetDynamicMemberNames()
        {
            return properties.Keys;
        }

        public override bool TryGetMember(GetMemberBinder binder, out object? result)
        {
            ArgumentNullException.ThrowIfNull(binder);

            if (properties.ContainsKey(binder.Name) == true)
            {
                result = properties[binder.Name];
                return true;
            }
            else
            {
                result = null;
                return false;
            }
        }

        public override bool TrySetMember(SetMemberBinder binder, object? value)
        {
            ArgumentNullException.ThrowIfNull(binder);

            if (properties.ContainsKey(binder.Name) == true)
            {
                properties[binder.Name] = value;
                return true;
            }
            else
            {
                return false;
            }
        }
    }
}
