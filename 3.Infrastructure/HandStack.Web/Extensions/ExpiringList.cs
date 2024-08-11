using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Threading;

namespace HandStack.Web.Extensions
{
    public class ExpiringList<T> : IList<T> where T : class
    {
        private readonly List<(T Value, DateTime ExpiryTime)> list = new();
        private readonly TimeSpan defaultExpiryDuration;
        private readonly Timer purgeTimer;
        private readonly object defaultLock = new object();

        public ExpiringList()
        {
            this.defaultExpiryDuration = TimeSpan.FromMinutes(20);
            purgeTimer = new Timer(RemoveExpiredItems!, null, TimeSpan.FromMinutes(10), TimeSpan.FromMinutes(10));
        }

        public ExpiringList(TimeSpan defaultExpiryDuration, TimeSpan cleanupInterval)
        {
            this.defaultExpiryDuration = defaultExpiryDuration;
            purgeTimer = new Timer(RemoveExpiredItems!, null, cleanupInterval, cleanupInterval);
        }

        public void Add(T item)
        {
            lock (defaultLock)
            {
                var expiryTime = DateTime.Now.Add(defaultExpiryDuration);
                list.Add((item, expiryTime));
            }
        }

        public void Add(T item, TimeSpan? expiryDuration)
        {
            lock (defaultLock)
            {
                var expiryTime = DateTime.Now.Add(expiryDuration ?? defaultExpiryDuration);
                list.Add((item, expiryTime));
            }
        }

        public bool TryGetValue(int index, out T? value)
        {
            lock (defaultLock)
            {
                if (index >= 0 && index < list.Count)
                {
                    var entry = list[index];
                    DateTime now = DateTime.Now;
                    if (entry.ExpiryTime > now)
                    {
                        TimeSpan remainingTime = entry.ExpiryTime - now;
                        if (remainingTime < defaultExpiryDuration)
                        {
                            list[index] = (entry.Value, DateTime.Now.Add(defaultExpiryDuration));
                        }

                        value = entry.Value;
                        return true;
                    }
                    else
                    {
                        list.RemoveAt(index);
                    }
                }

                value = null;
                return false;
            }
        }

        public IEnumerator<T> GetEnumerator()
        {
            lock (defaultLock)
            {
                foreach (var entry in list)
                {
                    if (entry.ExpiryTime > DateTime.Now)
                    {
                        yield return entry.Value;
                    }
                }
            }
        }

        IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();

        private void RemoveExpiredItems(object state)
        {
            lock (defaultLock)
            {
                var now = DateTime.Now;
                list.RemoveAll(entry => entry.ExpiryTime <= now);
            }
        }

        public int Count
        {
            get
            {
                lock (defaultLock)
                {
                    return list.Count(entry => entry.ExpiryTime > DateTime.Now);
                }
            }
        }

        public bool IsReadOnly => false;

        public T this[int index]
        {
            get
            {
#pragma warning disable CS8603
                if (TryGetValue(index, out var value) == true)
                {
                    return value;
                }
                return null;
#pragma warning restore CS8603
            }
            set => Add(value);
        }

        public void Clear()
        {
            lock (defaultLock)
            {
                list.Clear();
            }
        }

        public bool Contains(T item)
        {
            lock (defaultLock)
            {
                return list.Any(entry => entry.Value == item && entry.ExpiryTime > DateTime.Now);
            }
        }

        public void CopyTo(T[] array, int arrayIndex)
        {
            lock (defaultLock)
            {
                foreach (var entry in list)
                {
                    if (entry.ExpiryTime > DateTime.Now)
                    {
                        array[arrayIndex++] = entry.Value;
                    }
                }
            }
        }

        public int IndexOf(T item)
        {
            lock (defaultLock)
            {
                for (int i = 0; i < list.Count; i++)
                {
                    if (list[i].Value == item)
                    {
                        return i;
                    }
                }
                return -1;
            }
        }

        public void Insert(int index, T item)
        {
            lock (defaultLock)
            {
                var expiryTime = DateTime.Now.Add(defaultExpiryDuration);
                list.Insert(index, (item, expiryTime));
            }
        }

        public bool Remove(T item)
        {
            lock (defaultLock)
            {
                var index = IndexOf(item);
                if (index >= 0)
                {
                    list.RemoveAt(index);
                    return true;
                }
                return false;
            }
        }

        public void RemoveAt(int index)
        {
            lock (defaultLock)
            {
                if (index >= 0 && index < list.Count)
                {
                    list.RemoveAt(index);
                }
            }
        }

        public void ExtendExpiryTime(DateTime dateTime)
        {
            lock (defaultLock)
            {
                for (int i = 0; i < list.Count; i++)
                {
                    var entry = list[i];
                    list[i] = (entry.Value, dateTime);
                }
            }
        }
    }
}
