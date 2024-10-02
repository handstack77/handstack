using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Threading;

namespace HandStack.Web.Extensions
{
    public class ExpiringDictionary<TKey, TValue> : IDictionary<TKey, TValue> where TValue : class
    {
#pragma warning disable CS8714
        private readonly Dictionary<TKey, (TValue Value, DateTime ExpiryTime)> dictionary = new();
#pragma warning restore CS8714
        private readonly TimeSpan defaultExpiryDuration;
        private readonly Timer purgeTimer;
        private readonly object defaultLock = new object();

        public ExpiringDictionary()
        {
            this.defaultExpiryDuration = TimeSpan.FromHours(2);
            purgeTimer = new Timer(RemoveExpiredItems!, null, TimeSpan.FromMinutes(1), TimeSpan.FromMinutes(1));
        }

        public ExpiringDictionary(TimeSpan defaultExpiryDuration, TimeSpan cleanupInterval)
        {
            this.defaultExpiryDuration = defaultExpiryDuration;
            purgeTimer = new Timer(RemoveExpiredItems!, null, cleanupInterval, cleanupInterval);
        }

        public void Add(TKey key, TValue value)
        {
            if (key == null)
            {
                throw new ArgumentNullException(nameof(key), "키는 null일 수 없습니다.");
            }

            lock (defaultLock)
            {
                var expiryTime = DateTime.Now.Add(defaultExpiryDuration);
                dictionary[key] = (value, expiryTime);
            }
        }

        public void Add(TKey key, TValue value, TimeSpan? expiryDuration)
        {
            if (key == null)
            {
                throw new ArgumentNullException(nameof(key), "키는 null일 수 없습니다.");
            }

            lock (defaultLock)
            {
                var expiryTime = DateTime.Now.Add(expiryDuration ?? defaultExpiryDuration);
                dictionary[key] = (value, expiryTime);
            }
        }

#pragma warning disable CS8767
        public bool TryGetValue(TKey key, out TValue? value)
#pragma warning restore CS8767
        {
            lock (defaultLock)
            {
                if (dictionary.TryGetValue(key, out var entry))
                {
                    DateTime now = DateTime.Now;
                    if (entry.ExpiryTime > now)
                    {
                        TimeSpan remainingTime = entry.ExpiryTime - now;
                        if (remainingTime < defaultExpiryDuration)
                        {
                            dictionary[key] = (entry.Value, DateTime.Now.Add(defaultExpiryDuration));
                        }

                        value = entry.Value;
                        return true;
                    }
                    else
                    {
                        dictionary.Remove(key);
                    }
                }

                value = null;
                return false;
            }
        }

        public IEnumerator<KeyValuePair<TKey, TValue>> GetEnumerator()
        {
            lock (defaultLock)
            {
                foreach (var kvp in dictionary)
                {
                    if (kvp.Value.ExpiryTime > DateTime.Now)
                    {
                        yield return new KeyValuePair<TKey, TValue>(kvp.Key, kvp.Value.Value);
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
                var keysToRemove = dictionary
                    .Where(kvp => kvp.Value.ExpiryTime <= now)
                    .Select(kvp => kvp.Key)
                    .ToList();

                foreach (var key in keysToRemove)
                {
                    dictionary.Remove(key);
                }
            }
        }

        public void Add(KeyValuePair<TKey, TValue> item) => Add(item.Key, item.Value);

        public bool ContainsKey(TKey key) => dictionary.ContainsKey(key);

        public ICollection<TKey> Keys => dictionary.Keys;

        public bool Remove(TKey key)
        {
            lock (defaultLock)
            {
                return dictionary.Remove(key);
            }
        }

        public bool Remove(KeyValuePair<TKey, TValue> item) => Remove(item.Key);

        public ICollection<TValue> Values => dictionary.Values.Select(v => v.Value).ToList();

        public TValue this[TKey key]
        {
#pragma warning disable CS8603
            get => TryGetValue(key, out var value) ? value : null;
#pragma warning restore CS8603
            set => Add(key, value);
        }

        public void Clear()
        {
            lock (defaultLock)
            {
                dictionary.Clear();
            }
        }

        public bool Contains(KeyValuePair<TKey, TValue> item) => dictionary.ContainsKey(item.Key);

        public void CopyTo(KeyValuePair<TKey, TValue>[] array, int arrayIndex)
        {
            lock (defaultLock)
            {
                foreach (var kvp in dictionary)
                {
                    if (kvp.Value.ExpiryTime > DateTime.Now)
                    {
                        array[arrayIndex++] = new KeyValuePair<TKey, TValue>(kvp.Key, kvp.Value.Value);
                    }
                }
            }
        }
        public int Count => dictionary.Count;

        public bool IsReadOnly => false;
    }
}
