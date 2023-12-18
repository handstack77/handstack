using System;

namespace HandStack.Core
{
    public class TypeDescription
    {
        public Type TypeObject;
        public object? ClassObject;

        public TypeDescription(Type typeObject, object? classObject)
        {
            TypeObject = typeObject;
            ClassObject = classObject;
        }
    }
}
