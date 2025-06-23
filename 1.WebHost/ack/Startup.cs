using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Management;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Runtime.InteropServices;
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
using Microsoft.Extensions.Logging;
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
            var currentProcess = Process.GetCurrentProcess();
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
            GlobalConfiguration.HostAccessID = GetHostAccessID(appSettings["HostAccessID"].ToStringSafe());
            GlobalConfiguration.SystemID = appSettings["SystemID"].ToStringSafe();
            GlobalConfiguration.FindGlobalIDServer = appSettings["FindGlobalIDServer"].ToStringSafe();
            GlobalConfiguration.IsTenantFunction = bool.Parse(appSettings["IsTenantFunction"].ToStringSafe("false"));
            GlobalConfiguration.IsExceptionDetailText = bool.Parse(appSettings["IsExceptionDetailText"].ToStringSafe("false"));
            GlobalConfiguration.IsModulePurgeContract = bool.Parse(appSettings["IsModulePurgeContract"].ToStringSafe("true"));
            GlobalConfiguration.SessionCookieName = appSettings.GetSection("SessionState").Exists() == true && bool.Parse(appSettings["SessionState:IsSession"].ToStringSafe("false")) == true ? appSettings["SessionState:SessionCookieName"].ToStringSafe("") : "";
            GlobalConfiguration.CookiePrefixName = appSettings["CookiePrefixName"].ToStringSafe("HandStack");
            GlobalConfiguration.UserSignExpire = int.Parse(appSettings["UserSignExpire"].ToStringSafe("1440"));

            var hardwareId = GetHardwareID();
            Console.WriteLine($"Current Hardware ID: {hardwareId}");

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
            GlobalConfiguration.LoadContractBasePath = GlobalConfiguration.GetBasePath(PathExtensions.Combine(GlobalConfiguration.EntryBasePath, "..", "contracts"));

            var disposeTenantAppsFilePath = PathExtensions.Combine(GlobalConfiguration.EntryBasePath, "dispose-tenantapps.log");
            if (File.Exists(disposeTenantAppsFilePath) == true)
            {
                using (var file = new StreamReader(disposeTenantAppsFilePath))
                {
                    string? line;
                    while ((line = file.ReadLine()) != null)
                    {
                        if (line.Contains("|") == true)
                        {
                            var userWorkID = line.Split('|')[0];
                            var tenantID = line.Split('|')[1];
                            var path = line.Split('|')[2];
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

                    var mimeTypes = new List<string>();
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
                var cacheType = appSettings["SessionState:CacheType"].ToStringSafe();
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
                else if (cacheType == "Redis")
                {
                    services.AddStackExchangeRedisCache(options =>
                    {
                        options.Configuration = appSettings["SessionState:RedisConnectionString"].ToStringSafe();
                        options.InstanceName = appSettings["SessionState:RedisInstanceName"].ToStringSafe();

                        if (options.Configuration == "")
                        {
                            Log.Error("[{LogCategory}] " + "Redis Cache 환경설정(ConnectionString) 확인 필요", "Startup/ConfigureServices");
                            throw new Exception("Redis Cache 환경설정(ConnectionString) 확인 필요");
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
            services.AddAntiforgery(options =>
            {
                options.Cookie.Name = "X-CSRF-TOKEN";
                options.Cookie.HttpOnly = true;
                options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
                options.Cookie.SameSite = Microsoft.AspNetCore.Http.SameSiteMode.Strict;
                options.HeaderName = "X-CSRF-TOKEN";
                options.FormFieldName = "__RequestVerificationToken";
            });
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
                    var workDirectoryInfo = new DirectoryInfo(userWorkPath);
                    var userWorkID = workDirectoryInfo.Name;
                    foreach (var appBasePath in Directory.GetDirectories(userWorkPath))
                    {
                        var directoryInfo = new DirectoryInfo(appBasePath);
                        if (directoryInfo.Exists == true)
                        {
                            var applicationID = directoryInfo.Name;
                            var tenantID = $"{userWorkID}|{applicationID}";

                            var settingFilePath = PathExtensions.Combine(appBasePath, "settings.json");
                            if (File.Exists(settingFilePath) == true && GlobalConfiguration.DisposeTenantApps.Contains(tenantID) == false)
                            {
                                var appSettingText = File.ReadAllText(settingFilePath);
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

                    var useSameIPProxy = bool.Parse(appSettings["UseSameIPProxy"].ToStringSafe("false"));
                    if (useSameIPProxy == true)
                    {
                        var host = Dns.GetHostEntry(Dns.GetHostName());
                        foreach (var ipAddress in host.AddressList)
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
                        var license = License.Load(ackLicenseKey.DecodeBase64());
                        var currentMachineName = Environment.MachineName;

                        var validationFailure = license.Validate()
                            .Signature(ackLicenseSignature.ToStringSafe())
                            .AssertValidLicense();

                        if (validationFailure != null)
                        {
                            var errorText = $"ack 프로그램 License 오류: {validationFailure.Message}, {validationFailure.HowToResolve}";
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
            var baseContractPath = PathExtensions.Combine(homePath.ToStringSafe(), "contracts");
            if (GlobalConfiguration.IsModulePurgeContract == true)
            {
                if (Directory.Exists(baseContractPath) == true)
                {
                    foreach (var file in Directory.GetFiles(baseContractPath))
                    {
                        File.Delete(file);
                    }

                    foreach (var subdirectory in Directory.GetDirectories(baseContractPath))
                    {
                        Directory.Delete(subdirectory, true);
                    }
                }
            }

            foreach (var module in GlobalConfiguration.Modules)
            {
                if (module.Assembly != null)
                {
                    try
                    {
                        var moduleContractPath = PathExtensions.Combine(module.BasePath, "Contracts");
                        if (module.IsCopyContract == true && Directory.Exists(moduleContractPath) == true)
                        {
                            DirectoryCopy(moduleContractPath, baseContractPath);
                        }
                    }
                    catch
                    {
                        Log.Error("[{LogCategory}] " + $"module: {module.ModuleID} DirectoryCopy 확인 필요", "ack Startup/ConfigureServices");
                        throw;
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
                        var instance = Activator.CreateInstance(moduleInitializerType);
                        if (instance != null)
                        {
                            var moduleInitializer = instance as IModuleInitializer;
                            if (moduleInitializer != null)
                            {
                                try
                                {
                                    if (module.IsPurgeContract == true)
                                    {
                                        foreach (var basePath in module.ContractBasePath)
                                        {
                                            var moduleContractPath = GlobalConfiguration.GetBasePath(basePath);
                                            if (moduleContractPath.StartsWith(GlobalConfiguration.LoadContractBasePath) == true)
                                            {
                                                continue;
                                            }

                                            var ackFile = new FileInfo(PathExtensions.Combine(GlobalConfiguration.EntryBasePath, "ack.dll"));
                                            var directory = new DirectoryInfo(moduleContractPath);
                                            if (ackFile != null && ackFile.Exists == true && directory != null && directory.Exists == true)
                                            {
                                                var appBasePath = ackFile.DirectoryName.ToStringSafe();
                                                var ackHomePath = (ackFile.Directory?.Parent?.FullName.Replace("\\", "/")).ToStringSafe();
                                                var sourceContractDirectory = directory.FullName.Replace("\\", "/");
                                                var targetContractDirectory = PathExtensions.Combine(ackHomePath, "contracts", module.ModuleID);

                                                try
                                                {
                                                    if (Directory.Exists(sourceContractDirectory))
                                                    {
                                                        var files = Directory.GetFiles(sourceContractDirectory, "*", SearchOption.AllDirectories);
                                                        foreach (var baseFile in files)
                                                        {
                                                            var targetFile = baseFile.Replace(sourceContractDirectory, targetContractDirectory);
                                                            if (File.Exists(targetFile) == true)
                                                            {
                                                                File.Delete(targetFile);
                                                                if (module.ModuleID == "function")
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
                                                catch (Exception exception)
                                                {
                                                    Log.Error(exception, $"{module.ModuleID} purgecontracts 오류");
                                                }
                                            }
                                            else
                                            {
                                                if (ackFile?.Exists == false)
                                                {
                                                    Log.Error($"ackFile:{ackFile?.FullName.Replace("\\", "/")} 파일 확인이 필요합니다");
                                                }
                                            }
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
            services.AddSingleton<ModuleConfigurationService>();
            services.AddHostedService<DelayedStartService>();
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
                var contentTypeFilePath = PathExtensions.Combine(GlobalConfiguration.WebRootPath, "contenttype.json");

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
                    var isAuthorized = false;
                    var permissionRoles = GlobalConfiguration.PermissionRoles.Where(x => x.ModuleID == "wwwroot");
                    if (permissionRoles.Any() == true)
                    {
                        var publicRoles = permissionRoles.Where(x => x.RoleID == "Public");
                        for (var i = 0; i < publicRoles.Count(); i++)
                        {
                            var publicRole = publicRoles.ElementAt(i);
                            if (publicRole != null)
                            {
                                var pattern = "";
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
                                                var pattern = "";
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

                var path = context.Request.Path.Value;
                if (path != null && (path.EndsWith(".html", StringComparison.OrdinalIgnoreCase) == true || path.EndsWith(".htm", StringComparison.OrdinalIgnoreCase) == true))
                {
                    context.Response.OnStarting(() =>
                    {
                        if (context.Response.Headers.ContainsKey("Content-Type") == false)
                        {
                            context.Response.Headers.Append("Content-Type", "text/html; charset=utf-8");
                        }
                        context.Response.Headers.Remove("Server");
                        return Task.CompletedTask;
                    });
                }

                await next(context);
            });

            var physicalPath = PathExtensions.Combine(GlobalConfiguration.EntryBasePath, "wwwroot");
            if (Directory.Exists(physicalPath) == true)
            {
                app.UseMiddleware<CaseInsensitiveStaticFileMiddleware>(physicalPath);
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
                        .GetAwaiter()
                        .GetResult();

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
                            httpContext.Context.Response.Headers.Append("Cache-Control", "no-cache, no-store");
                            httpContext.Context.Response.Headers.Append("Expires", "-1");
                        }
                        else if (GlobalConfiguration.StaticFileCacheMaxAge > 0)
                        {
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

            if (environment != null && environment.IsDevelopment() == true)
            {
                app.UseSwagger();
                app.UseSwaggerUI();

                app.UseDeveloperExceptionPage();
            }

            if (string.IsNullOrEmpty(GlobalConfiguration.ServerDevCertFilePath) == false && File.Exists(GlobalConfiguration.ServerDevCertFilePath) == true && string.IsNullOrEmpty(GlobalConfiguration.ServerDevCertPassword) == false)
            {
                app.UseHsts();
            }

            app.UseExceptionHandler(exceptionHandlerApp =>
            {
                exceptionHandlerApp.Run(async context =>
                {
                    var exceptionHandlerFeature = context.Features.Get<IExceptionHandlerFeature>();
                    var exceptionType = exceptionHandlerFeature?.Error;

                    var requestMethod = context.Request.Method;
                    var absoluteUrl = context.Request.GetAbsoluteUrl();
                    var clientIP = context.GetRemoteIpAddress().ToStringSafe();
                    var userAgent = context.Request.Headers["User-Agent"].ToString();
                    var identityName = (context.User.Identity?.Name).ToStringSafe();
                    var statusCode = context.Response.StatusCode;
                    var message = string.Empty;
                    var stackTrace = string.Empty;

                    if (exceptionType != null)
                    {
                        message = exceptionType.Message;
                        stackTrace = exceptionType.StackTrace;
                    }

                    context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                    context.Response.ContentType = Text.Plain;

                    if (context.RequestServices.GetService<IProblemDetailsService>() is { } problemDetailsService)
                    {
                        var problemDetails = new ProblemDetails();
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

            app.UseMiddleware<HtmxTokenInjectionMiddleware>();
            app.UseRouting();

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

            var moduleInitializers = app.ApplicationServices.GetServices<IModuleInitializer>();
            foreach (var moduleInitializer in moduleInitializers)
            {
                Log.Information("[{LogCategory}] " + $"module: {moduleInitializer} Configure", "Startup/Configure");
                moduleInitializer.Configure(app, environment, corsService, corsPolicyProvider);
            }


            if (string.IsNullOrEmpty(GlobalConfiguration.SessionCookieName) == false)
            {
                app.UseSession();
                app.UseMiddleware<UserSessionMiddleware>();
            }

            app.UseMiddleware<UserSignMiddleware>();
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
                        var destModuleBasePath = string.Empty;
                        var destContractModuleBasePath = string.Empty;
                        var handstackHomePath = Environment.GetEnvironmentVariable("HANDSTACK_HOME") ?? "";
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
                                        using var fileStream = new MemoryStream();
                                        await file.CopyToAsync(fileStream);

                                        await CopyFileAsync(fileStream, destModuleBasePath + destFilePath);

                                        if (contractType != "wwwroot")
                                        {
                                            await CopyFileAsync(fileStream, destContractModuleBasePath + destFilePath);
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
                        if (!string.IsNullOrEmpty(hostAccessID) && GlobalConfiguration.HostAccessID == hostAccessID)
                        {
                            var result = new
                            {
                                Environment = new
                                {
                                    ProcessID = Environment.ProcessId,
                                    StartTime = startTime,
                                    ApplicationName = GlobalConfiguration.ApplicationName,
                                    RunningEnvironment = GlobalConfiguration.RunningEnvironment,
                                    HostName = GlobalConfiguration.HostName,
                                    AspNetCoreVersion = Environment.Version.ToString()
                                },
                                Modules = GlobalConfiguration.Modules
                                    .Select(p => new
                                    {
                                        ModuleID = p.ModuleID,
                                        Name = p.Name,
                                        IsBundledWithHost = p.IsBundledWithHost,
                                        EventAction = p.EventAction,
                                        SubscribeAction = p.SubscribeAction,
                                        Version = p.Version.ToString()
                                    })
                                    .ToArray(),
                                Performance = new
                                {
                                    TotalRequests = serverEventListener.AspNetCoreHosting?.TotalRequests ?? 0,
                                    CurrentRequests = serverEventListener.AspNetCoreHosting?.CurrentRequests ?? 0,
                                    FailedRequests = serverEventListener.AspNetCoreHosting?.FailedRequests ?? 0,
                                    MemoryUsageMB = Math.Round(GC.GetTotalMemory(false) / (1024.0 * 1024.0), 2),
                                    GCCollections = new
                                    {
                                        Gen0 = GC.CollectionCount(0),
                                        Gen1 = GC.CollectionCount(1),
                                        Gen2 = GC.CollectionCount(2)
                                    }
                                },
                                DiagnosticCheckTime = DateTime.Now
                            };

                            context.Response.Headers.ContentType = "application/json; charset=utf-8";
                            await context.Response.WriteAsJsonAsync(result, new System.Text.Json.JsonSerializerOptions
                            {
                                WriteIndented = true,
                                PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
                            });
                        }
                        else
                        {
                            var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
                            logger.LogWarning("HostAccessID 확인 필요: {HostAccessID}", hostAccessID ?? "null");
                            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        }
                    }
                    catch (Exception exception)
                    {
                        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
                        logger.LogError(exception, "진단 정보 조회 실패");
                        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
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

            foreach (var file in Directory.GetFiles(sourceDir, "*", SearchOption.AllDirectories))
            {
                var destFile = file.Replace(sourceDir, destDir);
                Directory.CreateDirectory(Path.GetDirectoryName(destFile).ToStringSafe());
                File.Copy(file, destFile, true);
            }
        }

        protected async Task CopyFileAsync(MemoryStream sourceStream, string destAbsoluteFilePath)
        {
            var destDirectory = Path.GetDirectoryName(destAbsoluteFilePath);
            if (string.IsNullOrEmpty(destDirectory) == false && Directory.Exists(destDirectory) == false)
            {
                Directory.CreateDirectory(destDirectory);
            }

            using var destStream = new FileStream(destAbsoluteFilePath, FileMode.Create, FileAccess.Write, FileShare.None);
            var destFileName = Path.GetFileName(destAbsoluteFilePath);

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

        protected string GetHostAccessID(string hostAccessID)
        {
            var result = "HANDSTACK_HOSTACCESSID";

            var isRunningInDocker = Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true";
            if (isRunningInDocker == true)
            {
                result = hostAccessID;
            }
            else
            {
                if (hostAccessID == result)
                {
                    try
                    {
                        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows) == true)
                        {
                            result = GetWindowsHardwareID();
                        }
                        else if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux) == true)
                        {
                            result = GetLinuxHardwareID();
                        }
                        else if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX) == true)
                        {
                            result = GetMacHardwareID();
                        }
                    }
                    catch (Exception exception)
                    {
                        Log.Logger.Warning(exception, "[{LogCategory}] " + $"HostAccessID 확인 오류", $"Startup/GetHostAccessID");
                    }
                }
                else
                {
                    result = hostAccessID;
                }
            }

            return result.ToSHA256();
        }

        protected string GetHardwareID()
        {
            var result = "HANDSTACK_HOSTACCESSID";

            var isRunningInDocker = Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true";
            if (isRunningInDocker == true)
            {
                result = GlobalConfiguration.HostAccessID;
            }
            else
            {
                if (GlobalConfiguration.HostAccessID == result)
                {
                    try
                    {
                        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows) == true)
                        {
                            result = GetWindowsHardwareID();
                        }
                        else if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux) == true)
                        {
                            result = GetLinuxHardwareID();
                        }
                        else if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX) == true)
                        {
                            result = GetMacHardwareID();
                        }
                    }
                    catch (Exception exception)
                    {
                        Log.Logger.Warning(exception, "[{LogCategory}] " + $"HardwareID 확인 오류", $"Startup/GetHostAccessID");
                    }
                }
                else
                {
                    result = GlobalConfiguration.HostAccessID;
                }
            }

            return result;
        }

        protected string GetWindowsHardwareID()
        {
            var result = "";
#pragma warning disable CA1416 // 플랫폼 호환성 유효성 검사
            var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_Processor");
            foreach (ManagementObject obj in searcher.Get())
            {
                result = obj["ProcessorId"].ToStringSafe("HANDSTACK_HOSTACCESSID");
            }
#pragma warning restore CA1416 // 플랫폼 호환성 유효성 검사
            return result;
        }

        protected string GetLinuxHardwareID()
        {
            return ExecuteBashCommand("dmidecode -s system-uuid");
        }

        protected string GetMacHardwareID()
        {
            return ExecuteBashCommand("ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID | awk '{print $3}' | sed 's/\\\"//g'");
        }

        protected string ExecuteBashCommand(string command)
        {
            var result = "";
            var psi = new ProcessStartInfo
            {
                FileName = "/bin/bash",
                Arguments = $"-c \"{command}\"",
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using (var process = Process.Start(psi))
            {
                if (process != null)
                {
                    result = process.StandardOutput.ReadToEnd().Trim();
                }
                else
                {
                    result = "HANDSTACK_HOSTACCESSID";
                }
            }
            return result;
        }
    }
}
