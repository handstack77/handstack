using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Data.SqlTypes;
using System.Linq;
using System.Security;
using System.Security.Cryptography;
using System.Text;
using System.Threading;

namespace HandStack.Core.Extensions
{
    public static class SequentialGuidExtensions
    {
        private static readonly IReadOnlyDictionary<byte, byte> ToSqlGuidMap;
        private static readonly IReadOnlyDictionary<byte, byte> ToGuidMap;

        static SequentialGuidExtensions()
        {
            ToGuidMap = new ReadOnlyDictionary<byte, byte>(
                new Dictionary<byte, byte>
                {
                {0, 13},
                {1, 12},
                {2, 11},
                {3, 10},
                {4, 15},
                {5, 14},
                {6, 9},
                {7, 8},
                {8, 6},
                {9, 7},
                {10, 4},
                {11, 5},
                {12, 0},
                {13, 1},
                {14, 2},
                {15, 3}
                });

            ToSqlGuidMap =
                new ReadOnlyDictionary<byte, byte>(
                    ToGuidMap.ToDictionary(d => d.Value, d => d.Key));
        }

        private static DateTime ToDateTime(this long ticks) => new(ticks, DateTimeKind.Utc);

        public static DateTime? ToDateTime(this Guid guid)
        {
            var ticks = guid.ToTicks();
            if (ticks.IsDateTime())
            {
                return ticks.ToDateTime();
            }

            ticks = new SqlGuid(guid).ToGuid().ToTicks();
            return ticks.IsDateTime() ? ticks.ToDateTime() : default(DateTime?);
        }

        public static DateTime? ToDateTime(this SqlGuid sqlGuid) => sqlGuid.ToGuid().ToDateTime();

        public static Guid ToGuid(this SqlGuid sqlGuid)
        {
            var bytes = sqlGuid.ToByteArray();
            if (bytes == null)
            {
                return Guid.NewGuid();
            }

            return new(Enumerable.Range(0, 16)
                .Select(e => bytes[ToGuidMap[(byte)e]])
                .ToArray());
        }

        public static SqlGuid ToSqlGuid(this Guid guid)
        {
            var bytes = guid.ToByteArray();
            return new(Enumerable.Range(0, 16).Select(e => bytes[ToSqlGuidMap[(byte)e]]).ToArray());
        }

        internal static bool IsDateTime(this long ticks) => ticks <= DateTime.UtcNow.Ticks && ticks >= DateTime.UnixEpoch.Ticks;

        private static long ToTicks(this Guid guid)
        {
            var bytes = guid.ToByteArray();
            return
                ((long)bytes[3] << 56) +
                ((long)bytes[2] << 48) +
                ((long)bytes[1] << 40) +
                ((long)bytes[0] << 32) +
                ((long)bytes[5] << 24) +
                (bytes[4] << 16) +
                (bytes[7] << 8) +
                bytes[6];
        }
    }

    public sealed class SequentialGuidGenerator : SequentialGuidGeneratorBase<SequentialGuidGenerator>
    {
        private SequentialGuidGenerator() { }
    }

    public abstract class SequentialGuidGeneratorBase<T> where T : SequentialGuidGeneratorBase<T>
    {
#pragma warning disable CS8603
        private static readonly Lazy<T> Lazy = new(() => Activator.CreateInstance(typeof(T), true) as T);
#pragma warning restore CS8603

        private readonly byte[] _machinePid;
        private int _increment;

        protected SequentialGuidGeneratorBase()
        {
            _increment = new Random().Next(500000);
            _machinePid = new byte[5];
            using (var algorithm = MD5.Create())
            {
                var hash = algorithm.ComputeHash(Encoding.UTF8.GetBytes(Environment.MachineName));
                for (var i = 0; i < 3; i++)
                {
                    _machinePid[i] = hash[i];
                }
            }

            try
            {
                var pid = Environment.ProcessId;
                _machinePid[3] = (byte)(pid >> 8);
                _machinePid[4] = (byte)pid;
            }
            catch (SecurityException)
            {
            }
        }

        public static T Instance => Lazy.Value;

        public Guid NewGuid() => NewGuid(DateTime.UtcNow.Ticks);

        public Guid NewGuid(DateTime timestamp)
        {
            var ticks = timestamp.Kind switch
            {
                DateTimeKind.Utc => timestamp.Ticks,
                DateTimeKind.Local => timestamp.ToUniversalTime().Ticks,
                _ => throw new ArgumentException("DateTimeKind.Unspecified 지원되지 않음", nameof(timestamp))
            };

            if (!ticks.IsDateTime())
            {
                throw new ArgumentException("타임스탬프는 1970년 1월 1일 UTC와 지금 사이여야 합니다", nameof(timestamp));
            }

            return NewGuid(ticks);
        }

        internal virtual Guid NewGuid(long timestamp)
        {
            var increment = Interlocked.Increment(ref _increment) & 0x00ffffff;
            return new Guid(
                (int)(timestamp >> 32),
                (short)(timestamp >> 16),
                (short)timestamp,
                _machinePid.Concat(new[] { (byte)(increment >> 16), (byte)(increment >> 8), (byte)increment }).ToArray()
            );
        }
    }

    public sealed class SequentialSqlGuidGenerator : SequentialGuidGeneratorBase<SequentialSqlGuidGenerator>
    {
        private SequentialSqlGuidGenerator() { }

        internal override Guid NewGuid(long timestamp) =>
            base.NewGuid(timestamp).ToSqlGuid().Value;

        public SqlGuid NewSqlGuid() => new(NewGuid());

        public SqlGuid NewSqlGuid(DateTime timestamp) => new(NewGuid(timestamp));
    }

    public interface ISequentialIdGenerator
    {
        Guid NewId();
    }

    public class SequentialIdGenerator : ISequentialIdGenerator
    {
        public Guid NewId() => SequentialGuidGenerator.Instance.NewGuid();
    }
}
