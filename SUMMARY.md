# HandStack 주요 소스코드 요약 설명

HandStack 솔루션은 `ack` 프로그램이 전역 런타임을 제공하고, 업무 모듈이 자신의 설정과 자산과 계약을 들고 올라오며, `transact`와 `function` 과 같은 모듈 들이 계약 기반으로 업무를 실행하는 확장형 웹 애플리케이션 플랫폼입니다.

그래서 소스코드를 보실 때는 개별 프로젝트의 코드보다 먼저 아래 세 가지를 기준으로 보시는 것이 좋습니다.

- 어떤 호스트가 런타임을 여는지
- 어떤 모듈이 어떤 계약과 자산을 제공하는지
- 거래가 어느 모듈로 라우팅되고 어디서 실제 실행되는지

이 문서의 5개 장은 그 세 가지의 기준에 답하도록 다음과 같이 구성했습니다.

HandStack 을 처음 접하는 담당자나 개발자가 "어디서 시작해야 하는지", "요청이 어떻게 흐르는지", "왜 이 구조가 모듈형인지"를 빠르게 파악하도록 돕기 위한 소스코드 중심으로 요약합니다. 설명은 실제 진입점 코드와 설정 파일을 기준으로 정리했습니다.

---

## 1장. 솔루션 디렉토리 구조

HandStack 솔루션은 단순한 ASP.NET Core 단일 웹앱이 아니라, 호스트 + 기능 모듈 + 공통 인프라 + 운영 도구로 나뉜 플랫폼 구조입니다. `handstack.sln`에 등록된 프로젝트를 보면 이 분할이 바로 드러납니다.

```text
1.WebHost
  ack          : 메인 ASP.NET Core 호스트
  forbes       : 추가 웹 호스트
  agent        : 보조 호스트/에이전트

2.Modules
  wwwroot      : 정적 자산, 계약 기반 화면, 공용 UI/API
  transact     : 거래 계약 해석, 라우팅, 응답 조립
  function     : 계약 기반 함수 실행(Node/C#/Python)
  dbclient     : DB 질의 실행
  logger       : 로그 수집
  repository   : 파일/리포지토리 기능
  checkup      : 운영/관리 기능
  forwarder    : 프록시/전달 기능

3.Infrastructure
  HandStack.Core
  HandStack.Web
  HandStack.Data

4.Tool/CLI
  handstack
  handsonapp
  bundling
  edgeproxy
  excludedportrange
  ports
```

솔루션의 실제 빌드 순서도 이 구조를 그대로 반영합니다. `build.ps1`은 모듈을 먼저 빌드하고, 그 다음 호스트, 마지막으로 CLI를 빌드합니다.

```powershell
$buildGroups = @(
    @{
        Name = "Modules"
        Projects = @(
            @{ Label = "wwwroot"; Path = "2.Modules\\wwwroot\\wwwroot.csproj" }
            @{ Label = "dbclient"; Path = "2.Modules\\dbclient\\dbclient.csproj" }
            @{ Label = "function"; Path = "2.Modules\\function\\function.csproj" }
            @{ Label = "logger"; Path = "2.Modules\\logger\\logger.csproj" }
            @{ Label = "repository"; Path = "2.Modules\\repository\\repository.csproj" }
            @{ Label = "transact"; Path = "2.Modules\\transact\\transact.csproj" }
            @{ Label = "checkup"; Path = "2.Modules\\checkup\\checkup.csproj" }
        )
    }
)
```

이 순서는 다음의 규칙으로 프로그램의 실행 순서와 밀접한 관련이 있습니다.

- `ack`는 실행 시점에 여러 모듈 DLL을 동적으로 읽습니다.
- 따라서 기능 모듈이 먼저 준비되어야 호스트가 정상 기동됩니다.
- `HandStack.Web`, `HandStack.Core`, `HandStack.Data`는 모듈과 호스트가 공통으로 사용하는 계약과 유틸리티 계층입니다.

즉 HandStack을 이해하는 가장 좋은 관점은 "웹앱 하나"가 아니라 "`ack`라는 런타임 위에 필요한 모듈을 꽂아 쓰는 플랫폼"이라고 보는 것입니다.

---

## 2장. `ack` 호스트와 전역 설정 부트스트랩

메인 진입점은 [`1.WebHost/ack/Program.cs`](1.WebHost/ack/Program.cs)입니다. 여기서 런타임 경로, 환경 변수, 포트, 로드할 모듈 목록, 로그 설정을 먼저 확정한 뒤 실제 ASP.NET Core 호스트를 기동합니다.

```csharp
var optionPort = new Option<int?>("--port");
var optionDebug = new Option<bool?>("--debug");
var optionDelay = new Option<int?>("--delay");
var rootOptionModules = new Option<string?>("--modules");

var rootCommand = new RootCommand(...) {
    optionDebug, optionDelay, optionPort, rootOptionModules,
    optionKey, optionAppSettings, optionProcessName, optionShowEnv
};

GlobalConfiguration.EntryBasePath = AppDomain.CurrentDomain.BaseDirectory;
var configurationBuilder = new ConfigurationBuilder().AddJsonFile(appSettingsFilePath);
configurationBuilder.AddEnvironmentVariables();
GlobalConfiguration.ConfigurationRoot = configuration;

GlobalConfiguration.ServerPort = port ?? int.Parse(configuration["AppSettings:ServerPort"].ToStringSafe("8421"));
GlobalConfiguration.ExternalIPAddress = await GetExternalIPAddress();
```

여기서 중요한 점은 세 가지입니다.

1. `GlobalConfiguration`이 사실상 프로세스 전체의 런타임 컨텍스트입니다.
2. `appsettings.json`과 환경 변수를 합쳐 최종 설정을 만듭니다.
3. `--modules=wwwroot,transact,...`처럼 실행 시점에 로드 모듈을 바꿀 수 있습니다.

실제 기본 모듈 목록은 [`1.WebHost/ack/appsettings.json`](1.WebHost/ack/appsettings.json)에 선언되어 있습니다.

```json
"LoadModules": [
  "wwwroot",
  "transact",
  "dbclient",
  "function",
  "repository",
  "logger",
  "checkup",
  "forwarder"
]
```

그 다음 [`1.WebHost/ack/ApplicationManager.cs`](1.WebHost/ack/ApplicationManager.cs)가 Kestrel을 올립니다.

```csharp
host = CreateWebHostBuilder(port, args).Build();
GlobalConfiguration.ServerLocalIP = GetLocalIPv4Address();
GlobalConfiguration.IsRunning = true;
await host.RunAsync(cancellationTokenSource.Token);
```

[`1.WebHost/ack/Startup.cs`](1.WebHost/ack/Startup.cs)는 여기서 한 단계 더 들어가 실제 운영 환경을 구성합니다. `HostAccessID`, `TenantAppBasePath`, `LoadModuleBasePath`, 세션, CORS, IP 허용 목록, 로그, antiforgery, 계약 동기화 같은 운영 관련 설정이 모두 여기서 `GlobalConfiguration`으로 정리됩니다.

```csharp
GlobalConfiguration.HostAccessID = GetHostAccessID(appSettings["HostAccessID"].ToStringSafe());
GlobalConfiguration.TenantAppBasePath = GlobalConfiguration.GetBaseDirectoryPath(appSettings["TenantAppBasePath"], $"{handstackHomePath}\\tenants");
GlobalConfiguration.LoadModuleBasePath = GlobalConfiguration.GetBaseDirectoryPath(appSettings["LoadModuleBasePath"]);
GlobalConfiguration.LoadContractBasePath = GlobalConfiguration.GetBaseDirectoryPath(
    PathExtensions.Combine(GlobalConfiguration.EntryBasePath, "..", "contracts"));
```

정리하면 `ack`는 단순 MVC 호스트가 아니라, 다음 책임을 가진 "플랫폼 런처"입니다.

- 실행 환경과 디렉터리를 표준화합니다.
- 전역 설정/보안/세션/로그를 초기화합니다.
- 모듈 디렉터리를 스캔하고 동적으로 로드합니다.
- 모듈별 정적 파일, 계약 파일, API 기능을 하나의 ASP.NET Core 파이프라인으로 합성합니다.

---

## 3장. 모듈 로딩 아키텍처

HandStack의 핵심 확장 포인트는 [`3.Infrastructure/HandStack.Web/Modules/IModuleInitializer.cs`](3.Infrastructure/HandStack.Web/Modules/IModuleInitializer.cs) 하나로 요약됩니다.

```csharp
public interface IModuleInitializer
{
    void ConfigureServices(IServiceCollection services, IWebHostEnvironment environment, IConfiguration configuration);

    void Configure(IApplicationBuilder app, IWebHostEnvironment? environment, ICorsService corsService, ICorsPolicyProvider corsPolicyProvider);
}
```

즉 각 모듈은 ASP.NET Core의 `Startup` 일부를 플러그인처럼 구현합니다. 호스트는 이 인터페이스를 찾아 서비스 등록과 미들웨어 구성을 모듈 단위로 위임합니다.

모듈 검색은 [`3.Infrastructure/HandStack.Web/Modules/ModuleConfigurationManager.cs`](3.Infrastructure/HandStack.Web/Modules/ModuleConfigurationManager.cs)가 담당합니다.

```csharp
foreach (var moduleBasePath in Directory.GetDirectories(GlobalConfiguration.LoadModuleBasePath))
{
    var moduleSettingFilePath = PathExtensions.Combine(moduleBasePath, "module.json");
    var content = File.ReadAllText(moduleSettingFilePath);
    module = JsonConvert.DeserializeObject<DefaultModuleConfigJson>(content, ModuleJsonSerializerSettings);

    moduleInfo.ModuleID = moduleID;
    moduleInfo.BasePath = moduleBasePath;
    moduleInfo.ModuleSettingFilePath = moduleSettingFilePath;
    moduleInfo.ContractBasePath = [.. module.ModuleConfig.ContractBasePath];
}
```

실제 DLL 로딩은 [`1.WebHost/ack/Extensions/ServiceCollectionExtensions.cs`](1.WebHost/ack/Extensions/ServiceCollectionExtensions.cs)에서 수행합니다.

```csharp
public static IServiceCollection AddModules(this IServiceCollection services)
{
    foreach (var module in modulesConfig.GetModules())
    {
        if (module.IsBundledWithHost == false)
        {
            TryLoadModuleAssembly(module.ModuleID, module);
        }

        GlobalConfiguration.Modules.Add(module);
    }

    return services;
}
```

그리고 `Startup`이 각 모듈의 `ModuleInitializer`를 실행합니다.

```csharp
var moduleInitializerType = module.Assembly.GetTypes()
    .FirstOrDefault(t => typeof(IModuleInitializer).IsAssignableFrom(t));

var instance = Activator.CreateInstance(moduleInitializerType);
var moduleInitializer = instance as IModuleInitializer;

services.AddSingleton(typeof(IModuleInitializer), moduleInitializer);
moduleInitializer.ConfigureServices(services, environment, configuration);
```

애플리케이션 파이프라인 단계에서도 다시 호출됩니다.

```csharp
var moduleInitializers = app.ApplicationServices.GetServices<IModuleInitializer>();
foreach (var moduleInitializer in moduleInitializers)
{
    moduleInitializer.Configure(app, environment, corsService, corsPolicyProvider);
}
```

이 구조의 장점은 명확합니다.

- 호스트는 모듈 구현 세부사항을 모릅니다.
- 모듈은 `module.json`과 `ModuleInitializer`만 맞추면 런타임에 합성됩니다.
- 계약 파일 경로, 정적 자산, 로그 경로, 파일 감시까지 모듈별로 독립 구성할 수 있습니다.

예를 들어 [`2.Modules/wwwroot/module.json`](2.Modules/wwwroot/module.json)은 화면 계약과 정적 자산 경로를 선언하고,

```json
{
  "ModuleID": "wwwroot",
  "ModuleConfig": {
    "ContractRequestPath": "view",
    "ContractBasePath": "../contracts/wwwroot",
    "WWWRootBasePath": "../modules/wwwroot/wwwroot"
  }
}
```

[`2.Modules/transact/module.json`](2.Modules/transact/module.json)은 거래 계약 경로와 라우팅 정책을 선언합니다.

```json
"RoutingCommandUri": {
  "HDS|*|D|D": "http://localhost:8421/dbclient/api/query",
  "HDS|*|F|D": "http://localhost:8421/function/api/execution",
  "HDS|*|P|D": "http://localhost:8421/prompter/api/query"
}
```

결국 HandStack의 모듈은 "컨트롤러 묶음"이 아니라 다음 4가지를 함께 갖는 배포 단위입니다.

- DLL 파일
- `module.json` 설정 파일
- `wwwroot` 정적 자산
- `Contracts/*` 계약 데이터

---

## 4장. 계약 기반 실행 파이프라인: `wwwroot` -> `transact` -> `function`

이 솔루션에서 가장 중요한 업무 흐름은 화면이 직접 DB를 두드리는 구조가 아니라, 계약 기반 거래 실행 체인이라는 점입니다. 대략적인 흐름은 아래와 같습니다.

```text
브라우저/화면
  -> wwwroot
  -> transact
  -> dbclient 또는 function
  -> 응답 조립
```

### 4.1 `wwwroot`: 요청 ID와 화면용 공통 API

[`2.Modules/wwwroot/Areas/wwwroot/Controllers/IndexController.cs`](2.Modules/wwwroot/Areas/wwwroot/Controllers/IndexController.cs)의 `CreateID`는 거래 요청 전에 사용할 요청 토큰을 만듭니다.

```csharp
var requestID = GetRequestID(transactionObject, tokenID);
if (distributedCache.Get(requestID) != null)
{
    distributedCache.Remove(requestID);
}

var options = new DistributedCacheEntryOptions()
    .SetAbsoluteExpiration(TimeSpan.FromMinutes(fromMinutes == null ? 10 : (int)fromMinutes));
distributedCache.Set(requestID, "".ToByte(Encoding.UTF8), options);
```

이 코드는 화면이 서버 거래를 호출하기 전 "유효한 요청인지"를 서버가 검증할 수 있게 해줍니다. 옵션에 따라 antiforgery 토큰도 함께 발급합니다.

### 4.2 `transact`: 거래 계약 해석과 라우팅

실제 거래 진입점은 [`2.Modules/transact/Areas/transact/Controllers/TransactionController.cs`](2.Modules/transact/Areas/transact/Controllers/TransactionController.cs)의 `Execute`입니다.

```csharp
if (ModuleConfiguration.IsValidationRequest == true)
{
    if (distributedCache.Get(request.Transaction.GlobalID) == null)
    {
        response.ExceptionText = "잘못된 요청";
        return Content(JsonConvert.SerializeObject(response), "application/json");
    }
}

var isAllowRequestTransactions = false;
if (ModuleConfiguration.AllowRequestTransactions.ContainsKey("*") == true)
{
    isAllowRequestTransactions = true;
}
```

여기서는 단순히 비즈니스 로직을 실행하지 않습니다. 먼저 다음을 처리합니다.

- 요청 유효성을 검사합니다.
- 중복 요청을 방지합니다.
- 허용된 애플리케이션/프로젝트인지 검사합니다.
- 입력 데이터 포맷을 보정합니다.
- 거래 로그를 기록합니다.
- 계약 메타데이터를 조회합니다.

그 다음 계약 JSON을 읽고 어떤 실행 모듈로 보낼지 결정합니다. 샘플 계약 [`2.Modules/wwwroot/Contracts/transact/HDS/TST/AGD010.json`](2.Modules/wwwroot/Contracts/transact/HDS/TST/AGD010.json)은 이런 모양입니다.

```json
{
  "ApplicationID": "HDS",
  "ProjectID": "TST",
  "TransactionID": "AGD010",
  "Services": [
    {
      "ServiceID": "LD01",
      "ReturnType": "Json",
      "CommandType": "R"
    }
  ]
}
```

즉 화면이나 외부 호출자는 코드가 아니라 계약 ID로 기능을 호출합니다. `transact`는 이 계약을 해석해서 `dbclient`, `function` 중 어디로 보낼지를 `RoutingCommandUri` 규칙으로 결정합니다.

### 4.3 `function`: 다중 런타임 함수 실행

`function` 모듈은 거래를 받아 실제 서버 기능을 실행합니다. 진입점은 [`2.Modules/function/Areas/function/Controllers/ExecutionController.cs`](2.Modules/function/Areas/function/Controllers/ExecutionController.cs)입니다.

```csharp
switch (request.ReturnType)
{
    case ExecuteDynamicTypeObject.Json:
    case ExecuteDynamicTypeObject.DynamicJson:
        await dataClient.ExecuteScriptMap(request, response);
        break;
    default:
        response.ExceptionText = "지원하지 않는 결과 타입. 요청 정보 확인 필요";
        break;
}
```

이 모듈의 핵심은 "함수를 코드로 직접 연결하지 않고 계약으로 연결한다"는 점입니다. [`2.Modules/function/module.json`](2.Modules/function/module.json)을 보면 런타임별 설정이 분리되어 있습니다.

```json
"NodeFunctionConfig": {
  "EnableFileWatching": true,
  "WatchFileNamePatterns": [ "featureMain.js", "featureMeta.json" ]
},
"CSharpFunctionConfig": {
  "EnableFileWatching": true,
  "WatchFileNamePatterns": [ "featureMain.cs", "featureMeta.json" ]
},
"PythonFunctionConfig": {
  "EnablePythonDLL": false,
  "WatchFileNamePatterns": [ "featureMain.py", "featureMeta.json" ]
}
```

이 말은 HandStack이 기능을 다음처럼 취급한다는 뜻입니다.

- 함수 메타데이터: `featureMeta.json`
- 실제 구현: `featureMain.js` 또는 `featureMain.cs` 또는 `featureMain.py`
- 변경 감지: 파일 감시를 통해 자동으로 리프레시합니다.

예를 들어 [`2.Modules/checkup/Contracts/function/HDS/HAC/HAC000/featureMeta.json`](2.Modules/checkup/Contracts/function/HDS/HAC/HAC000/featureMeta.json)은 "이 기능이 어떤 파라미터를 받고 어떤 명령을 제공하는지"를 선언하고, [`2.Modules/checkup/Contracts/function/HDS/HAC/HAC000/featureMain.cs`](2.Modules/checkup/Contracts/function/HDS/HAC/HAC000/featureMain.cs)은 실제 C# 구현을 제공합니다.

```csharp
string url = $"{transactServerUrl}/summary?userWorkID={userWorkID}&applicationID={applicationID}&year={year}&weekOfYear={weekOfYear}&requestDate={currentDate}";
var client = new RestClient();
var request = new RestRequest(url, Method.Get);

request.AddHeader("AuthorizationKey", ModuleConfiguration.AuthorizationKey);
RestResponse response = client.Execute(request);
```

이 예제는 특히 의미가 큽니다. `checkup`의 C# 함수가 다시 `transact` 집계 API를 호출해 운영 대시보드를 만들고 있기 때문입니다. 즉 모듈은 고정된 계층이 아니라, 계약과 API를 통해 서로를 다시 조합하는 구조입니다.

요약하면 4장의 핵심은 다음과 같습니다.

- `wwwroot`는 화면과 요청 토큰을 담당합니다.
- `transact`는 계약 해석, 검증, 라우팅, 응답 조립을 담당합니다.
- `function`은 계약 기반 서버 기능을 Node/C#/Python 런타임에서 실행합니다.
- `checkup` 같은 상위 모듈은 이 흐름 위에서 관리 기능을 다시 구성합니다.

---

## 5장. 정적 자산, 운영 도구, 그리고 추천 읽기 순서

HandStack은 서버만 있는 프레임워크가 아닙니다. 정적 자산과 운영 CLI도 중요한 일부입니다.

### 5.1 `wwwroot` 모듈은 사실상 프런트엔드 플랫폼

[`2.Modules/wwwroot/ModuleInitializer.cs`](2.Modules/wwwroot/ModuleInitializer.cs)는 계약 폴더와 `wwwroot` 폴더를 정적 파일로 노출합니다.

```csharp
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(wwwrootContractBasePath),
    RequestPath = "/" + GlobalConfiguration.ContractRequestPath,
    ServeUnknownFileTypes = true
});

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(PathExtensions.Combine(wwwrootDirectory)),
    ServeUnknownFileTypes = true
});
```

즉 HandStack의 화면은 보통 다음 두 가지 자산을 함께 사용합니다.

- `/view/...` 아래 계약 기반 화면 자산
- 모듈 `wwwroot` 아래 공용 JS/CSS/UI 컨트롤

이 때문에 `2.Modules/wwwroot`에는 Gulp, 번들 설정, 대량의 UI 컨트롤, 샘플 계약이 함께 들어 있습니다. 이 프로젝트는 단순 정적 리소스 폴더가 아니라 공용 웹 런타임에 가깝습니다.

### 5.2 `handstack` CLI는 배포/운영 자동화 도구

[`4.Tool/CLI/handstack/Program.cs`](4.Tool/CLI/handstack/Program.cs)는 생각보다 넓은 범위를 다룹니다. 코드에서 등록된 명령만 봐도 운영 도구 성격이 분명합니다.

```text
list
configuration
purgecontracts
encryptcontracts
start
stop
encrypt
decrypt
compress
extract
create
task
publickey
```

이 CLI는 다음 역할을 맡습니다.

- `ack`를 시작하거나 중지합니다.
- 환경설정 파일을 배치합니다.
- 계약 파일을 정리하고 암호화합니다.
- ZIP 압축 및 해제를 수행합니다.
- 템플릿 기반으로 앱을 생성합니다.
- 운영체제별 작업 스크립트를 실행합니다.

즉 이 솔루션은 "앱 코드만 있는 저장소"가 아니라 개발, 실행, 배포, 운영 루틴까지 함께 제공하는 풀스택 작업공간입니다.

### 5.3 이 솔루션을 읽는 추천 순서

처음 읽으신다면 아래 순서가 가장 효율적입니다.

1. [`README.md`](README.md)
2. [`1.WebHost/ack/Program.cs`](1.WebHost/ack/Program.cs)
3. [`1.WebHost/ack/Startup.cs`](1.WebHost/ack/Startup.cs)
4. [`3.Infrastructure/HandStack.Web/GlobalConfiguration.cs`](3.Infrastructure/HandStack.Web/GlobalConfiguration.cs)
5. [`3.Infrastructure/HandStack.Web/Modules/IModuleInitializer.cs`](3.Infrastructure/HandStack.Web/Modules/IModuleInitializer.cs)
6. [`1.WebHost/ack/Extensions/ServiceCollectionExtensions.cs`](1.WebHost/ack/Extensions/ServiceCollectionExtensions.cs)
7. [`2.Modules/transact/Areas/transact/Controllers/TransactionController.cs`](2.Modules/transact/Areas/transact/Controllers/TransactionController.cs)
8. [`2.Modules/function/Areas/function/Controllers/ExecutionController.cs`](2.Modules/function/Areas/function/Controllers/ExecutionController.cs)
9. [`2.Modules/wwwroot/Areas/wwwroot/Controllers/IndexController.cs`](2.Modules/wwwroot/Areas/wwwroot/Controllers/IndexController.cs)
10. 각 모듈의 `module.json`과 `Contracts/*`

이 순서대로 보시면 HandStack을 "호스트가 모듈을 로드하고, 모듈이 계약을 읽고, 계약이 실제 기능을 호출하는 구조"로 자연스럽게 이해하실 수 있습니다.