using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Linq.Expressions;

using HandStack.Core.ExtensionMethod;

using LiteDB;

using Serilog;

namespace HandStack.Web.Extensions
{
    public class LiteDBClient
    {
        private string connectionString = "";

        private ILogger logger { get; }

        private RollingPeriod rollingPeriod { get; }

        public LiteDBClient(string connectionString, ILogger logger, RollingPeriod rollingPeriod = RollingPeriod.Never)
        {
            this.logger = logger;
            this.connectionString = connectionString;
            this.rollingPeriod = rollingPeriod;
        }

        public void SetFileBasePath(string userWorkID, string applicationID)
        {
            if (string.IsNullOrEmpty(applicationID) == false)
            {
                connectionString = connectionString.Replace("{appBasePath}", PathExtensions.Combine(GlobalConfiguration.TenantAppBasePath, userWorkID, applicationID));
            }
        }

        public bool Insert<T>(T entity)
        {
            var result = true;

            try
            {
                using var liteDB = new LiteDatabase(FileRoller.RollingFileName(connectionString, rollingPeriod));
                var collection = liteDB.GetCollection<T>(typeof(T).Name.ToLower());
                collection.Insert(entity);
            }
            catch (Exception exception)
            {
                result = false;
                logger.Error("[{LogCategory}] " + exception.Message, "LiteDBClient/Insert");
            }

            return result;
        }

        public int Inserts<T>(List<T> entity)
        {
            var result = 0;

            try
            {
                using var liteDB = new LiteDatabase(FileRoller.RollingFileName(connectionString, rollingPeriod));
                var collection = liteDB.GetCollection<T>(typeof(T).Name.ToLower());
                result = collection.InsertBulk(entity);
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + exception.Message, "LiteDBClient/Inserts");
            }

            return result;
        }

        public bool Update<T>(T entity)
        {
            var result = true;

            try
            {
                using var liteDB = new LiteDatabase(FileRoller.RollingFileName(connectionString, rollingPeriod));
                var collection = liteDB.GetCollection<T>(typeof(T).Name.ToLower());
                collection.Update(entity);
            }
            catch (Exception exception)
            {
                result = false;
                logger.Error("[{LogCategory}] " + exception.Message, "LiteDBClient/Update");
            }

            return result;
        }

        public int Updates<T>(List<T> entity)
        {
            var result = 0;

            try
            {
                using var liteDB = new LiteDatabase(FileRoller.RollingFileName(connectionString, rollingPeriod));
                var collection = liteDB.GetCollection<T>(typeof(T).Name.ToLower());
                result = collection.Update(entity);
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + exception.Message, "LiteDBClient/Updates");
            }

            return result;
        }

        public bool Upsert<T>(T entity)
        {
            var result = true;

            try
            {
                using var liteDB = new LiteDatabase(FileRoller.RollingFileName(connectionString, rollingPeriod));
                var collection = liteDB.GetCollection<T>(typeof(T).Name.ToLower());
                collection.Upsert(entity);
            }
            catch (Exception exception)
            {
                result = false;
                logger.Error("[{LogCategory}] " + exception.Message, "LiteDBClient/Upsert");
            }

            return result;
        }

        public int Upserts<T>(List<T> entity)
        {
            var result = 0;

            try
            {
                using var liteDB = new LiteDatabase(FileRoller.RollingFileName(connectionString, rollingPeriod));
                var collection = liteDB.GetCollection<T>(typeof(T).Name.ToLower());
                result = collection.Upsert(entity);
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + exception.Message, "LiteDBClient/Upserts");
            }

            return result;
        }

        public List<T> Select<T>(Expression<Func<T, bool>> filter, Expression<Func<T, string>>? ensureIndex = null, int skip = 0, int limit = int.MaxValue)
        {
            var result = new List<T>();

            try
            {
                using var liteDB = new LiteDatabase(FileRoller.RollingFileName(connectionString, rollingPeriod));
                var collection = liteDB.GetCollection<T>(typeof(T).Name.ToLower());

                if (ensureIndex != null)
                {
                    collection.EnsureIndex(ensureIndex);
                }

                if (collection.Exists(filter) == true)
                {
                    result = collection.Find(filter, skip, limit).ToList();
                }
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + exception.Message, "LiteDBClient/Select");
            }

            return result;
        }

        public List<BsonDocument> PagedSelect(string collectionName, int pageNumber = 0, int entriesPerPage = int.MaxValue)
        {
            using var liteDB = new LiteDatabase(FileRoller.RollingFileName(connectionString, rollingPeriod));
            var col = liteDB.GetCollection(collectionName);
            var query = col.Query();
            return query
                .Limit(entriesPerPage)
                .Offset((pageNumber - 1) * entriesPerPage)
                .ToList();
        }

        public int Delete<T>(Expression<Func<T, bool>>? filter = null)
        {
            var result = 0;

            try
            {
                using var liteDB = new LiteDatabase(FileRoller.RollingFileName(connectionString, rollingPeriod));
                var collection = liteDB.GetCollection<T>(typeof(T).Name.ToLower());

                if (filter != null)
                {
                    collection.DeleteMany(filter);
                }
                else
                {
                    collection.DeleteAll();
                }
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + exception.Message, "LiteDBClient/Delete");
            }

            return result;
        }

        public bool SetFileStorage(string key, string filePath, Stream? stream = null)
        {
            var result = true;

            try
            {
                using var liteDB = new LiteDatabase(FileRoller.RollingFileName(connectionString, rollingPeriod));
                if (stream == null)
                {
                    liteDB.FileStorage.Upload(key, filePath);
                }
                else
                {
                    liteDB.FileStorage.Upload(key, filePath, stream);
                }
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + exception.Message, "LiteDBClient/SetFileStorage");
            }
            return result;
        }

        public LiteFileInfo<string> GetFileStorage(string key, Stream stream)
        {
            var result = new LiteFileInfo<string>();

            try
            {
                using var liteDB = new LiteDatabase(FileRoller.RollingFileName(connectionString, rollingPeriod));
                result = liteDB.FileStorage.Download(key, stream);
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + exception.Message, "LiteDBClient/GetFileStorage");
            }
            return result;
        }

        public void ExportAll()
        {
            using var liteDB = new LiteDatabase(FileRoller.RollingFileName(connectionString, rollingPeriod));
            foreach (var collectionName in liteDB.GetCollectionNames())
            {
                try
                {
                    var backupCollection = liteDB.GetCollection(collectionName).FindAll();
                    if (backupCollection != null)
                    {
                        var exportFileName = PathExtensions.Combine(AppDomain.CurrentDomain.BaseDirectory, $"{collectionName}.collection");
                        File.AppendAllText(exportFileName, JsonSerializer.Serialize(new BsonValue(backupCollection)));
                    }
                }
                catch (Exception exception)
                {
                    logger.Error("[{LogCategory}] " + exception.Message, "LiteDBClient/ExportAll");
                }
            }
        }

        public void Export<T>(T entity)
        {
            using var liteDB = new LiteDatabase(FileRoller.RollingFileName(connectionString, rollingPeriod));
            try
            {
                var collectionName = typeof(T).Name.ToLower();
                var exportFileName = PathExtensions.Combine(AppDomain.CurrentDomain.BaseDirectory, $"{collectionName}.collection");
                File.AppendAllText(exportFileName, JsonSerializer.Serialize(new BsonValue(liteDB.GetCollection(collectionName).FindAll())));
            }
            catch (Exception exception)
            {
                logger.Error("[{LogCategory}] " + exception.Message, "LiteDBClient/Export");
            }
        }

        public void ImportAll()
        {
            using var liteDB = new LiteDatabase(FileRoller.RollingFileName(connectionString, rollingPeriod));
            foreach (var collectionName in liteDB.GetCollectionNames())
            {
                var backupFileName = PathExtensions.Combine(AppDomain.CurrentDomain.BaseDirectory, $"{collectionName}.backup");
                var exportFileName = PathExtensions.Combine(AppDomain.CurrentDomain.BaseDirectory, $"{collectionName}.collection");

                if (File.Exists(exportFileName) == true)
                {
                    var isDelete = false;
                    try
                    {
                        File.AppendAllText(backupFileName, JsonSerializer.Serialize(new BsonValue(liteDB.GetCollection(collectionName).FindAll())));
                        liteDB.GetCollection(collectionName).DeleteAll();
                        isDelete = true;

                        var bsonArray = JsonSerializer.Deserialize(File.ReadAllText(exportFileName));
                        var bsonDocuments = new List<BsonDocument>();
                        foreach (var bsonValue in bsonArray.AsArray.ToArray())
                        {
                            bsonDocuments.Add((BsonDocument)bsonValue);
                        }
                        liteDB.GetCollection(collectionName).InsertBulk(bsonDocuments);
                    }
                    catch (Exception exception)
                    {
                        logger.Error("[{LogCategory}] " + exception.Message, "LiteDBClient/ImportAll");

                        if (isDelete == true && File.Exists(backupFileName) == true)
                        {
                            var bsonArray = JsonSerializer.Deserialize(File.ReadAllText(backupFileName));
                            var bsonDocuments = new List<BsonDocument>();
                            foreach (var bsonValue in bsonArray.AsArray.ToArray())
                            {
                                bsonDocuments.Add((BsonDocument)bsonValue);
                            }
                            liteDB.GetCollection(collectionName).InsertBulk(bsonDocuments);
                        }
                    }
                    finally
                    {
                        File.Delete(backupFileName);
                    }
                }
            }
        }

        public void Import<T>(T entity)
        {
            using var liteDB = new LiteDatabase(FileRoller.RollingFileName(connectionString, rollingPeriod));
            var collectionName = typeof(T).Name.ToLower();
            var backupFileName = PathExtensions.Combine(AppDomain.CurrentDomain.BaseDirectory, $"{collectionName}.backup");
            var exportFileName = PathExtensions.Combine(AppDomain.CurrentDomain.BaseDirectory, $"{collectionName}.collection");

            if (File.Exists(exportFileName) == true)
            {
                var isDelete = false;
                try
                {
                    File.AppendAllText(backupFileName, JsonSerializer.Serialize(new BsonValue(liteDB.GetCollection(collectionName).FindAll())));
                    liteDB.GetCollection(collectionName).DeleteAll();
                    isDelete = true;

                    var bsonArray = JsonSerializer.Deserialize(File.ReadAllText(exportFileName));
                    var bsonDocuments = new List<BsonDocument>();
                    foreach (var bsonValue in bsonArray.AsArray.ToArray())
                    {
                        bsonDocuments.Add((BsonDocument)bsonValue);
                    }
                    liteDB.GetCollection(collectionName).InsertBulk(bsonDocuments);
                }
                catch (Exception exception)
                {
                    logger.Error("[{LogCategory}] " + exception.Message, "LiteDBClient/ImportAll");

                    if (isDelete == true && File.Exists(backupFileName) == true)
                    {
                        var bsonArray = JsonSerializer.Deserialize(File.ReadAllText(backupFileName));
                        var bsonDocuments = new List<BsonDocument>();
                        foreach (var bsonValue in bsonArray.AsArray.ToArray())
                        {
                            bsonDocuments.Add((BsonDocument)bsonValue);
                        }
                        liteDB.GetCollection(collectionName).InsertBulk(bsonDocuments);
                    }
                }
                finally
                {
                    File.Delete(backupFileName);
                }
            }
        }
    }
}
