using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Reflection;
using System.Reflection.Emit;

namespace prompter.Extensions
{
    internal static class TypeBuilderUtils
    {
        private static readonly ConcurrentDictionary<IDictionary<string, Type>, Type> Types = new(new PropertyMapComparer());
        private static readonly object typeCreationLock = new object();

        private static readonly ModuleBuilder ModuleBuilder = AssemblyBuilder
                .DefineDynamicAssembly(new AssemblyName("HandStack.Dynamic.Reflection"), AssemblyBuilderAccess.Run)
                .DefineDynamicModule("HandStack.Dynamic.Reflection.Module");

        public static Type BuildType(IDictionary<string, Type> properties, string? name = null)
        {
            if (Types.TryGetValue(properties, out var type))
            {
                return type;
            }

            lock (typeCreationLock)
            {
                if (Types.TryGetValue(properties, out type))
                {
                    return type;
                }

                // 캐시 키는 복사해 보관하고, 같은 스키마의 타입을 한 번만 생성합니다.
                var snapshot = new Dictionary<string, Type>(properties, StringComparer.Ordinal);
                var typeBuilder = GetTypeBuilder(name ?? Guid.NewGuid().ToString("N"));
                foreach (var property in snapshot)
                {
                    CreateGetSetMethods(typeBuilder, property.Key, property.Value);
                }

                type = typeBuilder.CreateTypeInfo()!.AsType();
                Types.TryAdd(snapshot, type);
                return type;
            }
        }

        private sealed class PropertyMapComparer : IEqualityComparer<IDictionary<string, Type>>
        {
            public bool Equals(IDictionary<string, Type>? left, IDictionary<string, Type>? right)
            {
                if (ReferenceEquals(left, right))
                {
                    return true;
                }
                if (left == null || right == null || left.Count != right.Count)
                {
                    return false;
                }
                foreach (var property in left)
                {
                    if (right.TryGetValue(property.Key, out var type) == false || type != property.Value)
                    {
                        return false;
                    }
                }
                return true;
            }

            public int GetHashCode(IDictionary<string, Type> properties)
            {
                var hash = 0;
                foreach (var property in properties)
                {
                    hash = unchecked(hash + HashCode.Combine(StringComparer.Ordinal.GetHashCode(property.Key), property.Value));
                }
                return hash;
            }
        }

        private static TypeBuilder GetTypeBuilder(string name)
        {
            return ModuleBuilder.DefineType(name,
                TypeAttributes.Public |
                TypeAttributes.Class |
                TypeAttributes.AutoClass |
                TypeAttributes.AnsiClass |
                TypeAttributes.BeforeFieldInit |
                TypeAttributes.AutoLayout,
                null);
        }

        private static void CreateGetSetMethods(TypeBuilder typeBuilder, string propertyName, Type propertyType)
        {
            var fieldBuilder = typeBuilder.DefineField("_" + propertyName, propertyType, FieldAttributes.Private);

            var propertyBuilder = typeBuilder.DefineProperty(propertyName, PropertyAttributes.HasDefault, propertyType, null);

            var getPropertyMethodBuilder = typeBuilder.DefineMethod("get_" + propertyName, MethodAttributes.Public | MethodAttributes.SpecialName | MethodAttributes.HideBySig, propertyType, Type.EmptyTypes);
            var getIl = getPropertyMethodBuilder.GetILGenerator();

            getIl.Emit(OpCodes.Ldarg_0);
            getIl.Emit(OpCodes.Ldfld, fieldBuilder);
            getIl.Emit(OpCodes.Ret);

            var setPropertyMethodBuilder = typeBuilder.DefineMethod("set_" + propertyName, MethodAttributes.Public | MethodAttributes.SpecialName | MethodAttributes.HideBySig, null, new[] { propertyType });
            var setIl = setPropertyMethodBuilder.GetILGenerator();
            var modifyProperty = setIl.DefineLabel();

            var exitSet = setIl.DefineLabel();

            setIl.MarkLabel(modifyProperty);
            setIl.Emit(OpCodes.Ldarg_0);
            setIl.Emit(OpCodes.Ldarg_1);
            setIl.Emit(OpCodes.Stfld, fieldBuilder);

            setIl.Emit(OpCodes.Nop);
            setIl.MarkLabel(exitSet);
            setIl.Emit(OpCodes.Ret);

            propertyBuilder.SetGetMethod(getPropertyMethodBuilder);
            propertyBuilder.SetSetMethod(setPropertyMethodBuilder);
        }
    }
}
