using System;

namespace HandStack.Core
{
    public class TypeDescription(Type typeObject, object? classObject)
    {
        public Type TypeObject = typeObject;
        public object? ClassObject = classObject;
    }
}
