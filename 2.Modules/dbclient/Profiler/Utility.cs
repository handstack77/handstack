using System;
using System.Data;
using System.Data.Common;
using System.Linq;
using System.Reflection;

namespace dbclient.Profiler
{
    internal class ProviderUtility
    {
        internal static void InitialzeDbProviderFactory()
        {
            var table = GetProviderFactories();
            if (table != null)
            {
                foreach (var row in table.Rows.Cast<DataRow>().ToList())
                {
                    DbProviderFactory factory;

                    try
                    {
                        factory = DbProviderFactories.GetFactory(row);
                    }
                    catch (Exception)
                    {
                        continue;
                    }

                    if (factory is ProfilerProviderFactory)
                    {
                        continue;
                    }

                    var proxyType = typeof(ProfilerProviderFactory<>).MakeGenericType(factory.GetType());

                    var newRow = table.NewRow();

                    newRow["Name"] = row["Name"];
                    newRow["Description"] = row["Description"];
                    newRow["InvariantName"] = row["InvariantName"];
                    newRow["AssemblyQualifiedName"] = proxyType.AssemblyQualifiedName;

                    table.Rows.Remove(row);
                    table.Rows.Add(newRow);
                }
            }
        }

        private static DataTable? GetProviderFactories()
        {
            var providerFactories = typeof(DbProviderFactories);
            var providerField = providerFactories.GetField("_configTable", BindingFlags.NonPublic | BindingFlags.Static) ??
                providerFactories.GetField("_providerTable", BindingFlags.NonPublic | BindingFlags.Static);
            var registrations = providerField?.GetValue(providerFactories);

            var set = registrations as DataSet;

            return set != null ? set.Tables["DbProviderFactories"] : registrations as DataTable;
        }
    }
}
