using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Xml.Serialization;

namespace HandStack.Core
{
    public class Reflector
    {
        public static Dictionary<string, Assembly> assemblyList = new Dictionary<string, Assembly>();
        public static Dictionary<string, TypeDescription> typeList = new Dictionary<string, TypeDescription>();
        public const BindingFlags memberAccess = BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Static | BindingFlags.Instance | BindingFlags.IgnoreCase;
        public const BindingFlags memberPublicInstanceAccess = BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase;

        public List<string> GetTraceMethods()
        {
            List<string> traceMethods = new List<string>();

            StackTrace stackTrace = new StackTrace(true);
            StackFrame[] stackFrames = stackTrace.GetFrames();

            foreach (StackFrame stackFrame in stackFrames)
            {
                var methodBase = stackFrame.GetMethod();
                if (methodBase != null)
                {
                    traceMethods.Add(methodBase.Name);
                }
            }

            return traceMethods;
        }

        public static object? CreateInstance(string typeName)
        {
            Type? type = FindType(typeName);

            if (type != null)
            {
                return type.Assembly.CreateInstance(typeName, true);
            }

            return null;
        }

        public static object? CreateInstance(Assembly targetAssembly, string typeName)
        {
            Type? type = null;
            foreach (Type? eachType in targetAssembly.GetTypes())
            {
                if (eachType != null && eachType.FullName != null && eachType.FullName.Equals(typeName, StringComparison.OrdinalIgnoreCase))
                {
                    type = eachType;
                    break;
                }
            }

            if (type != null)
            {
                return type.Assembly.CreateInstance(typeName, true);
            }

            return null;
        }

        public static string? GetAssemblyDirectory(Assembly targetAssembly)
        {
            return Path.GetDirectoryName(targetAssembly.Location);
        }

        public static Type? FindType(string typeName)
        {
            foreach (Assembly targetAssembly in AppDomain.CurrentDomain.GetAssemblies())
            {
                foreach (Type? type in targetAssembly.GetTypes())
                {
                    if (type != null && type.FullName != null && type.FullName.Equals(typeName, StringComparison.OrdinalIgnoreCase))
                    {
                        return type;
                    }
                }
            }

            return null;
        }

        public static Type? FindType(Assembly targetAssembly, string typeName)
        {
            foreach (Type type in targetAssembly.GetTypes())
            {
                if (type != null && type.FullName != null && type.FullName.Equals(typeName, StringComparison.OrdinalIgnoreCase))
                {
                    return type;
                }
            }

            return null;
        }

        public static Assembly LoadAssembly(string assemblyFile, string assemblyKey)
        {
            Assembly targetAssembly;
            if (assemblyList.ContainsKey(assemblyKey) == false)
            {
                try
                {
                    targetAssembly = Assembly.LoadFrom(assemblyFile);
                    assemblyList.Add(assemblyKey, targetAssembly);

                    return targetAssembly;
                }
                catch (Exception exception)
                {
                    throw new Exception("어셈블리 정보를 찾을 수 없습니다 " + exception.Message);
                }
            }

            return assemblyList[assemblyKey] as Assembly;
        }

        public static TypeDescription LoadClassType(string assemblyFile, string assemblyKey, string className, string classKey)
        {
            if (typeList.ContainsKey(classKey) == false)
            {
                Assembly targetAssembly = LoadAssembly(assemblyFile, assemblyKey);

                foreach (Type type in targetAssembly.GetTypes())
                {
                    if (type != null && type.FullName != null)
                    {
                        if (type.IsClass == true && type.FullName.EndsWith(className, StringComparison.CurrentCultureIgnoreCase))
                        {
                            TypeDescription typeDescription = new TypeDescription(type, Activator.CreateInstance(type));
                            typeList.Add(classKey, typeDescription);

                            return typeDescription;
                        }
                    }
                }

                throw (new Exception("클래스의 인스턴스 정보를 확인 필요"));
            }

            return typeList[classKey];
        }

        public static TypeDescription LoadClassType(Assembly loadAssembly, string className, string classKey)
        {
            if (typeList.ContainsKey(classKey) == false)
            {
                foreach (Type type in loadAssembly.GetTypes())
                {
                    if (type != null && type.FullName != null && type.IsClass == true)
                    {
                        if (type.FullName.EndsWith(className, StringComparison.CurrentCultureIgnoreCase))
                        {
                            TypeDescription typeDescription = new TypeDescription(type, Activator.CreateInstance(type));
                            typeList.Add(classKey, typeDescription);
                            return (typeDescription);
                        }
                    }
                }

                throw (new Exception("클래스의 인스턴스 정보를 확인 필요"));
            }

            return typeList[classKey];
        }

        public static TypeDescription LoadClassType(string className, string classKey)
        {
            if (typeList.ContainsKey(classKey) == false)
            {
                Assembly targetAssembly = Assembly.GetExecutingAssembly();

                foreach (Type type in targetAssembly.GetTypes())
                {
                    if (type != null && type.FullName != null && type.IsClass == true)
                    {
                        if (type.FullName.EndsWith(className, StringComparison.CurrentCultureIgnoreCase))
                        {
                            TypeDescription typeDescription = new TypeDescription(type, Activator.CreateInstance(type));
                            typeList.Add(classKey, typeDescription);

                            return typeDescription;
                        }
                    }
                }

                throw new Exception("클래스의 인스턴스 정보를 확인 필요");
            }

            return typeList[classKey];
        }

        public static object? GetMethod(object instance, string methodName)
        {
            return instance?.GetType()?.GetMethod(methodName, memberAccess);
        }

        public static object? GetProperty(object instance, string propertyName)
        {
            return instance?.GetType()?.GetProperty(propertyName, memberAccess)?.GetValue(instance, null);
        }

        public static void SetProperty(object instance, string propertyName, object value)
        {
            instance?.GetType()?.GetProperty(propertyName, memberAccess)?.SetValue(instance, value, null);
        }

        public static void SetField(object instance, string property, object? value)
        {
            instance?.GetType()?.GetField(property, memberAccess)?.SetValue(instance, value);
        }

        public static object? GetField(object instance, string propertyName)
        {
            return instance?.GetType()?.GetField(propertyName, memberAccess)?.GetValue(instance);
        }

        private static object? GetPropertyInternal(object instance, string propertyName)
        {
            if (propertyName == "this")
            {
                return instance;
            }

            object? result;
            string pureProperty = propertyName;
            string? indexes = null;
            bool isCollection = false;

            if (propertyName.IndexOf("[") > -1)
            {
                pureProperty = propertyName.Substring(0, propertyName.IndexOf("["));
                indexes = propertyName.Substring(propertyName.IndexOf("["));
                isCollection = true;
            }

            MemberInfo member = instance.GetType().GetMember(pureProperty, memberAccess)[0];

            if (member.MemberType == MemberTypes.Property)
            {
                result = ((PropertyInfo)member).GetValue(instance, null);
            }
            else
            {
                result = ((FieldInfo)member).GetValue(instance);
            }

            if (isCollection)
            {
                indexes = indexes?.Replace("[", "").Replace("]", "");

                if (indexes == null)
                {
                    result = null;
                }
                else
                {
                    int index;
                    if (result is Array)
                    {
                        if (int.TryParse(indexes, out index) == true)
                        {
                            result = CallMethod(result, "GetValue", index);
                        }
                    }
                    else if (result is ICollection)
                    {
                        if (indexes.StartsWith("\""))
                        {
                            indexes = indexes.Trim('\"');
                            result = CallMethod(result, "get_Item", indexes);
                        }
                        else
                        {
                            if (int.TryParse(indexes, out index) == true)
                            {
                                result = CallMethod(result, "get_Item", index);
                            }
                        }
                    }
                }
            }

            return result;
        }

        private static object? SetPropertyInternal(object instance, string propertyName, object value)
        {
            if (propertyName == "this")
            {
                return instance;
            }

            object? result;
            string pureProperty = propertyName;
            string? indexes = null;
            bool isCollection = false;

            if (propertyName.IndexOf("[") > -1)
            {
                pureProperty = propertyName.Substring(0, propertyName.IndexOf("["));
                indexes = propertyName.Substring(propertyName.IndexOf("["));
                isCollection = true;
            }

            if (isCollection == false)
            {
                MemberInfo member = instance.GetType().GetMember(pureProperty, memberAccess)[0];

                if (member.MemberType == MemberTypes.Property)
                {
                    ((PropertyInfo)member).SetValue(instance, value, null);
                }
                else
                {
                    ((FieldInfo)member).SetValue(instance, value);
                }

                return null;
            }
            else
            {
                MemberInfo member = instance.GetType().GetMember(pureProperty, memberAccess)[0];

                if (member.MemberType == MemberTypes.Property)
                {
                    result = ((PropertyInfo)member).GetValue(instance, null);
                }
                else
                {
                    result = ((FieldInfo)member).GetValue(instance);
                }
            }

            if (isCollection)
            {
                indexes = indexes?.Replace("[", "").Replace("]", "");
                int index;

                if (result is Array)
                {
                    if (int.TryParse(indexes, out index) == true)
                    {
                        result = CallMethod(result, "SetValue", value, index);
                    }
                }
                else if (result is ICollection)
                {
                    if (indexes == null)
                    {
                        result = null;
                    }
                    else
                    {
                        if (indexes.StartsWith("\""))
                        {
                            indexes = indexes.Trim('\"');
                            result = CallMethod(result, "set_Item", indexes, value);
                        }
                        else
                        {

                            if (int.TryParse(indexes, out index) == true)
                            {
                                result = CallMethod(result, "set_Item", index, value);
                            }
                        }
                    }
                }
            }

            return result;
        }

        public static object? GetPropertyEx(object? instance, string propertyName)
        {
            if (instance == null)
            {
                return null;
            }

            int indexes = propertyName.IndexOf(".");
            if (indexes < 0)
            {
                return GetPropertyInternal(instance, propertyName);
            }

            string main = propertyName.Substring(0, indexes);
            string subs = propertyName.Substring(indexes + 1);

            object? sub = GetPropertyInternal(instance, main);

            return GetPropertyEx(sub, subs);
        }

        public static object? SetPropertyEx(object instance, string propertyName, object value)
        {
            int indexes = propertyName.IndexOf(".");

            if (indexes < 0)
            {
                SetPropertyInternal(instance, propertyName, value);
                return null;
            }

            string main = propertyName.Substring(0, indexes);
            string subs = propertyName.Substring(indexes + 1);

            object? sub = GetPropertyInternal(instance, main);
            if (sub != null)
            {
                SetPropertyEx(sub, subs, value);
            }

            return null;
        }

        public static object? CallMethod(object instance, string methodName, Type[]? parameterTypes, params object[]? methodParameters)
        {
            if (parameterTypes == null)
            {
                if (methodParameters != null && methodParameters.Any() == true)
                {
                    return instance.GetType().GetMethod(methodName, memberAccess | BindingFlags.InvokeMethod)?.Invoke(instance, methodParameters);
                }
                else
                {
                    return instance.GetType().GetMethod(methodName, memberAccess | BindingFlags.InvokeMethod)?.Invoke(instance, null);
                }
            }
            else
            {
                return instance.GetType().GetMethod(methodName, memberAccess | BindingFlags.InvokeMethod, null, parameterTypes, null)?.Invoke(instance, methodParameters);
            }
        }

        public static object? CallMethod(object instance, string methodName, params object[]? methodParameters)
        {
            Type[]? parameterTypes = Array.Empty<Type>();
            if (methodParameters != null)
            {
                parameterTypes = new Type[methodParameters.Length];
                for (int i = 0; i < methodParameters.Length; i++)
                {
                    if (methodParameters[i] == null)
                    {
                        parameterTypes = null;
                        break;
                    }

                    parameterTypes[i] = methodParameters[i].GetType();
                }
            }

            return CallMethod(instance, methodName, parameterTypes, methodParameters);
        }

        public static object? CallMethodEx(object instance, string methodName, params object[] methodParameters)
        {
            int indexes = methodName.IndexOf(".");
            if (indexes < 0)
            {
                return CallMethod(instance, methodName, methodParameters);
            }

            string main = methodName.Substring(0, indexes);
            string subs = methodName.Substring(indexes + 1);

            object? sub = GetPropertyInternal(instance, main);
            if (sub == null)
            {
                return null;
            }
            else
            {
                return CallMethodEx(sub, subs, methodParameters);
            }
        }

        public static object? CreateInstanceFromType(Type typeToCreate, params object[] arguments)
        {
            if (arguments == null)
            {
                Type[] Params = Type.EmptyTypes;
                return typeToCreate.GetConstructor(Params)?.Invoke(null);
            }

            return Activator.CreateInstance(typeToCreate, arguments);
        }

        public static object? CreateInstanceFromString(string typeName, params object[] arguments)
        {
            object? result;
            Type? type;

            type = GetTypeFromName(typeName);
            if (type == null)
            {
                return null;
            }

            result = Activator.CreateInstance(type, arguments);
            return result;
        }

        public static Type? GetTypeFromName(string typeName)
        {
            Type? type = null;

            foreach (Assembly assembly in AppDomain.CurrentDomain.GetAssemblies())
            {
                type = assembly.GetType(typeName, false);

                if (type != null)
                {
                    break;
                }
            }

            return type;
        }

        public static string? TypedValueToString(object rawValue, CultureInfo culture)
        {
            Type type = rawValue.GetType();
            string? result;

            if (type == typeof(string))
            {
                result = rawValue.ToString();
            }
            else if (type == typeof(int) || type == typeof(decimal) || type == typeof(double) || type == typeof(float))
            {
                result = string.Format(culture.NumberFormat, "{0}", rawValue);
            }
            else if (type == typeof(DateTime))
            {
                result = string.Format(culture.DateTimeFormat, "{0}", rawValue);
            }
            else if (type == typeof(bool))
            {
                result = rawValue.ToString();
            }
            else if (type == typeof(byte))
            {
                result = rawValue.ToString();
            }
            else if (type.IsEnum)
            {
                result = rawValue.ToString();
            }
            else if (type == typeof(Guid?))
            {
                if (rawValue == null)
                {
                    result = "";
                }
                else
                {
                    return rawValue.ToString();
                }
            }
            else
            {
                TypeConverter converter = TypeDescriptor.GetConverter(type);

                if (converter != null && converter.CanConvertTo(typeof(string)))
                {
                    result = converter.ConvertToString(null, culture, rawValue);
                }
                else
                {
                    result = rawValue.ToString();
                }
            }

            return result;
        }

        public static string? TypedValueToString(object rawValue)
        {
            return TypedValueToString(rawValue, CultureInfo.CurrentCulture);
        }

        public static object? StringToTypedValue(string value, Type targetType, CultureInfo culture)
        {
            object? result = null;
            bool isEmpty = false;

            if (string.IsNullOrEmpty(value) == true)
            {
                isEmpty = true;
            }

            if (targetType == typeof(string))
            {
                result = value;
            }
            else if (targetType == typeof(int) || targetType == typeof(int))
            {
                if (isEmpty == true)
                {
                    result = 0;
                }
                else
                {
                    result = int.Parse(value, NumberStyles.Any, culture.NumberFormat);
                }
            }
            else if (targetType == typeof(long))
            {
                if (isEmpty == true)
                {
                    result = (long)0;
                }
                else
                {
                    result = long.Parse(value, NumberStyles.Any, culture.NumberFormat);
                }
            }
            else if (targetType == typeof(short))
            {
                if (isEmpty == true)
                {
                    result = (short)0;
                }
                else
                {
                    result = short.Parse(value, NumberStyles.Any, culture.NumberFormat);
                }
            }
            else if (targetType == typeof(decimal))
            {
                if (isEmpty == true)
                {
                    result = 0M;
                }
                else
                {
                    result = decimal.Parse(value, NumberStyles.Any, culture.NumberFormat);
                }
            }
            else if (targetType == typeof(DateTime))
            {
                if (isEmpty == true)
                {
                    result = DateTime.MinValue;
                }
                else
                {
                    result = Convert.ToDateTime(value, culture.DateTimeFormat);
                }
            }
            else if (targetType == typeof(byte))
            {
                if (isEmpty == true)
                {
                    result = 0;
                }
                else
                {
                    result = Convert.ToByte(value);
                }
            }
            else if (targetType == typeof(double))
            {
                if (isEmpty == true)
                {
                    result = 0F;
                }
                else
                {
                    result = double.Parse(value, NumberStyles.Any, culture.NumberFormat);
                }
            }
            else if (targetType == typeof(float))
            {
                if (isEmpty == true)
                {
                    result = 0F;
                }
                else
                {
                    result = float.Parse(value, NumberStyles.Any, culture.NumberFormat);
                }
            }
            else if (targetType == typeof(bool))
            {
                if (isEmpty == false && (value.ToLower() == "true" || value.ToLower() == "on" || value == "1" || value == "Y"))
                {
                    result = true;
                }
                else
                {
                    result = false;
                }
            }
            else if (targetType == typeof(Guid))
            {
                if (isEmpty == true)
                {
                    result = Guid.Empty;
                }
                else
                {
                    result = new Guid(value);
                }
            }
            else if (targetType.IsEnum)
            {
                result = Enum.Parse(targetType, value);
            }
            else if (targetType == typeof(byte[]))
            {
                result = null;
            }
            else if (targetType.Name.StartsWith("Nullable"))
            {
                if (value.ToLower() == "null" || value == "")
                {
                    result = null;
                }
                else
                {
                    var targetNullableType = Nullable.GetUnderlyingType(targetType);
                    if (targetNullableType != null)
                    {
                        result = StringToTypedValue(value, targetType);
                    }
                    else
                    {
                        result = null;
                    }
                }
            }
            else
            {
                TypeConverter converter = TypeDescriptor.GetConverter(targetType);

                if (converter != null && converter.CanConvertFrom(typeof(string)))
                {
                    result = converter.ConvertFromString(null, culture, value);
                }
            }

            return result;
        }

        public static object? StringToTypedValue(string value, Type targetType)
        {
            return StringToTypedValue(value, targetType, CultureInfo.CurrentCulture);
        }

        public static T? StringToTypedValue<T>(string value, CultureInfo culture)
        {
            return (T?)StringToTypedValue(value, typeof(T), culture);
        }

        public static T? StringToTypedValue<T>(string value)
        {
            return (T?)StringToTypedValue(value, typeof(T), CultureInfo.CurrentCulture);
        }

        public static Dictionary<string, string> GetEnumList(Type instance)
        {
            string[] enumStrings = Enum.GetNames(instance);

            Dictionary<string, string> enumList = new Dictionary<string, string>();

            foreach (string enumString in enumStrings)
            {
                enumList.Add(enumString, enumString);
            }

            return enumList;
        }

        public static void Serialize<T>(T sourceType, string fileName)
        {
            XmlSerializer serializer = new XmlSerializer(typeof(T));
            using (Stream writeStream = new FileStream(fileName, FileMode.Create, FileAccess.Write, FileShare.None))
            {
                serializer.Serialize(writeStream, sourceType);
            }
        }

        public static string? Serialize<T>(T sourceType)
        {
            string? result = null;
            using (StringWriter writer = new StringWriter())
            {
                XmlSerializer serializer = new XmlSerializer(typeof(T));
                serializer.Serialize(writer, sourceType);
                result = writer.ToString();
            }

            return result;
        }

        public static T? DeSerializeXml<T>(string xml)
        {
            T? result = default(T);
            if (string.IsNullOrEmpty(xml) == true)
            {
                return default(T);
            }

            using (StringReader reader = new StringReader(xml))
            {
                XmlSerializer serializer = new XmlSerializer(typeof(T));
                result = (T?)serializer.Deserialize(reader);
            }

            return result;
        }

        public static T? Deserialize<T>(string fileName) where T : class, new()
        {
            T? result = null;
            FileInfo settingFile = new FileInfo(fileName);
            if (settingFile.Exists == false)
            {
                return new T();
            }

            XmlSerializer serializer = new XmlSerializer(typeof(T));
            using (Stream readStream = new FileStream(fileName, FileMode.Open, FileAccess.Read, FileShare.None))
            {
                result = serializer.Deserialize(readStream) as T;
            }

            return result;
        }

        public static string? JsonSerialize<T>(T sourceType)
        {
            string? result = null;
            if (sourceType == null)
            {
                return result;
            }

            DataContractJsonSerializer serializer = new DataContractJsonSerializer(sourceType.GetType());
            using (MemoryStream ms = new MemoryStream())
            {
                serializer.WriteObject(ms, sourceType);
                result = Encoding.Default.GetString(ms.ToArray());
            }

            return result;
        }

        public static T? JsonDeserialize<T>(string json)
        {
            T? result = Activator.CreateInstance<T>();
            if (result != null)
            {
                using (MemoryStream ms = new MemoryStream(Encoding.Unicode.GetBytes(json)))
                {
                    DataContractJsonSerializer serializer = new DataContractJsonSerializer(result.GetType());
                    result = (T?)serializer.ReadObject(ms);
                }
            }

            return result;
        }

        public static void CopyTo<T>(T sourceType, T targetType)
        {
            CopyTo(sourceType, targetType, memberAccess);
        }

        public static void CopyTo<T>(T sourceType, T targetType, BindingFlags memberAccessFlags)
        {
            CopyTo(sourceType, targetType, "", memberAccessFlags);
        }

        public static void CopyTo<T>(T sourceType, T targetType, string excludedProperties = "")
        {
            CopyTo(sourceType, targetType, excludedProperties, memberAccess);
        }

        public static void CopyTo<T>(T sourceType, T targetType, string excludedProperties, BindingFlags memberAccessFlags)
        {
            if (sourceType == null || targetType == null)
            {
                return;
            }

            string[] excluded = Array.Empty<string>();
            if (excludedProperties.Length > 0)
            {
                excluded = excludedProperties.Split(new char[1] { ',' }, StringSplitOptions.RemoveEmptyEntries);
            }

            MemberInfo[] memberInfoType = targetType.GetType().GetMembers(memberAccessFlags);
            foreach (MemberInfo memberInfo in memberInfoType)
            {
                string FieldName = memberInfo.Name;
                if (excludedProperties.Length > 0 && excluded.Contains(FieldName))
                {
                    continue;
                }

                if (memberInfo.MemberType == MemberTypes.Field)
                {
                    FieldInfo? sourceField = sourceType.GetType().GetField(FieldName);

                    if (sourceField == null)
                    {
                        continue;
                    }

                    object? SourceValue = sourceField.GetValue(sourceType);

                    ((FieldInfo)memberInfo).SetValue(targetType, SourceValue);
                }
                else if (memberInfo.MemberType == MemberTypes.Property)
                {
                    PropertyInfo? targetProperty = memberInfo as PropertyInfo;
                    PropertyInfo? sourceProperty = sourceType.GetType().GetProperty(FieldName, memberAccessFlags);

                    if (sourceProperty == null || targetProperty == null)
                    {
                        continue;
                    }

                    if (targetProperty.CanWrite && sourceProperty.CanRead)
                    {
                        object? SourceValue = sourceProperty.GetValue(sourceType, null);
                        targetProperty.SetValue(targetType, SourceValue, null);
                    }
                }
            }
        }

        public static void CopyTo<S, T>(S sourceType, T targetType)
        {
            if (sourceType == null || targetType == null)
            {
                return;
            }

            MemberInfo[] members = sourceType.GetType().GetMembers(memberAccess);

            var queryResults = from m in members.AsParallel() where m.MemberType == MemberTypes.Field select m;

            foreach (MemberInfo member in queryResults)
            {
                try
                {
                    SetField(targetType, member.Name, GetField(sourceType, member.Name));
                }
                catch
                {
                    continue;
                }
            }
        }
    }
}
