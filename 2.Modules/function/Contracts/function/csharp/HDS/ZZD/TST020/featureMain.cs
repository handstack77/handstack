using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Data;

using function.Entity;

using HandStack.Core.Helpers;
using HandStack.Web.MessageContract.DataObject;

using Microsoft.EntityFrameworkCore;

namespace DynamicRun.Sources
{
    public class UserLogin
    {
        [Key, StringLength(20)]
        public string UserID { get; set; } = "";
        [Required, StringLength(128)]
        public string UserPW { get; set; } = "";
        [Required, StringLength(50)]
        public string UserName { get; set; } = "";
        [Required, StringLength(50)]
        public string UserEmail { get; set; } = "";
    }

    public class TestDbContext : DbContext
    {
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            string connectionString = @"Server=(localdb)";
            // string connectionString = @"Server=(localdb)/mssqllocaldb;Database=Test;";
            // string connectionString = "Server=localhost;Port=3306;Database=HandStack;Uid=handstack;Pwd=handstack~!@34;PersistSecurityInfo=True;SslMode=none;Charset=utf8;Allow User Variables=True;";
            // string connectionString = @"URI=file:C:/home/handstack/sqlite/HDS/HDS.db;Pooling=True;Max Pool Size=100;Version=3;";
            // string connectionString = "User ID=postgres;Password=handstack~!@34;Host=localhost;Port=5432;Database=postgres;Pooling=true;Minimum Pool Size=0;Maximum Pool Size=100;ConnectionLifetime=0;";
            // string connectionString = "Data Source=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=localhost)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=XE)));User Id=system;Password=handstack~!@34;Connection Timeout=120;";

            optionsBuilder.UseSqlServer(connectionString);
            // optionsBuilder.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString));
            // optionsBuilder.UseSqlite(connectionString);
            // optionsBuilder.UseNpgsql(connectionString);
            // optionsBuilder.UseOracle(connectionString);
        }

        public DbSet<UserLogin>? UserLogin { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<UserLogin>().ToTable(name: "UserLogin");
            modelBuilder.Entity<UserLogin>().HasIndex(m => new { m.UserName });
        }
    }

    public class Simple
    {
        public string Name { get; set; } = "";

        public void Method1()
        {
            Console.WriteLine(Name);
        }

        public DataSet? Method2(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            DataSet? result = new DataSet();

            DataTableHelper dataTableBuilder = new DataTableHelper();
            dataTableBuilder.AddColumn("GlobalID", typeof(string));
            dataTableBuilder.NewRow();

            using (TestDbContext testDbContext = new TestDbContext())
            {
                string script = testDbContext.Database.GenerateCreateScript();

                dataTableBuilder.SetValue(0, 0, script);
            }

            using (DataTable table = dataTableBuilder.GetDataTable())
            {
                result.Tables.Add(table);
            }

            return result;
        }

        public object Method3()
        {
            return "Hello World !";
        }

        public Simple Method4()
        {
            return new Simple() { Name = "Hello World !" };
        }
    }
}
