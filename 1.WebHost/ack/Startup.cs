using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

using ack.Extensions;
using ack.Services;

using AspNetCoreRateLimit;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Licensing;
using HandStack.Core.Licensing.Validation;
using HandStack.Web;
using HandStack.Web.ApiClient;
using HandStack.Web.Entity;
using HandStack.Web.Extensions;
using HandStack.Web.Modules;

using MediatR;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.CookiePolicy;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpLogging;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApplicationModels;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Net.Http.Headers;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;

using Serilog;

using Sqids;

using static System.Net.Mime.MediaTypeNames;

namespace ack
{
    public class Startup
    {
        bool useContractSync = false;
        string? startTime = null;
        bool useHttpLogging = false;
        bool useProxyForward = false;
        bool useResponseComression = false;
        readonly IConfiguration configuration;
        readonly IWebHostEnvironment environment;
        static readonly ServerEventListener serverEventListener = new ServerEventListener();

        public Startup(IWebHostEnvironment environment, IConfiguration configuration)
        {
            Process currentProcess = Process.GetCurrentProcess();
            GlobalConfiguration.ProcessID = currentProcess.Id.ToString().PadLeft(6, '0');
            startTime = currentProcess.StartTime.ToString();

            this.configuration = configuration;
            this.environment = environment;
        }

        public void ConfigureServices(IServiceCollection services)
        {
            var appSettings = configuration.GetSection("AppSettings");
            if (appSettings.GetSection("ApplicationID").Value == null)
            {
                Log.Error("[{LogCategory}] " + $"{Environment.CurrentDirectory} appsettings.json AppSettings 환경변수 확인 필요", "Startup/ConfigureServices");
                throw new Exception("AppSettings 환경변수 확인 필요");
            }

            this.useContractSync = bool.Parse(appSettings["UseContractSync"].ToStringSafe("false"));
            this.useHttpLogging = bool.Parse(appSettings["UseHttpLogging"].ToStringSafe("false"));
            this.useProxyForward = bool.Parse(appSettings["UseForwardProxy"].ToStringSafe("false"));
            this.useResponseComression = bool.Parse(appSettings["UseResponseComression"].ToStringSafe("false"));

            GlobalConfiguration.InstallType = appSettings["InstallType"].ToStringSafe();
            GlobalConfiguration.ApplicationID = appSettings.GetSection("ApplicationID").Exists() == true ? appSettings["ApplicationID"].ToStringSafe() : "HDS";
            GlobalConfiguration.ApplicationName = appSettings.GetSection("ProgramName").Exists() == true ? appSettings["ProgramName"].ToStringSafe() : environment.ApplicationName;
            GlobalConfiguration.ApplicationVersion = (Assembly.GetEntryAssembly()?.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion.ToString()).ToStringSafe("1.0.0");
            GlobalConfiguration.BusinessServerUrl = appSettings["BusinessServerUrl"].ToStringSafe();
            GlobalConfiguration.RunningEnvironment = appSettings["RunningEnvironment"].ToStringSafe();
            GlobalConfiguration.HostName = string.IsNullOrEmpty(appSettings["HostName"].ToStringSafe()) == true ? Dns.GetHostName() : appSettings["HostName"].ToStringSafe();
            GlobalConfiguration.SystemName = Dns.GetHostName();
            GlobalConfiguration.HostAccessID = appSettings["HostAccessID"].ToStringSafe();
            GlobalConfiguration.SystemID = appSettings["SystemID"].ToStringSafe();
            GlobalConfiguration.FindGlobalIDServer = appSettings["FindGlobalIDServer"].ToStringSafe();
            GlobalConfiguration.IsTenantFunction = bool.Parse(appSettings["IsTenantFunction"].ToStringSafe("false"));
            GlobalConfiguration.IsExceptionDetailText = bool.Parse(appSettings["IsExceptionDetailText"].ToStringSafe("false"));
            GlobalConfiguration.IsModuleContractClear = bool.Parse(appSettings["IsModuleContractClear"].ToStringSafe("true"));
            GlobalConfiguration.SessionCookieName = appSettings.GetSection("SessionState").Exists() == true && bool.Parse(appSettings["SessionState:IsSession"].ToStringSafe("false")) == true ? appSettings["SessionState:SessionCookieName"].ToStringSafe("") : "";
            GlobalConfiguration.CookiePrefixName = appSettings["CookiePrefixName"].ToStringSafe("HandStack");
            GlobalConfiguration.UserSignExpire = int.Parse(appSettings["UserSignExpire"].ToStringSafe("1440"));

            switch (GlobalConfiguration.RunningEnvironment)
            {
                case "D":
                    environment.EnvironmentName = "Development";
                    break;
                case "P":
                    environment.EnvironmentName = "Production";
                    break;
                case "S":
                    environment.EnvironmentName = "Staging";
                    break;
                default:
                    environment.EnvironmentName = "Development";
                    break;
            }

            GlobalConfiguration.EnvironmentName = environment.EnvironmentName;
            GlobalConfiguration.RunningEnvironment = environment.EnvironmentName.Substring(0, 1);

            if (OperatingSystem.IsWindows() == true)
            {
                GlobalConfiguration.OSPlatform = "Windows";
            }
            else if (OperatingSystem.IsLinux() == true)
            {
                GlobalConfiguration.OSPlatform = "Linux";
            }
            else if (OperatingSystem.IsMacOS() == true)
            {
                GlobalConfiguration.OSPlatform = "MacOS";
            }
            else
            {
                GlobalConfiguration.OSPlatform = "Etc";
            }

            GlobalConfiguration.ContentRootPath = environment.ContentRootPath;
            GlobalConfiguration.WebRootPath = environment.WebRootPath;

            GlobalConfiguration.TenantAppRequestPath = appSettings["TenantAppRequestPath"].ToStringSafe();
            GlobalConfiguration.TenantAppBasePath = GlobalConfiguration.GetBasePath(appSettings["TenantAppBasePath"], $"{(string.IsNullOrEmpty(Environment.GetEnvironmentVariable("HANDSTACK_HOME")) == true ? ".." : Environment.GetEnvironmentVariable("HANDSTACK_HOME"))}{Path.DirectorySeparatorChar}tenants");
            GlobalConfiguration.BatchProgramBasePath = GlobalConfiguration.GetBasePath(appSettings["BatchProgramBasePath"]);
            GlobalConfiguration.CreateAppTempPath = GlobalConfiguration.GetBasePath(appSettings["CreateAppTempPath"]);
            GlobalConfiguration.ForbesBasePath = GlobalConfiguration.GetBasePath(appSettings["ForbesBasePath"]);
            GlobalConfiguration.LoadModuleBasePath = GlobalConfiguration.GetBasePath(appSettings["LoadModuleBasePath"]);

            string disposeTenantAppsFilePath = PathExtensions.Combine(GlobalConfiguration.EntryBasePath, "dispose-tenantapps.log");
            if (File.Exists(disposeTenantAppsFilePath) == true)
            {
                using (StreamReader file = new StreamReader(disposeTenantAppsFilePath))
                {
                    string? line;
                    while ((line = file.ReadLine()) != null)
                    {
                        if (line.Contains("|") == true)
                        {
                            string userWorkID = line.Split('|')[0];
                            string tenantID = line.Split('|')[1];
                            string path = line.Split('|')[2];
                            try
                            {
                                if (Directory.Exists(path) == true && path.StartsWith(GlobalConfiguration.TenantAppBasePath) == true)
                                {
                                    Log.Information("[{LogCategory}] " + $"DisposeTenantApps userWorkID: {userWorkID}, tenantID: {tenantID}", "Startup/ConfigureServices");
                                    Directory.Delete(path, true);
                                }
                                else
                                {
                                    Log.Warning("[{LogCategory}] " + $"DisposeTenantApps 디렉토리 확인 필요: {path}", "Startup/ConfigureServices");
                                }
                            }
                            catch (Exception exception)
                            {
                                Log.Error(exception, "[{LogCategory}] " + $"DisposeTenantApps 디렉토리 삭제 오류: {path}", "Startup/ConfigureServices");
                            }
                        }
                    }
                }

                File.Delete(disposeTenantAppsFilePath);
            }

            var withOrigins = appSettings.GetSection("WithOrigins")?.AsEnumerable();
            if (withOrigins != null && withOrigins.Any() == true)
            {
                foreach (var item in withOrigins)
                {
                    if (string.IsNullOrEmpty(item.Value) == false)
                    {
                        GlobalConfiguration.WithOrigins.Add(item.Value);
                    }
                }
            }

            var moduleConfigurationUrls = appSettings.GetSection("ModuleConfigurationUrl").AsEnumerable();
            foreach (var moduleConfigurationUrl in moduleConfigurationUrls)
            {
                if (moduleConfigurationUrl.Value != null)
                {
                    GlobalConfiguration.ModuleConfigurationUrl.Add(moduleConfigurationUrl.Value);
                }
            }

            GlobalConfiguration.IsPermissionRoles = bool.Parse(appSettings["IsPermissionRoles"].ToStringSafe("false"));
            var sectionPermissionRoles = appSettings.GetSection("PermissionRoles");
            if (sectionPermissionRoles != null)
            {
                var permissionRoles = sectionPermissionRoles.Get<List<PermissionRoles>>();
                if (permissionRoles != null && permissionRoles.Any() == true)
                {
                    foreach (var item in permissionRoles)
                    {
                        GlobalConfiguration.PermissionRoles.Add(item);
                    }
                }
            }

            TransactionConfig.DiscoveryApiServerUrl = appSettings["DiscoveryApiServerUrl"].ToStringSafe();
            TransactionConfig.Program.InstallType = appSettings["InstallType"].ToStringSafe();
            TransactionConfig.Program.ProgramVersion = GlobalConfiguration.ApplicationVersion;
            TransactionConfig.Program.ProgramName = GlobalConfiguration.ApplicationName;
            TransactionConfig.Program.ClientTokenID = string.IsNullOrEmpty(GlobalConfiguration.ProcessID) == true ? Guid.NewGuid().ToString("N").Substring(0, 6) : GlobalConfiguration.ProcessID.PadLeft(6, '0');
            TransactionConfig.Transaction.SystemID = GlobalConfiguration.SystemID;
            TransactionConfig.Transaction.MachineName = GlobalConfiguration.HostName;
            TransactionConfig.Transaction.RunningEnvironment = GlobalConfiguration.RunningEnvironment;

            GlobalConfiguration.WebRootPath = environment.WebRootPath;
            GlobalConfiguration.ContentRootPath = environment.ContentRootPath;

            var domainAPIServer = new JObject();
            domainAPIServer.Add("ExceptionText", null);
            domainAPIServer.Add("RequestID", "");
            domainAPIServer.Add("ServerID", appSettings["DomainAPIServer:ServerID"]);
            domainAPIServer.Add("ServerType", appSettings["DomainAPIServer:ServerType"]);
            domainAPIServer.Add("Protocol", appSettings["DomainAPIServer:Protocol"]);
            domainAPIServer.Add("IP", appSettings["DomainAPIServer:IP"]);
            domainAPIServer.Add("Port", appSettings["DomainAPIServer:Port"]);
            domainAPIServer.Add("Path", appSettings["DomainAPIServer:Path"]);
            domainAPIServer.Add("ClientIP", appSettings["DomainAPIServer:ClientIP"]);
            GlobalConfiguration.DomainAPIServer = domainAPIServer;

            if (useResponseComression == true)
            {
                services.AddResponseCompression(options =>
                {
                    options.EnableForHttps = bool.Parse(appSettings["ComressionEnableForHttps"].ToStringSafe("false"));
                    options.Providers.Add<BrotliCompressionProvider>();
                    options.Providers.Add<GzipCompressionProvider>();

                    List<string> mimeTypes = new List<string>();
                    var comressionMimeTypes = appSettings.GetSection("ComressionMimeTypes").AsEnumerable();
                    foreach (var comressionMimeType in comressionMimeTypes)
                    {
                        if (comressionMimeType.Value != null)
                        {
                            mimeTypes.Add(comressionMimeType.Value);
                        }
                    }

                    options.MimeTypes = mimeTypes;
                });
            }

            services.AddMemoryCache();

            if (string.IsNullOrEmpty(GlobalConfiguration.SessionCookieName) == false)
            {
                string cacheType = appSettings["SessionState:CacheType"].ToStringSafe();
                if (cacheType == "Memory")
                {
                    services.AddDistributedMemoryCache();
                }
                else if (cacheType == "MySql")
                {
                    services.AddDistributedMySqlCache(options =>
                    {
                        options.ConnectionString = appSettings["SessionState:MySqlConnectionString"].ToStringSafe();
                        options.SchemaName = appSettings["SessionState:MySqlSchemaName"].ToStringSafe();
                        options.TableName = appSettings["SessionState:MySqlTableName"].ToStringSafe();

                        if (options.ConnectionString == "" || options.SchemaName == "" || options.TableName == "")
                        {
                            Log.Error("[{LogCategory}] " + "MySql Cache 환경설정 확인 필요", "Startup/ConfigureServices");
                            throw new Exception("MySql Cache 환경설정 확인 필요");
                        }
                    });
                }
                else if (cacheType == "SqlServer")
                {
                    services.AddDistributedSqlServerCache(options =>
                    {
                        options.ConnectionString = appSettings["SessionState:SqlServerConnectionString"].ToStringSafe();
                        options.SchemaName = appSettings["SessionState:SqlServerSchemaName"].ToStringSafe();
                        options.TableName = appSettings["SessionState:SqlServerTableName"].ToStringSafe();

                        if (options.ConnectionString == "" || options.SchemaName == "" || options.TableName == "")
                        {
                            Log.Error("[{LogCategory}] " + "SqlServer Cache 환경설정 확인 필요", "Startup/ConfigureServices");
                            throw new Exception("SqlServer Cache 환경설정 확인 필요");
                        }
                    });
                }
                else
                {
                    Log.Error("[{LogCategory}] " + $"SessionState CacheType: {cacheType} 확인 필요", "Startup/ConfigureServices");
                    throw new Exception($"SessionState CacheType: {cacheType} 확인 필요");
                }

                services.AddSession(options =>
                {
                    options.IdleTimeout = TimeSpan.FromMinutes(20);
                    options.Cookie.HttpOnly = true;
                    options.Cookie.IsEssential = true;
                    options.Cookie.Name = GlobalConfiguration.SessionCookieName;
                });

                services.Configure<CookiePolicyOptions>(options =>
                {
                    options.CheckConsentNeeded = context => false;
                    options.MinimumSameSitePolicy = Microsoft.AspNetCore.Http.SameSiteMode.Lax;
                    options.HttpOnly = HttpOnlyPolicy.None;
                    options.Secure = CookieSecurePolicy.SameAsRequest;
                });

                var authenticationLoginPath = appSettings["AuthenticationLoginPath"].ToStringSafe();
                if (string.IsNullOrEmpty(authenticationLoginPath) == true)
                {
                    authenticationLoginPath = "/account/login";
                }

                var authenticationLogoutPath = appSettings["AuthenticationLogoutPath"].ToStringSafe();
                if (string.IsNullOrEmpty(authenticationLogoutPath) == true)
                {
                    authenticationLogoutPath = "/account/logout";
                }

                services.AddAuthentication($"{GlobalConfiguration.CookiePrefixName}.AuthenticationScheme")
                     .AddCookie($"{GlobalConfiguration.CookiePrefixName}.AuthenticationScheme", options =>
                     {
                         options.Cookie.Name = $"{GlobalConfiguration.CookiePrefixName}.AuthenticationScheme";
                         options.LoginPath = authenticationLoginPath;
                         options.LogoutPath = authenticationLoginPath;
                     });

                services.Configure<CookieTempDataProviderOptions>(options => options.Cookie.Name = $"{GlobalConfiguration.CookiePrefixName}.ApplicationCookie");
                services.ConfigureApplicationCookie(options =>
                {
                    options.Cookie.HttpOnly = true;
                    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
                    options.Cookie.SameSite = Microsoft.AspNetCore.Http.SameSiteMode.None;
                    options.Cookie.Expiration = TimeSpan.FromSeconds(GlobalConfiguration.UserSignExpire);

                    options.SlidingExpiration = true;
                    options.ExpireTimeSpan = TimeSpan.FromSeconds(GlobalConfiguration.UserSignExpire);
                    options.LoginPath = authenticationLoginPath;
                    options.LogoutPath = authenticationLoginPath;
                });
            }

            var ipRateLimitingSection = configuration.GetSection("IpRateLimiting");
            if (ipRateLimitingSection.Exists() == true)
            {
                services.Configure<IpRateLimitOptions>(configuration.GetSection("IpRateLimiting"));
                services.AddInMemoryRateLimiting();
                services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();
            }

            services.AddProblemDetails();
            services.AddHttpContextAccessor();
            services.AddAntiforgery(options => options.HeaderName = "X-XSRF-Token");
            services.AddRouting(options =>
            {
                options.LowercaseUrls = true;
                options.ConstraintMap["slugify"] = typeof(SlugifyParameterTransformer);
            });

            if (GlobalConfiguration.WithOrigins.Count > 0)
            {
                services.AddCors(options =>
                {
                    options.AddDefaultPolicy(
                    builder => builder
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials()
                        .WithOrigins(GlobalConfiguration.WithOrigins.ToArray())
                        .SetIsOriginAllowedToAllowWildcardSubdomains()
                        .SetPreflightMaxAge(TimeSpan.FromSeconds(86400))
                        .WithHeaders(HeaderNames.CacheControl)
                    );

                    options.AddPolicy("PublicCorsPolicy",
                    builder => builder
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowAnyOrigin()
                        .SetIsOriginAllowedToAllowWildcardSubdomains()
                        .SetPreflightMaxAge(TimeSpan.FromSeconds(86400))
                        .WithHeaders(HeaderNames.CacheControl)
                    );
                });
            }
            else
            {
                services.AddCors(options =>
                {
                    options.AddPolicy("PublicCorsPolicy",
                    builder => builder
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials()
                        .SetIsOriginAllowedToAllowWildcardSubdomains()
                        .SetPreflightMaxAge(TimeSpan.FromSeconds(86400))
                        .WithHeaders(HeaderNames.CacheControl)
                    );
                });
            }

            if (Directory.Exists(GlobalConfiguration.TenantAppBasePath) == true)
            {
                foreach (var userWorkPath in Directory.GetDirectories(GlobalConfiguration.TenantAppBasePath))
                {
                    DirectoryInfo workDirectoryInfo = new DirectoryInfo(userWorkPath);
                    string userWorkID = workDirectoryInfo.Name;
                    foreach (var appBasePath in Directory.GetDirectories(userWorkPath))
                    {
                        DirectoryInfo directoryInfo = new DirectoryInfo(appBasePath);
                        if (directoryInfo.Exists == true)
                        {
                            string applicationID = directoryInfo.Name;
                            string tenantID = $"{userWorkID}|{applicationID}";

                            string settingFilePath = PathExtensions.Combine(appBasePath, "settings.json");
                            if (File.Exists(settingFilePath) == true && GlobalConfiguration.DisposeTenantApps.Contains(tenantID) == false)
                            {
                                string appSettingText = File.ReadAllText(settingFilePath);
                                var appSetting = JsonConvert.DeserializeObject<AppSettings>(appSettingText);
                                if (appSetting != null)
                                {
                                    var withOriginUri = appSetting.WithOrigin;
                                    if (withOriginUri != null)
                                    {
                                        services.AddCors(options =>
                                        {
                                            options.AddPolicy(name: tenantID,
                                            builder => builder
                                                .AllowAnyHeader()
                                                .AllowAnyMethod()
                                                .WithOrigins(withOriginUri.ToArray())
                                                .SetIsOriginAllowedToAllowWildcardSubdomains()
                                                .SetPreflightMaxAge(TimeSpan.FromSeconds(86400))
                                                .WithHeaders(HeaderNames.CacheControl)
                                            );
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }

            services.AddMvc().AddMvcOptions(options =>
            {
                options.EnableEndpointRouting = false;
                options.SuppressAsyncSuffixInActionNames = false;
                options.InputFormatters.Insert(0, new RawRequestBodyFormatter());
            });
            services.AddControllersWithViews(options =>
            {
                options.Conventions.Add(new RouteTokenTransformerConvention(new SlugifyParameterTransformer()));
            })
            .AddJsonOptions(jsonOptions =>
            {
                jsonOptions.JsonSerializerOptions.PropertyNamingPolicy = null;
            })
            .AddNewtonsoftJson(options =>
            {
                options.SerializerSettings.DateParseHandling = DateParseHandling.None;
                options.SerializerSettings.Formatting = Formatting.None;
                options.SerializerSettings.NullValueHandling = NullValueHandling.Include;
                options.SerializerSettings.ContractResolver = new DefaultContractResolver
                {
                    NamingStrategy = null
                };
            });

            services.AddMediatR(configuration =>
            {
                configuration.RegisterServicesFromAssembly(typeof(Program).Assembly);
            });

            services.AddSwaggerGen();

            services.AddScoped<TransactionClient>();
            services.AddScoped<MediatorClient>();
            services.AddScoped<IMediator, Mediator>();
            services.AddSingleton(configuration);
            services.AddSingleton<ISequentialIdGenerator, SequentialIdGenerator>();
            services.AddSingleton(new SqidsEncoder<int>(new()
            {
                Alphabet = appSettings["SqidsAlphabet"].ToStringSafe() == "" ? "abcdefghijklmnopqrstuvwxyz1234567890" : appSettings["SqidsAlphabet"].ToStringSafe(),
                MinLength = 8,
            }));

            services.AddRazorPages()
            .AddRazorPagesOptions(options =>
            {
                options.Conventions.Add(new PageRouteTransformerConvention(new SlugifyParameterTransformer()));
                options.Conventions.ConfigureFilter(new IgnoreAntiforgeryTokenAttribute());
            });

            if (useProxyForward == true)
            {
                if (useHttpLogging == true)
                {
                    services.AddHttpLogging(options =>
                    {
                        options.LoggingFields = HttpLoggingFields.RequestPropertiesAndHeaders;
                    });
                }

                services.Configure<ForwardedHeadersOptions>(options =>
                {
                    options.ForwardedHeaders = ForwardedHeaders.All;
                    var forwards = appSettings.GetSection("ForwardProxyIP").AsEnumerable();
                    foreach (var item in forwards)
                    {
                        if (string.IsNullOrEmpty(item.Value) == false)
                        {
                            options.KnownProxies.Add(IPAddress.Parse(item.Value));
                        }
                    }

                    bool useSameIPProxy = bool.Parse(appSettings["UseSameIPProxy"].ToStringSafe("false"));
                    if (useSameIPProxy == true)
                    {
                        IPHostEntry host = Dns.GetHostEntry(Dns.GetHostName());
                        foreach (IPAddress ipAddress in host.AddressList)
                        {
                            if (ipAddress.AddressFamily == AddressFamily.InterNetwork)
                            {
                                options.KnownProxies.Add(ipAddress);
                            }
                        }
                    }
                });
            }

            if (appSettings.GetSection("LicenseKey").Value != null && appSettings.GetSection("LicenseSignature").Value == null)
            {
                var ackLicenseKey = appSettings["LicenseKey"].ToStringSafe();
                var ackLicenseSignature = appSettings["LicenseSignature"].ToStringSafe();
                if (string.IsNullOrEmpty(ackLicenseKey) == false && string.IsNullOrEmpty(ackLicenseSignature) == false)
                {
                    try
                    {
                        License license = License.Load(ackLicenseKey.DecodeBase64());
                        string currentMachineName = Environment.MachineName;

                        var validationFailure = license.Validate()
                            .Signature(ackLicenseSignature.ToStringSafe())
                            .AssertValidLicense();

                        if (validationFailure != null)
                        {
                            string errorText = $"ack 프로그램 License 오류: {validationFailure.Message}, {validationFailure.HowToResolve}";
                            Log.Error("[{LogCategory}] " + errorText, "Startup/ConfigureServices");
                            throw new UnauthorizedAccessException(errorText);
                        }
                    }
                    catch (Exception exception)
                    {
                        Log.Error(exception, "[{LogCategory}] " + "ack 프로그램 LicenseKey, LicenseSignature 확인 필요", "Startup/ConfigureServices");
                        throw new UnauthorizedAccessException("ack 프로그램 LicenseKey, LicenseSignature 확인 필요");
                    }
                }
            }

            services.AddModules();
            services.AddCustomizedMvc(GlobalConfiguration.Modules);

            var homePath = new DirectoryInfo(GlobalConfiguration.EntryBasePath).Parent?.FullName.Replace("\\", "/");
            string baseContractPath = PathExtensions.Combine(homePath.ToStringSafe(), "contracts");
            if (GlobalConfiguration.IsModuleContractClear == true)
            {
                if (Directory.Exists(baseContractPath) == true)
                {
                    foreach (string file in Directory.GetFiles(baseContractPath))
                    {
                        File.Delete(file);
                    }

                    foreach (string subdirectory in Directory.GetDirectories(baseContractPath))
                    {
                        Directory.Delete(subdirectory, true);
                    }
                }
            }

            foreach (var module in GlobalConfiguration.Modules)
            {
                Log.Information("[{LogCategory}] " + $"module: {module.ModuleID}", "Startup/ConfigureServices");

                if (module.Assembly != null)
                {
                    var moduleInitializerType = module.Assembly.GetTypes().FirstOrDefault(t => typeof(IModuleInitializer).IsAssignableFrom(t));
                    if (moduleInitializerType != null && (moduleInitializerType != typeof(IModuleInitializer)))
                    {
                        object? instance = Activator.CreateInstance(moduleInitializerType);
                        if (instance != null)
                        {
                            var moduleInitializer = instance as IModuleInitializer;
                            if (moduleInitializer != null)
                            {
                                try
                                {
                                    string moduleContractPath = PathExtensions.Combine(module.BasePath, "Contracts");
                                    if (module.IsCopyContract == true && Directory.Exists(moduleContractPath) == true)
                                    {
                                        DirectoryCopy(moduleContractPath, baseContractPath);
                                    }

                                    if (module.IsPurgeContract == true)
                                    {
                                        var ackFile = new FileInfo(PathExtensions.Combine(GlobalConfiguration.EntryBasePath, "ack.dll"));
                                        var directory = new DirectoryInfo(moduleContractPath);
                                        if (ackFile != null && ackFile.Exists == true && directory != null && directory.Exists == true)
                                        {
                                            string appBasePath = ackFile.DirectoryName.ToStringSafe();
                                            string ackHomePath = (ackFile.Directory?.Parent?.FullName.Replace("\\", "/")).ToStringSafe();
                                            string targetContractDir = PathExtensions.Combine(ackHomePath, "contracts");
                                            string baseDir = directory.FullName.Replace("\\", "/");

                                            try
                                            {
                                                string[] modules = { "dbclient", "transact", "wwwroot", "repository", "function" };
                                                foreach (string moduleID in modules)
                                                {
                                                    string dirPath = PathExtensions.Combine(baseDir, moduleID);
                                                    if (Directory.Exists(dirPath))
                                                    {
                                                        string[] files = Directory.GetFiles(dirPath, "*", SearchOption.AllDirectories);
                                                        foreach (string baseFile in files)
                                                        {
                                                            string targetFile = baseFile.Replace(baseDir, targetContractDir);
                                                            if (File.Exists(targetFile) == true)
                                                            {
                                                                File.Delete(targetFile);
                                                                if (moduleID == "function")
                                                                {
                                                                    var parentDirectory = Path.GetDirectoryName(targetFile);
                                                                    if (Directory.Exists(parentDirectory) == true && Directory.GetFiles(parentDirectory).Length == 0)
                                                                    {
                                                                        Directory.Delete(parentDirectory);
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                            catch (Exception exception)
                                            {
                                                Log.Error(exception, $"{module.ModuleID} purgecontracts 오류");
                                            }
                                        }
                                        else
                                        {
                                            Log.Information($"ackFile:{ackFile?.FullName.Replace("\\", "/")} 파일 확인 또는 settings:{directory?.FullName.Replace("\\", "/")} 파일 확인이 필요합니다");
                                        }
                                    }

                                    services.AddSingleton(typeof(IModuleInitializer), moduleInitializer);
                                    moduleInitializer.ConfigureServices(services, environment, configuration);
                                }
                                catch
                                {
                                    Log.Error("[{LogCategory}] " + $"module: {module.ModuleID} ConfigureServices 확인 필요", "ack Startup/ConfigureServices");
                                    throw;
                                }
                            }
                        }
                    }
                }
            }

            services.AddHostedService<NamePipeService>();
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment environment, ICorsService corsService, ICorsPolicyProvider corsPolicyProvider)
        {
            var ipRateLimitingSection = configuration.GetSection("IpRateLimiting");
            if (ipRateLimitingSection.Exists() == true)
            {
                app.UseIpRateLimiting();
            }

            if (useResponseComression == true)
            {
                app.UseResponseCompression();
            }

            if (useProxyForward == true)
            {
                app.UseForwardedHeaders(new ForwardedHeadersOptions
                {
                    ForwardedHeaders = ForwardedHeaders.All
                });
            }

            if (useHttpLogging == true)
            {
                app.UseHttpLogging();
            }

            GlobalConfiguration.ContentTypeProvider = new FileExtensionContentTypeProvider();

            try
            {
                string contentTypeFilePath = PathExtensions.Combine(GlobalConfiguration.WebRootPath, "contenttype.json");

                if (File.Exists(contentTypeFilePath) == true)
                {
                    var contentTypes = JsonConvert.DeserializeObject<Dictionary<string, string>>(File.ReadAllText(contentTypeFilePath));
                    if (contentTypes != null)
                    {
                        foreach (var item in contentTypes)
                        {
                            GlobalConfiguration.ContentTypeProvider.Mappings[item.Key] = item.Value;
                        }
                    }
                }
            }
            catch (Exception exception)
            {
                Log.Error(exception, "[{LogCategory}] ncloudconfig.json 코드설정 확인 필요", "ack ModuleInitializer/InitailizeAppSetting");
            }

            app.Use(async (context, next) =>
            {
                var requestPath = context.Request.Path.ToString();
                if (GlobalConfiguration.IsPermissionRoles == true && requestPath.IndexOf($"/{GlobalConfiguration.ContractRequestPath}/") > -1)
                {
                    bool isAuthorized = false;
                    var permissionRoles = GlobalConfiguration.PermissionRoles.Where(x => x.ModuleID == "wwwroot");
                    if (permissionRoles.Any() == true)
                    {
                        var publicRoles = permissionRoles.Where(x => x.RoleID == "Public");
                        for (int i = 0; i < publicRoles.Count(); i++)
                        {
                            var publicRole = publicRoles.ElementAt(i);
                            if (publicRole != null)
                            {
                                string pattern = "";
                                if (string.IsNullOrEmpty(publicRole.ApplicationID) == false)
                                {
                                    pattern = pattern + $"[\\/]{publicRole.ApplicationID}";
                                }

                                if (string.IsNullOrEmpty(publicRole.ProjectID) == false)
                                {
                                    pattern = pattern + $"[\\/]{publicRole.ProjectID}";
                                }

                                if (string.IsNullOrEmpty(publicRole.TransactionID) == false)
                                {
                                    pattern = pattern + $"[\\/]{publicRole.TransactionID}";
                                }

                                var allowTransactionPattern = new Regex(pattern);
                                isAuthorized = allowTransactionPattern.IsMatch(requestPath);
                                if (isAuthorized == true)
                                {
                                    break;
                                }
                            }
                        }

                        if (isAuthorized == false)
                        {
                            var member = context.Request.Cookies[$"{GlobalConfiguration.CookiePrefixName}.Member"];
                            if (string.IsNullOrEmpty(member) == false)
                            {
                                var user = JsonConvert.DeserializeObject<UserAccount>(member.DecodeBase64());
                                if (user != null)
                                {
                                    var userRoles = user.ApplicationRoleID.SplitComma();
                                    if (userRoles.Any() == true)
                                    {
                                        foreach (var permissionRole in permissionRoles.Where(x => x.RoleID != "Public"))
                                        {
                                            var roles = permissionRole.RoleID.SplitComma();
                                            if (roles.Intersect(userRoles).Any() == true)
                                            {
                                                string pattern = "";
                                                if (string.IsNullOrEmpty(permissionRole.ApplicationID) == false)
                                                {
                                                    pattern = pattern + $"[\\/]{permissionRole.ApplicationID}";
                                                }

                                                if (string.IsNullOrEmpty(permissionRole.ProjectID) == false)
                                                {
                                                    pattern = pattern + $"[\\/]{permissionRole.ProjectID}";
                                                }

                                                if (string.IsNullOrEmpty(permissionRole.TransactionID) == false)
                                                {
                                                    pattern = pattern + $"[\\/]{permissionRole.TransactionID}";
                                                }

                                                var allowTransactionPattern = new Regex(pattern);
                                                isAuthorized = allowTransactionPattern.IsMatch(requestPath);
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else
                    {
                        isAuthorized = true;
                    }

                    if (isAuthorized == false)
                    {
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        return;
                    }
                }

                await next(context);
            });

            string physicalPath = PathExtensions.Combine(GlobalConfiguration.EntryBasePath, "wwwroot");
            if (Directory.Exists(physicalPath) == true)
            {
                app.UseDefaultFiles();
                // wwwroot 디렉토리내 파일들은 Cache-Control 값을 적용
                app.UseStaticFiles(new StaticFileOptions
                {
                    FileProvider = new PhysicalFileProvider(physicalPath),
                    ServeUnknownFileTypes = true,
                    ContentTypeProvider = GlobalConfiguration.ContentTypeProvider,
                    OnPrepareResponse = httpContext =>
                    {
                        var policy = corsPolicyProvider.GetPolicyAsync(httpContext.Context, null)
                        .ConfigureAwait(false)
                        .GetAwaiter().GetResult();

                        if (policy != null)
                        {
                            try
                            {
                                var corsResult = corsService.EvaluatePolicy(httpContext.Context, policy);
                                corsService.ApplyResult(corsResult, httpContext.Context.Response);
                            }
                            catch
                            {
                                Log.Logger.Warning("[{LogCategory}] " + $"corsService.ApplyResult 확인 필요 {httpContext.Context.Request.Path}", $"Startup ModuleInitializer/Configure");
                            }
                        }

                        if (httpContext.Context.Request.Path.ToString().IndexOf("syn.loader.js") > -1)
                        {
                            if (httpContext.Context.Response.Headers.ContainsKey("Cache-Control") == true)
                            {
                                httpContext.Context.Response.Headers.Remove("Cache-Control");
                            }

                            httpContext.Context.Response.Headers.Append("Cache-Control", "no-cache, no-store");

                            if (httpContext.Context.Response.Headers.ContainsKey("Expires") == false)
                            {
                                httpContext.Context.Response.Headers.Remove("Expires");
                            }

                            httpContext.Context.Response.Headers.Append("Expires", "-1");
                        }
                        else if (GlobalConfiguration.StaticFileCacheMaxAge > 0)
                        {
                            if (httpContext.Context.Response.Headers.ContainsKey("Cache-Control") == true)
                            {
                                httpContext.Context.Response.Headers.Remove("Cache-Control");
                            }

                            httpContext.Context.Response.Headers.Append("Cache-Control", $"public, max-age={GlobalConfiguration.StaticFileCacheMaxAge}");
                        }

                        if (httpContext.Context.Response.Headers.ContainsKey("p3p") == true)
                        {
                            httpContext.Context.Response.Headers.Remove("p3p");
                            httpContext.Context.Response.Headers.Append("p3p", "CP=\"ALL ADM DEV PSAi COM OUR OTRo STP IND ONL\"");
                        }
                    }
                });
            }

            var moduleInitializers = app.ApplicationServices.GetServices<IModuleInitializer>();
            foreach (var moduleInitializer in moduleInitializers)
            {
                Log.Information("[{LogCategory}] " + $"module: {moduleInitializer.ToString()} Configure", "Startup/Configure");
                moduleInitializer.Configure(app, environment, corsService, corsPolicyProvider);
            }

            if (environment != null && environment.IsDevelopment() == true)
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            // app.UseDeveloperExceptionPage();
            // app.UseHsts();
            // app.UseHttpsRedirection();
            app.UseExceptionHandler(exceptionHandlerApp =>
            {
                exceptionHandlerApp.Run(async context =>
                {
                    var exceptionHandlerFeature = context.Features.Get<IExceptionHandlerFeature>();
                    var exceptionType = exceptionHandlerFeature?.Error;

                    string requestMethod = context.Request.Method;
                    string absoluteUrl = context.Request.GetAbsoluteUrl();
                    string clientIP = context.GetRemoteIpAddress().ToStringSafe();
                    string userAgent = context.Request.Headers["User-Agent"].ToString();
                    string identityName = (context.User.Identity?.Name).ToStringSafe();
                    int statusCode = context.Response.StatusCode;
                    string? message = string.Empty;
                    string? stackTrace = string.Empty;

                    if (exceptionType != null)
                    {
                        message = exceptionType.Message;
                        stackTrace = exceptionType.StackTrace;
                    }

                    // 설정에 의해 오류 로그를 파일 또는 API로 전송

                    context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                    context.Response.ContentType = Text.Plain;

                    if (context.RequestServices.GetService<IProblemDetailsService>() is { } problemDetailsService)
                    {
                        ProblemDetails problemDetails = new ProblemDetails();
                        problemDetails.Status = StatusCodes.Status400BadRequest;
                        problemDetails.Title = "유효하지 않는 요청입니다";

                        if (exceptionType != null)
                        {
                            if (exceptionType is UnauthorizedAccessException)
                            {
                                problemDetails.Status = StatusCodes.Status401Unauthorized;
                                problemDetails.Title = "승인되지 않은 접근입니다";
                            }
                            else if (exceptionType is FileNotFoundException)
                            {
                                problemDetails.Status = StatusCodes.Status404NotFound;
                                problemDetails.Title = "리소스를 찾을 수 없습니다";
                            }
                            else
                            {
                                problemDetails.Status = StatusCodes.Status500InternalServerError;
                                problemDetails.Title = message;
                                problemDetails.Detail = stackTrace;
                            }
                        }

                        await problemDetailsService.WriteAsync(new ProblemDetailsContext
                        {
                            HttpContext = context,
                            ProblemDetails = problemDetails
                        });
                    }
                });
            });

            app.UseRouting();

            if (string.IsNullOrEmpty(GlobalConfiguration.SessionCookieName) == false)
            {
                app.UseSession();
                app.UseMiddleware<UserSessionMiddleware>();
            }

            app.UseMiddleware<UserSignMiddleware>();

            if (GlobalConfiguration.WithOrigins.Count > 0)
            {
                if (GlobalConfiguration.WithOrigins.Contains("*:*") == true)
                {
                    app.UseCors(policy =>
                    {
                        policy
                            .AllowAnyOrigin()
                            .AllowAnyHeader()
                            .AllowAnyMethod()
                            .SetIsOriginAllowedToAllowWildcardSubdomains()
                            .SetPreflightMaxAge(TimeSpan.FromSeconds(86400))
                            .WithHeaders(HeaderNames.CacheControl);
                    });
                }
                else
                {
                    app.UseCors();
                }

                app.UseCors("PublicCorsPolicy");
            }

            app.UseAuthentication();
            app.UseAuthorization();
            app.UseCookiePolicy();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapPost("/contractsync", async context =>
                {
                    if (useContractSync == false)
                    {
                        context.Response.StatusCode = StatusCodes.Status406NotAcceptable;
                        return;
                    }

                    try
                    {
                        string destModuleBasePath = string.Empty;
                        string destContractModuleBasePath = string.Empty;
                        string handstackHomePath = Environment.GetEnvironmentVariable("HANDSTACK_HOME") ?? "";
                        if (string.IsNullOrEmpty(handstackHomePath) == false)
                        {
                            var hostAccessID = context.Request.GetContainValue("hostAccessID");
                            if (string.IsNullOrEmpty(hostAccessID) == false && GlobalConfiguration.HostAccessID == hostAccessID)
                            {
                                var form = await context.Request.ReadFormAsync();
                                var file = form.Files["file"];
                                var moduleID = form["moduleID"].ToString();
                                var contractType = form["contractType"].ToString();
                                var destFilePath = form["destFilePath"].ToString();
                                var changeType = form["changeType"].ToString();

                                if (string.IsNullOrEmpty(moduleID) == true || string.IsNullOrEmpty(destFilePath) == true || string.IsNullOrEmpty(changeType) == true || (changeType != "Deleted" && (file == null || file.Length == 0)))
                                {
                                    context.Response.StatusCode = StatusCodes.Status400BadRequest;
                                    return;
                                }

                                switch (contractType)
                                {
                                    case "dbclient":
                                        destModuleBasePath = PathExtensions.Combine(handstackHomePath, "modules", moduleID, "Contracts", "dbclient");
                                        destContractModuleBasePath = PathExtensions.Combine(handstackHomePath, "contracts", "dbclient");
                                        break;
                                    case "function":
                                        destModuleBasePath = PathExtensions.Combine(handstackHomePath, "modules", moduleID, "Contracts", "function");
                                        destContractModuleBasePath = PathExtensions.Combine(handstackHomePath, "contracts", "function");
                                        break;
                                    case "transact":
                                        destModuleBasePath = PathExtensions.Combine(handstackHomePath, "modules", moduleID, "Contracts", "transact");
                                        destContractModuleBasePath = PathExtensions.Combine(handstackHomePath, "contracts", "transact");
                                        break;
                                    case "wwwroot":
                                        destModuleBasePath = PathExtensions.Combine(handstackHomePath, "modules", moduleID, "wwwroot", moduleID);
                                        destContractModuleBasePath = PathExtensions.Combine(handstackHomePath, "modules", moduleID, "wwwroot", moduleID);
                                        break;
                                }

                                if (string.IsNullOrEmpty(destModuleBasePath) == true || string.IsNullOrEmpty(destContractModuleBasePath) == true)
                                {
                                    context.Response.StatusCode = StatusCodes.Status400BadRequest;
                                    return;
                                }

                                if (changeType == "Deleted")
                                {
                                    File.Delete(destModuleBasePath + destFilePath);

                                    if (contractType != "wwwroot")
                                    {
                                        File.Delete(destContractModuleBasePath + destFilePath);
                                    }
                                }
                                else
                                {
                                    if (file != null)
                                    {
                                        using (var fileStream = new MemoryStream())
                                        {
                                            await file.CopyToAsync(fileStream);

                                            await CopyFileAsync(fileStream, destModuleBasePath + destFilePath);

                                            if (contractType != "wwwroot")
                                            {
                                                await CopyFileAsync(fileStream, destContractModuleBasePath + destFilePath);
                                            }
                                        }
                                    }
                                }

                                context.Response.StatusCode = 200;
                            }
                            else
                            {
                                Log.Warning("[{LogCategory}] HostAccessID 확인 필요: " + hostAccessID.ToStringSafe(), "Startup/contractsync");
                                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                            }
                        }
                        else
                        {
                            Log.Warning("[{LogCategory}] HANDSTACK_HOME 환경변수 확인 필요", "Startup/contractsync");
                            context.Response.StatusCode = StatusCodes.Status400BadRequest;
                        }
                    }
                    catch (Exception exception)
                    {
                        Log.Error(exception, "[{LogCategory}] {changeType} 파일 요청 실패", "Startup/contractsync");
                        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                    }
                });

                endpoints.MapGet("/stop", async context =>
                {
                    try
                    {
                        var hostAccessID = context.Request.GetContainValue("hostAccessID");
                        if (string.IsNullOrEmpty(hostAccessID) == false && GlobalConfiguration.HostAccessID == hostAccessID)
                        {
                            var applicationManager = ApplicationManager.Load();
                            applicationManager.Stop();
                            await context.Response.WriteAsync("stop");
                        }
                        else
                        {
                            Log.Warning("[{LogCategory}] HostAccessID 확인 필요: " + hostAccessID.ToStringSafe(), "Startup/stop");
                        }
                    }
                    catch (Exception exception)
                    {
                        Log.Error(exception, "[{LogCategory}] 프로그램 종료 실패", "Startup/stop");
                        context.Response.StatusCode = StatusCodes.Status404NotFound;
                    }
                });

                endpoints.MapGet("/diagnostics", async context =>
                {
                    try
                    {
                        var hostAccessID = context.Request.GetContainValue("hostAccessID");
                        if (string.IsNullOrEmpty(hostAccessID) == false && GlobalConfiguration.HostAccessID == hostAccessID)
                        {
                            var result = new
                            {
                                Environment = new
                                {
                                    ProcessID = GlobalConfiguration.ProcessID,
                                    StartTime = startTime,
                                    SystemID = GlobalConfiguration.SystemID,
                                    ApplicationName = GlobalConfiguration.ApplicationName,
                                    Is64Bit = Environment.Is64BitOperatingSystem,
                                    MachineName = Environment.MachineName,
                                    HostName = GlobalConfiguration.HostName,
                                    RunningEnvironment = GlobalConfiguration.RunningEnvironment,
                                    CommandLine = Environment.CommandLine
                                },
                                Modules = GlobalConfiguration.Modules.Select(p => new
                                {
                                    ModuleID = p.ModuleID,
                                    Name = p.Name,
                                    BasePath = p.BasePath,
                                    IsBundledWithHost = p.IsBundledWithHost,
                                    EventAction = p.EventAction,
                                    SubscribeAction = p.SubscribeAction,
                                    Version = p.Version.ToString(),
                                }),
                                System = serverEventListener.SystemRuntime,
                                Hosting = serverEventListener.AspNetCoreHosting,
                                Kestrel = serverEventListener.AspNetCoreServerKestrel,
                                NetSocket = serverEventListener.SystemNetSocket
                            };
                            context.Response.Headers["Content-Type"] = "application/json";
                            await context.Response.WriteAsync(JsonConvert.SerializeObject(result, Formatting.Indented));
                        }
                        else
                        {
                            Log.Warning("[{LogCategory}] HostAccessID 확인 필요: " + hostAccessID.ToStringSafe(), "Startup/diagnostics");
                            context.Response.StatusCode = StatusCodes.Status400BadRequest;
                        }
                    }
                    catch (Exception exception)
                    {
                        Log.Error(exception, "[{LogCategory}] diagnostics 조회 실패", "Startup/diagnostics");
                        context.Response.StatusCode = StatusCodes.Status404NotFound;
                    }
                });

                endpoints.MapGet("/checkip", async context =>
                {
                    context.Response.Headers["Content-Type"] = "text/html";
                    await context.Response.WriteAsync(context.GetRemoteIpAddress().ToStringSafe());
                });
            });

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapRazorPages();
                endpoints.MapAreaControllerRoute(
                    name: "areas",
                    areaName: "areas",
                    pattern: "{area:exists}/{controller:slugify=Home}/{action:slugify=Index}/{id:slugify?}");
                endpoints.MapControllerRoute(
                    name: "default",
                    pattern: "{controller:slugify=Home}/{action:slugify=Index}/{id:slugify?}");
            });
            app.UseMvcWithDefaultRoute();

            try
            {
                if (environment != null && (environment.IsProduction() == true || environment.IsStaging() == true))
                {
                    File.WriteAllText("app-startup.log", DateTime.Now.ToString());
                }
            }
            catch (Exception exception)
            {
                Log.Error(exception, "[{LogCategory}] " + "app-startup.log 파일 생성 실패", "Startup/Configure");
            }
        }

        protected void DirectoryCopy(string sourceDir, string destDir)
        {
            Directory.CreateDirectory(destDir);

            foreach (string file in Directory.GetFiles(sourceDir, "*", SearchOption.AllDirectories))
            {
                string destFile = file.Replace(sourceDir, destDir);
                Directory.CreateDirectory(Path.GetDirectoryName(destFile).ToStringSafe());
                File.Copy(file, destFile, true);
            }
        }

        static async Task CopyFileAsync(MemoryStream sourceStream, string destAbsoluteFilePath)
        {
            var destDirectory = Path.GetDirectoryName(destAbsoluteFilePath);
            if (string.IsNullOrEmpty(destDirectory) == false && Directory.Exists(destDirectory) == false)
            {
                Directory.CreateDirectory(destDirectory);
            }

            using (FileStream destStream = new FileStream(destAbsoluteFilePath, FileMode.Create, FileAccess.Write, FileShare.None))
            {
                string destFileName = Path.GetFileName(destAbsoluteFilePath);

                try
                {
                    sourceStream.Position = 0;
                    await sourceStream.CopyToAsync(destStream);
                    Log.Information("[{LogCategory}]" + $"{destFileName} 복사 완료", "Startup/contractsync");
                }
                catch (Exception exception)
                {
                    Log.Error("[{LogCategory}]" + $"{destFileName} 실패. {exception.Message}", "Startup/contractsync");
                }
            }
        }
    }
}
