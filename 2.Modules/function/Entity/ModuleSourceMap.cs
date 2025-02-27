﻿using System.Collections.Generic;

using HandStack.Data;

namespace function.Entity
{
    public record ModuleSourceMap
    {
        public List<string> ProjectListID { get; set; } = new List<string>();

        public string DataSourceID { get; set; } = "";

        public DataProviders DataProvider { get; set; }

        public string ConnectionString { get; set; } = "";

        public string IsEncryption { get; set; } = "";

        public string WorkingDirectoryPath { get; set; } = "";
    }
}
