using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

using forwarder.Models;

using System.Data.SQLite;

namespace forwarder.Services
{
    public class SQLiteForwardProxySessionStore : IForwardProxySessionStore
    {
        public Task<string?> LoadStorageStateAsync(ForwardSessionDescriptor session, CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();
            EnsureDatabase(session);

            using var connection = new SQLiteConnection(CreateConnectionString(session.DatabaseFilePath));
            connection.Open();

            using var command = connection.CreateCommand();
            command.CommandText = "SELECT StorageState FROM SessionState WHERE SessionKey = @SessionKey LIMIT 1;";
            command.Parameters.AddWithValue("@SessionKey", session.SessionKey);

            var result = command.ExecuteScalar();
            return Task.FromResult(result == DBNull.Value || result == null ? null : Convert.ToString(result));
        }

        public Task SaveStorageStateAsync(ForwardSessionDescriptor session, string? storageState, ForwardClientKind clientKind, CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();
            EnsureDatabase(session);

            using var connection = new SQLiteConnection(CreateConnectionString(session.DatabaseFilePath));
            connection.Open();

            using var command = connection.CreateCommand();
            command.CommandText =
            """
            INSERT INTO SessionState
            (
                SessionKey,
                UserNo,
                UserID,
                CreatedAt,
                ClientKind,
                StorageState,
                LastUpdatedAt
            )
            VALUES
            (
                @SessionKey,
                @UserNo,
                @UserID,
                @CreatedAt,
                @ClientKind,
                @StorageState,
                @LastUpdatedAt
            )
            ON CONFLICT(SessionKey)
            DO UPDATE SET
                UserNo = excluded.UserNo,
                UserID = excluded.UserID,
                CreatedAt = excluded.CreatedAt,
                ClientKind = excluded.ClientKind,
                StorageState = excluded.StorageState,
                LastUpdatedAt = excluded.LastUpdatedAt;
            """;

            command.Parameters.AddWithValue("@SessionKey", session.SessionKey);
            command.Parameters.AddWithValue("@UserNo", session.UserNo);
            command.Parameters.AddWithValue("@UserID", session.UserID);
            command.Parameters.AddWithValue("@CreatedAt", session.CreatedAt.ToString("O"));
            command.Parameters.AddWithValue("@ClientKind", clientKind.ToString());
            command.Parameters.AddWithValue("@StorageState", string.IsNullOrWhiteSpace(storageState) == true ? DBNull.Value : storageState);
            command.Parameters.AddWithValue("@LastUpdatedAt", DateTime.UtcNow.ToString("O"));
            command.ExecuteNonQuery();

            return Task.CompletedTask;
        }

        private static void EnsureDatabase(ForwardSessionDescriptor session)
        {
            var fileInfo = new FileInfo(session.DatabaseFilePath);
            if (fileInfo.Directory != null && fileInfo.Directory.Exists == false)
            {
                Directory.CreateDirectory(fileInfo.Directory.FullName);
            }

            if (fileInfo.Exists == false)
            {
                SQLiteConnection.CreateFile(session.DatabaseFilePath);
            }

            using var connection = new SQLiteConnection(CreateConnectionString(session.DatabaseFilePath));
            connection.Open();

            using var command = connection.CreateCommand();
            command.CommandText =
            """
            CREATE TABLE IF NOT EXISTS SessionState
            (
                SessionKey TEXT PRIMARY KEY,
                UserNo TEXT NOT NULL,
                UserID TEXT NOT NULL,
                CreatedAt TEXT NOT NULL,
                ClientKind TEXT NOT NULL,
                StorageState TEXT NULL,
                LastUpdatedAt TEXT NOT NULL
            );
            """;
            command.ExecuteNonQuery();
        }

        private static string CreateConnectionString(string databaseFilePath)
        {
            return $"Data Source={databaseFilePath};Version=3;";
        }
    }
}
