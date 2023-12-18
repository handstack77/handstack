using System;
using System.Collections;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;
using System.Reflection;

namespace HandStack.Core.ExpendObjects
{
    [Serializable]
    public class Expando : DynamicObject, IDynamicMetaObjectProvider
    {
        private object? instance;
        private Type? instanceType;
        private PropertyInfo[]? instancePropertyInfo;

        public PropertyInfo[]? InstancePropertyInfo
        {
            get
            {
                if (instancePropertyInfo == null && instance != null)
                {
                    instancePropertyInfo = instance.GetType().GetProperties(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly);
                }

                return instancePropertyInfo;
            }
        }

        public Dictionary<string, object?> Properties = new Dictionary<string, object?>();

        public Expando()
        {
            Initialize(this);
        }

        public Expando(object instance)
        {
            Initialize(instance);
        }

        public Expando(IDictionary<string, object> dict)
        {
            var expando = this;

            Initialize(expando);

            Properties = new PropertyBag();

            foreach (var kvp in dict)
            {
                var kvpValue = kvp.Value;
                if (kvpValue is IDictionary<string, object>)
                {
                    var expandoVal = new Expando(kvpValue);
                    expando[kvp.Key] = expandoVal;
                }
                else if (kvp.Value is ICollection)
                {
                    var objList = new List<object>();
                    foreach (var item in (ICollection)kvp.Value)
                    {
                        var itemVals = item as IDictionary<string, object>;
                        if (itemVals != null)
                        {
                            var expandoItem = new Expando(itemVals);
                            objList.Add(expandoItem);
                        }
                        else
                        {
                            objList.Add(item);
                        }
                    }
                    expando[kvp.Key] = objList;
                }
                else
                {
                    expando[kvp.Key] = kvpValue;
                }
            }
        }

        protected void Initialize(object instance)
        {
            this.instance = instance;
            if (instance != null)
            {
                instanceType = instance.GetType();
            }
        }

        public override IEnumerable<string> GetDynamicMemberNames()
        {
            foreach (var prop in GetProperties(true))
            {
                yield return prop.Key;
            }
        }

        public override bool TryGetMember(GetMemberBinder binder, out object? output)
        {
            if (Properties.Keys.Contains(binder.Name))
            {
                output = Properties[binder.Name];
                return true;
            }

            if (instance != null)
            {
                try
                {
                    return GetProperty(instance, binder.Name, out output);
                }
                catch { }
            }

            output = null;
            return false;
        }

        public override bool TrySetMember(SetMemberBinder binder, object? value)
        {
            if (instance != null)
            {
                try
                {
                    bool result = SetProperty(instance, binder.Name, value);
                    if (result == true)
                    {
                        return true;
                    }
                }
                catch
                {
                    return false;
                }
            }

            Properties[binder.Name] = value;
            return true;
        }

#pragma warning disable CS8610
        public override bool TryInvokeMember(InvokeMemberBinder binder, object[] args, out object? output)
#pragma warning restore CS8610
        {
            if (instance != null)
            {
                try
                {
                    if (InvokeMethod(instance, binder.Name, args, out output) == true)
                    {
                        return true;
                    }
                }
                catch { }
            }

            output = null;
            return false;
        }

        protected bool GetProperty(object instance, string name, out object? output)
        {
            if (instance == null)
            {
                instance = this;
            }

            if (instanceType != null)
            {
                var miArray = instanceType.GetMember(name, BindingFlags.Public | BindingFlags.GetProperty | BindingFlags.Instance);
                if (miArray != null && miArray.Length > 0)
                {
                    var mi = miArray[0];
                    if (mi.MemberType == MemberTypes.Property)
                    {
                        output = ((PropertyInfo)mi).GetValue(instance, null);
                        return true;
                    }
                }
            }

            output = null;
            return false;
        }

        protected bool SetProperty(object instance, string name, object? value)
        {
            if (instance == null)
            {
                instance = this;
            }


            if (instanceType != null)
            {
                var miArray = instanceType.GetMember(name, BindingFlags.Public | BindingFlags.SetProperty | BindingFlags.Instance);
                if (miArray != null && miArray.Length > 0)
                {
                    var mi = miArray[0];
                    if (mi.MemberType == MemberTypes.Property)
                    {
                        ((PropertyInfo)mi).SetValue(instance, value, null);
                        return true;
                    }
                }
            }

            return false;
        }

        protected bool InvokeMethod(object instance, string name, object[]? args, out object? output)
        {
            if (instance == null)
            {
                instance = this;
            }

            if (instanceType != null)
            {
                var miArray = instanceType.GetMember(name, BindingFlags.InvokeMethod | BindingFlags.Public | BindingFlags.Instance);

                if (miArray != null && miArray.Length > 0)
                {
                    var mi = miArray[0] as MethodInfo;
                    output = mi?.Invoke(instance, args);
                    return true;
                }
            }

            output = null;
            return false;
        }

        public object? this[string key]
        {
            get
            {
                try
                {
                    return Properties[key];
                }
                catch (KeyNotFoundException)
                {
                    object? result = null;
                    if (instance != null)
                    {
                        if (GetProperty(instance, key, out result) == true)
                        {
                            return result;
                        }
                    }

                    return result;
                }
            }
            set
            {
                if (Properties.ContainsKey(key))
                {
                    Properties[key] = value;
                    return;
                }

                if (instanceType != null)
                {
                    var miArray = instanceType.GetMember(key, BindingFlags.Public | BindingFlags.GetProperty | BindingFlags.Instance);
                    if (miArray != null && miArray.Length > 0)
                    {
                        if (instance != null)
                        {
                            SetProperty(instance, key, value);
                        }
                    }
                    else
                    {
                        Properties[key] = value;
                    }
                }
            }
        }

        public IEnumerable<KeyValuePair<string, object?>> GetProperties(bool includeInstanceProperties = false)
        {
            if (includeInstanceProperties == true && instance != null && InstancePropertyInfo != null)
            {
                foreach (var prop in InstancePropertyInfo)
                {
                    yield return new KeyValuePair<string, object?>(prop.Name, prop.GetValue(instance, null));
                }
            }

            foreach (var key in this.Properties.Keys)
            {
                yield return new KeyValuePair<string, object?>(key, this.Properties[key]);
            }
        }

        public bool Contains(KeyValuePair<string, object> item, bool includeInstanceProperties = false)
        {
            bool isContain = Properties.ContainsKey(item.Key);
            if (isContain == true)
            {
                return true;
            }

            if (includeInstanceProperties == true && instance != null && InstancePropertyInfo != null)
            {
                foreach (var prop in InstancePropertyInfo)
                {
                    if (prop.Name == item.Key)
                    {
                        return true;
                    }
                }
            }

            return false;
        }

        public static Expando ToIndexableExpando(IDictionary<string, object> dict)
        {
            var expando = new Expando();
            foreach (var kvp in dict)
            {
                var kvpValue = kvp.Value as IDictionary<string, object>;
                if (kvpValue != null)
                {
                    var expandoVal = ToIndexableExpando(kvpValue);
                    expando[kvp.Key] = expandoVal;
                }
                else if (kvp.Value is ICollection)
                {
                    var objList = new List<object>();
                    foreach (var item in (ICollection)kvp.Value)
                    {
                        var itemVals = item as IDictionary<string, object>;
                        if (itemVals != null)
                        {
                            var expandoItem = ToIndexableExpando(itemVals);
                            objList.Add(expandoItem);
                        }
                        else
                        {
                            objList.Add(item);
                        }
                    }
                    expando[kvp.Key] = objList;
                }
                else
                {
                    expando[kvp.Key] = kvp.Value;
                }
            }
            return expando;
        }
    }
}
