# 서드파티 고지 (Third-Party Notices)

HandStack 은 [MIT 라이선스](LICENSE.md)로 배포됩니다. 이 문서는 HandStack 이 빌드·설치·실행 과정에서 사용하는 서드파티 구성요소와 각 구성요소의 라이선스를 나열합니다. 각 구성요소의 저작권과 라이선스 조건은 해당 구성요소의 소유자에게 있으며, 아래 목록은 편의를 위한 요약이므로 정확한 조건은 링크된 원문을 따르세요.

> 이 파일은 `node third-party-notices.js` 로 생성됩니다. 의존성을 추가·변경한 뒤에는 다시 생성해 반영하세요. 네트워크 연결과 `dotnet restore` 가 끝난 NuGet 캐시가 필요합니다.

| 구분 | 수량 | 출처 |
| --- | --- | --- |
| NuGet | 75 | 모든 `*.csproj` 의 PackageReference |
| npm (런타임) | 20 | `1.WebHost/ack/package.json`, `2.Modules/function/package.json`, `2.Modules/wwwroot/package.json` 의 dependencies (직접 의존성, 하위 의존성 제외) |
| npm (빌드 도구) | 9 | 같은 package.json 의 devDependencies (직접 의존성) |
| libman | 47 | `2.Modules/wwwroot/libman.json` |

## 검토가 필요한 구성요소

허용형(MIT, ISC, BSD, Apache-2.0 등)이 아니거나 라이선스를 자동으로 판별하지 못한 항목입니다. 배포 전에 조건(재배포·상업적 사용·링크 방식 등)을 확인하세요.

| 구분 | 구성요소 | 라이선스 | 비고 |
| --- | --- | --- | --- |
| NuGet | Hangfire.AspNetCore 1.8.25 | 파일 라이선스 (LICENSE.md) |  |
| NuGet | Hangfire.Core 1.8.25 | 파일 라이선스 (LICENSE.md) |  |
| NuGet | MySql.EntityFrameworkCore 10.0.9 | GPL-2.0-only WITH Universal-FOSS-exception-1.0 |  |
| NuGet | Oracle.EntityFrameworkCore 10.23.26301 | 파일 라이선스 (LICENSE.txt) |  |
| NuGet | Oracle.ManagedDataAccess.Core 23.26.301 | 파일 라이선스 (LICENSE.txt) |  |
| libman | superplaceholder 1.0.0 | CC-BY-ND-4.0 |  |
| libman | tinymce 5.10.9 | LGPL-2.0 |  |
| libman | highcharts 11.4.8 | https://www.highcharts.com/license |  |
| libman | wwwroot/js/auigrid (저장소 포함) | REVIEW | 저장소에 직접 포함된 파일입니다. 벤더 라이선스 조건을 별도로 확인하세요. |

## NuGet 패키지

| 패키지 | 버전 | 라이선스 | 링크 | 비고 |
| --- | --- | --- | --- | --- |
| Anthropic | 12.53.0 | MIT | https://docs.anthropic.com/claude/reference/ |  |
| AWSSDK.S3 | 4.0.104.1 | Apache-2.0 | https://github.com/aws/aws-sdk-net/ |  |
| Azure.Core | 1.63.0 | MIT | https://github.com/Azure/azure-sdk-for-net/blob/Azure.Core_1.63.0/sdk/core/Azure.Core/README.md |  |
| Azure.Storage.Blobs | 12.30.0 | MIT | https://github.com/Azure/azure-sdk-for-net/blob/Azure.Storage.Blobs_12.30.0/sdk/storage/Azure.Storage.Blobs/README.md |  |
| BouncyCastle.Cryptography | 2.7.0 | MIT | https://www.bouncycastle.org/stable/nuget/csharp/website |  |
| BundlerMinifier.Core | 3.2.449 | Apache-2.0 | https://www.nuget.org/packages/BundlerMinifier.Core/3.2.449 | licenseUrl 본문 기준 (https://github.com/madskristensen/BundlerMinifier/blob/master/LICENSE) |
| ChoETL.JSON.NETStandard | 1.2.1.72 | MIT | https://github.com/Cinchoo/ChoETL | licenseUrl 본문 기준 (https://github.com/Cinchoo/ChoETL/blob/master/LICENSE) |
| Dapper | 2.1.89 | Apache-2.0 | https://dapperlib.dev/ |  |
| DotNetEnv | 3.2.0 | MIT | https://github.com/tonerdo/dotnet-env | 라이선스 파일(LICENSE) 본문 기준 |
| Google.Apis | 1.77.0 | Apache-2.0 | https://github.com/googleapis/google-api-dotnet-client |  |
| Google.Apis.Auth | 1.77.0 | Apache-2.0 | https://github.com/googleapis/google-api-dotnet-client |  |
| Google.Cloud.Storage.V1 | 5.0.0 | Apache-2.0 | https://github.com/googleapis/google-cloud-dotnet |  |
| Google.GenAI | 1.24.0 | Apache-2.0 | https://github.com/googleapis/dotnet-genai |  |
| Hangfire.AspNetCore | 1.8.25 | 파일 라이선스 (LICENSE.md) | https://www.hangfire.io/ |  |
| Hangfire.Core | 1.8.25 | 파일 라이선스 (LICENSE.md) | https://www.hangfire.io/ |  |
| HtmlAgilityPack | 1.13.0 | MIT | http://html-agility-pack.net/ |  |
| Jering.Javascript.NodeJS | 7.0.0 | Apache-2.0 | https://www.jering.tech/utilities/jering.javascript.nodejs/index | licenseUrl 본문 기준 (https://github.com/JeringTech/Javascript.NodeJS/blob/master/License.md) |
| Mediator.Abstractions | 3.0.2 | MIT | https://github.com/martinothamar/Mediator | 라이선스 파일(LICENSE) 본문 기준 |
| Microsoft.AspNetCore.Mvc.NewtonsoftJson | 10.0.12 | MIT | https://asp.net/ |  |
| Microsoft.Bcl.AsyncInterfaces | 10.0.12 | MIT | https://dot.net/ |  |
| Microsoft.CodeAnalysis.Compilers | 5.9.0 | MIT | https://github.com/dotnet/roslyn |  |
| Microsoft.CodeAnalysis.CSharp | 5.9.0 | MIT | https://github.com/dotnet/roslyn |  |
| Microsoft.Data.SqlClient | 7.1.1 | MIT | https://aka.ms/sqlclientproject |  |
| Microsoft.EntityFrameworkCore | 10.0.12 | MIT | https://docs.microsoft.com/ef/core/ |  |
| Microsoft.EntityFrameworkCore.Relational | 10.0.12 | MIT | https://docs.microsoft.com/ef/core/ |  |
| Microsoft.Extensions.Caching.StackExchangeRedis | 10.0.12 | MIT | https://asp.net/ |  |
| Microsoft.Extensions.Configuration | 10.0.12 | MIT | https://dot.net/ |  |
| Microsoft.Extensions.Configuration.Json | 10.0.12 | MIT | https://dot.net/ |  |
| Microsoft.Extensions.Hosting.Systemd | 10.0.12 | MIT | https://dot.net/ |  |
| Microsoft.Extensions.Hosting.WindowsServices | 10.0.12 | MIT | https://dot.net/ |  |
| Microsoft.SemanticKernel | 1.80.1 | MIT | https://aka.ms/semantic-kernel |  |
| Microsoft.SemanticKernel.Core | 1.80.1 | MIT | https://aka.ms/semantic-kernel |  |
| Microsoft.Win32.SystemEvents | 10.0.12 | MIT | https://dot.net/ |  |
| murmurhash | 1.0.3 | Apache-2.0 | https://github.com/darrenkopp/murmurhash-net | licenseUrl 본문 기준 (https://github.com/darrenkopp/murmurhash-net/blob/master/LICENSE.md) |
| MySql.EntityFrameworkCore | 10.0.9 | GPL-2.0-only WITH Universal-FOSS-exception-1.0 | https://github.com/mysql/mysql-connector-net |  |
| MySqlConnector | 2.6.2 | MIT | https://mysqlconnector.net/ |  |
| Neo4j.Driver | 6.3.0 | Apache-2.0 | https://github.com/neo4j/neo4j-dotnet-driver |  |
| Newtonsoft.Json | 13.0.4 | MIT | https://www.newtonsoft.com/json |  |
| Npgsql | 10.0.3 | PostgreSQL | https://github.com/npgsql/npgsql |  |
| Npgsql.EntityFrameworkCore.PostgreSQL | 10.0.3 | PostgreSQL | https://github.com/npgsql/efcore.pg |  |
| NUglify | 1.23.3 | Apache-2.0 | https://github.com/jbest84/NUglify | 라이선스 파일(license.txt) 본문 기준 |
| Octokit | 14.0.0 | MIT | https://github.com/octokit/octokit.net |  |
| OpenAI | 2.14.0 | MIT | https://github.com/openai/openai-dotnet/tree/OpenAI_2.14.0 |  |
| Oracle.EntityFrameworkCore | 10.23.26301 | 파일 라이선스 (LICENSE.txt) | https://www.oracle.com/database/technologies/appdev/dotnet.html |  |
| Oracle.ManagedDataAccess.Core | 23.26.301 | 파일 라이선스 (LICENSE.txt) | https://www.oracle.com/database/technologies/appdev/dotnet.html |  |
| PdfPig | 0.1.16 | Apache-2.0 | https://github.com/UglyToad/PdfPig |  |
| Polly | 8.8.0 | BSD-3-Clause | https://github.com/App-vNext/Polly |  |
| pythonnet | 3.2.0 | MIT | https://pythonnet.github.io/ | 라이선스 파일(LICENSE) 본문 기준 |
| RestSharp | 114.0.0 | Apache-2.0 | https://restsharp.dev/ |  |
| Serilog | 4.4.0 | Apache-2.0 | https://serilog.net/ |  |
| Serilog.AspNetCore | 10.0.0 | Apache-2.0 | https://github.com/serilog/serilog-aspnetcore |  |
| Serilog.Extensions.Hosting | 10.0.0 | Apache-2.0 | https://github.com/serilog/serilog-extensions-hosting |  |
| Serilog.Extensions.Logging | 10.0.0 | Apache-2.0 | https://github.com/serilog/serilog-extensions-logging |  |
| Serilog.Settings.Configuration | 10.0.1 | Apache-2.0 | https://github.com/serilog/serilog-settings-configuration |  |
| Serilog.Sinks.Console | 6.1.1 | Apache-2.0 | https://github.com/serilog/serilog-sinks-console |  |
| Serilog.Sinks.File | 7.0.0 | Apache-2.0 | https://github.com/serilog/serilog-sinks-file |  |
| SkiaSharp | 4.153.1 | MIT | https://go.microsoft.com/fwlink/?linkid=868515 |  |
| SkiaSharp.NativeAssets.Linux.NoDependencies | 4.153.1 | MIT | https://go.microsoft.com/fwlink/?linkid=868515 |  |
| SourceGear.sqlite3 | 3.53.4 | Public Domain | https://sqlite.org/ | 라이선스 파일(LICENSE.txt) 본문 기준 |
| Sqids | 3.2.1 | MIT | https://sqids.org/dotnet |  |
| Stubble.Core | 1.10.8 | MIT | https://github.com/stubbleorg/stubble | 라이선스 파일(licence.md) 본문 기준 |
| Swashbuckle.AspNetCore | 10.2.3 | MIT | https://github.com/domaindrivendev/Swashbuckle.AspNetCore |  |
| System.ClientModel | 1.16.0 | MIT | https://github.com/Azure/azure-sdk-for-net/blob/System.ClientModel_1.16.0/sdk/core/System.ClientModel/README.md |  |
| System.CodeDom | 10.0.12 | MIT | https://dot.net/ |  |
| System.CommandLine | 2.0.12 | MIT | https://github.com/dotnet/command-line-api |  |
| System.Configuration.ConfigurationManager | 10.0.12 | MIT | https://dot.net/ |  |
| System.Data.SQLite | 2.0.4 | Public Domain | https://www.nuget.org/packages/System.Data.SQLite/2.0.4 | nuspec copyright 기준 |
| System.Drawing.Common | 10.0.12 | MIT | https://github.com/dotnet/winforms |  |
| System.IdentityModel.Tokens.Jwt | 8.23.0 | MIT | https://github.com/AzureAD/azure-activedirectory-identitymodel-extensions-for-dotnet |  |
| System.Linq.Dynamic.Core | 1.7.4 | Apache-2.0 | https://dynamic-linq.net/ |  |
| System.Reactive | 7.0.0 | MIT | https://github.com/dotnet/reactive |  |
| System.Runtime.Caching | 10.0.12 | MIT | https://dot.net/ |  |
| System.Windows.Extensions | 10.0.12 | MIT | https://dot.net/ |  |
| Velopack | 1.2.161 | MIT | https://github.com/velopack/velopack | 프로젝트가 부동 버전(*)을 사용하며 로컬 캐시의 최신 버전을 기준으로 함 |
| Yarp.ReverseProxy | 2.3.0 | MIT | https://github.com/dotnet/yarp |  |

## npm 패키지 (런타임)

`install.*` 이 `npm install` 로 설치하는 `function` 모듈과 `ack` 의 런타임 의존성입니다.

| 패키지 | 버전 | 라이선스 | 링크 |
| --- | --- | --- | --- |
| axios | 1.20.0 | MIT | https://www.npmjs.com/package/axios/v/1.20.0 |
| cors | 2.8.6 | MIT | https://www.npmjs.com/package/cors/v/2.8.6 |
| express | 4.22.3 | MIT | https://www.npmjs.com/package/express/v/4.22.3 |
| mssql | 11.0.2 | MIT | https://www.npmjs.com/package/mssql/v/11.0.2 |
| mybatis-mapper | 0.8.0 | Apache-2.0 | https://www.npmjs.com/package/mybatis-mapper/v/0.8.0 |
| mysql | 2.18.1 | MIT | https://www.npmjs.com/package/mysql/v/2.18.1 |
| node-localstorage | 3.0.5 | MIT | https://www.npmjs.com/package/node-localstorage/v/3.0.5 |
| oracledb | 6.10.0 | (Apache-2.0 OR UPL-1.0) | https://www.npmjs.com/package/oracledb/v/6.10.0 |
| os-utils | 0.0.14 | MIT | https://www.npmjs.com/package/os-utils/v/0.0.14 |
| pg | 8.23.1 | MIT | https://www.npmjs.com/package/pg/v/8.23.1 |
| pkcs7 | 1.0.4 | Apache-2.0 | https://www.npmjs.com/package/pkcs7/v/1.0.4 |
| qs | 6.16.0 | BSD-3-Clause | https://www.npmjs.com/package/qs/v/6.16.0 |
| request-ip | 3.3.0 | MIT | https://www.npmjs.com/package/request-ip/v/3.3.0 |
| shelljs | 0.9.2 | BSD-3-Clause | https://www.npmjs.com/package/shelljs/v/0.9.2 |
| simple-node-logger | 21.8.12 | Apache-2.0 | https://www.npmjs.com/package/simple-node-logger/v/21.8.12 |
| sqlite3 | 6.0.1 | BSD-3-Clause | https://www.npmjs.com/package/sqlite3/v/6.0.1 |
| systeminformation | 5.33.15 | MIT | https://www.npmjs.com/package/systeminformation/v/5.33.15 |
| uuid | 11.1.1 | MIT | https://www.npmjs.com/package/uuid/v/11.1.1 |
| xml2js | 0.6.2 | MIT | https://www.npmjs.com/package/xml2js/v/0.6.2 |
| xmlhttprequest | 1.8.0 | MIT | https://www.npmjs.com/package/xmlhttprequest/v/1.8.0 |

## npm 패키지 (빌드 도구)

`syn.js`·`syn.bundle.js` 번들링(gulp, babel 등)에만 쓰이는 개발 의존성입니다. 번들 결과물에는 도구 자체가 포함되지 않습니다.

| 패키지 | 버전 | 라이선스 | 링크 |
| --- | --- | --- | --- |
| @babel/core | 7.29.7 | MIT | https://www.npmjs.com/package/@babel/core/v/7.29.7 |
| @babel/preset-env | 7.29.7 | MIT | https://www.npmjs.com/package/@babel/preset-env/v/7.29.7 |
| gulp | 5.0.1 | MIT | https://www.npmjs.com/package/gulp/v/5.0.1 |
| gulp-concat | 2.6.1 | MIT | https://www.npmjs.com/package/gulp-concat/v/2.6.1 |
| gulp-javascript-obfuscator | 1.1.6 | MIT | https://www.npmjs.com/package/gulp-javascript-obfuscator/v/1.1.6 |
| gulp-rename | 2.1.0 | MIT | https://www.npmjs.com/package/gulp-rename/v/2.1.0 |
| gulp-strip-css-comments | 3.0.0 | MIT | https://www.npmjs.com/package/gulp-strip-css-comments/v/3.0.0 |
| gulp-uglify | 3.0.2 | MIT | https://www.npmjs.com/package/gulp-uglify/v/3.0.2 |
| gulp-uglifycss | 1.1.0 | MIT | https://www.npmjs.com/package/gulp-uglifycss/v/1.1.0 |

## libman 클라이언트 라이브러리

`wwwroot` 모듈의 `lib` 폴더(`lib.zip`)에 포함되는 브라우저용 라이브러리입니다.

| 라이브러리 | 버전 | 제공자 | 라이선스 | 링크 | 비고 |
| --- | --- | --- | --- | --- | --- |
| clipboard.js | 2.0.11 | cdnjs | MIT | https://clipboardjs.com |  |
| Chart.js | 4.4.1 | cdnjs | MIT | http://www.chartjs.org |  |
| echarts | 6.1.0 | cdnjs | Apache-2.0 | https://echarts.apache.org |  |
| video.js | 8.23.9 | jsdelivr | Apache-2.0 | https://www.npmjs.com/package/video.js/v/8.23.9 |  |
| videojs-youtube | 3.0.1 | jsdelivr | MIT | https://www.npmjs.com/package/videojs-youtube/v/3.0.1 |  |
| codemirror | 6.65.7 | cdnjs | MIT | http://codemirror.net |  |
| darkreader | 4.9.92 | cdnjs | MIT | https://darkreader.org/ |  |
| draggabilly | 3.0.0 | cdnjs | MIT | http://draggabilly.desandro.com/ |  |
| jquery.fancytree | 2.38.3 | cdnjs | MIT | https://cdnjs.com/libraries/jquery.fancytree |  |
| fullcalendar | 6.1.20 | jsdelivr | MIT | https://www.npmjs.com/package/fullcalendar/v/6.1.20 |  |
| @fullcalendar/core | 6.1.20 | jsdelivr | MIT | https://www.npmjs.com/package/@fullcalendar/core/v/6.1.20 |  |
| filedrop | 2.1.0 | jsdelivr | Unlicense | https://www.npmjs.com/package/filedrop/v/2.1.0 |  |
| highlight.js | 11.11.0 | cdnjs | BSD-3-Clause | http://highlightjs.org |  |
| intro.js | 7.2.0 | cdnjs | MIT | http://usablica.github.com/intro.js/ |  |
| ispin | 2.0.1 | jsdelivr | MIT | https://www.npmjs.com/package/ispin/v/2.0.1 |  |
| jquery | 3.7.1 | cdnjs | MIT | https://jquery.com/ |  |
| @master/css | 1.37.8 | jsdelivr | MIT | https://www.npmjs.com/package/@master/css/v/1.37.8 |  |
| moment.js | 2.30.1 | cdnjs | MIT | http://momentjs.com/ |  |
| monaco-editor | 0.51.0 | cdnjs | MIT | https://microsoft.github.io/monaco-editor/ |  |
| mustache | 4.2.0 | jsdelivr | MIT | https://www.npmjs.com/package/mustache/v/4.2.0 |  |
| nanobar | 0.4.2 | cdnjs | MIT | http://nanobar.micronube.com |  |
| orgchart | 4.0.1 | cdnjs | MIT | https://cdnjs.com/libraries/orgchart |  |
| PapaParse | 5.4.1 | cdnjs | MIT | http://papaparse.com |  |
| pdfobject | 2.3.0 | cdnjs | MIT | https://pdfobject.com/ |  |
| pikaday | 1.8.2 | cdnjs | (BSD OR MIT) | http://dbushell.github.io/Pikaday/ |  |
| popper.js | 2.11.8 | cdnjs | MIT | https://popper.js.org/ |  |
| print-js | 1.6.0 | cdnjs | MIT | http://printjs.crabbly.com |  |
| xlsx | 0.18.5 | cdnjs | Apache-2.0 | https://cdnjs.com/libraries/xlsx |  |
| showdown | 2.1.0 | cdnjs | BSD-3-Clause | https://cdnjs.com/libraries/showdown |  |
| sql-formatter | 15.4.2 | cdnjs | MIT | https://cdnjs.com/libraries/sql-formatter |  |
| squel | 5.13.0 | cdnjs | MIT | https://hiddentao.com/squel/ |  |
| superplaceholder | 1.0.0 | cdnjs | CC-BY-ND-4.0 | https://kushagragour.in/lab/superplaceholderjs/ |  |
| @tabler/core | 1.3.2 | jsdelivr | MIT | https://www.npmjs.com/package/@tabler/core/v/1.3.2 |  |
| @tabler/icons-webfont | 3.25.0 | jsdelivr | MIT | https://www.npmjs.com/package/@tabler/icons-webfont/v/3.25.0 | npm 메타데이터에 license 필드가 없어 tabler/tabler-icons 저장소 LICENSE(MIT) 기준 |
| tail.select.js | 0.5.23 | cdnjs | MIT | https://getbutterfly.com/tail-select/ |  |
| tinymce | 5.10.9 | cdnjs | LGPL-2.0 | http://www.tinymce.com |  |
| tippy.js | 6.3.7 | cdnjs | MIT | https://atomiks.github.io/tippyjs/ |  |
| vanilla-masker | 1.2.0 | cdnjs | MIT | http://bankfacil.github.io/vanilla-masker |  |
| jquery.maskedinput | 1.4.1 | cdnjs | MIT | http://digitalbush.com/projects/masked-input-plugin/ |  |
| jquery-simplemodal | 1.0.0 | jsdelivr | MIT | https://www.npmjs.com/package/jquery-simplemodal/v/1.0.0 |  |
| highcharts | 11.4.8 | jsdelivr | https://www.highcharts.com/license | https://www.npmjs.com/package/highcharts/v/11.4.8 |  |
| FileSaver.js | 2.0.5 | cdnjs | MIT | https://github.com/eligrey/FileSaver.js/ |  |
| wwwroot/js/auigrid | (저장소 포함) | filesystem | REVIEW |  | 저장소에 직접 포함된 파일입니다. 벤더 라이선스 조건을 별도로 확인하세요. |
| marked | 15.0.11 | jsdelivr | MIT | https://www.npmjs.com/package/marked/v/15.0.11 |  |
| dompurify | 3.2.5 | cdnjs | (MPL-2.0 OR Apache-2.0) | https://cure53.de/purify |  |
| microsoft-signalr | 9.0.6 | cdnjs | Apache-2.0 | https://github.com/aspnet/AspNetCore/tree/master/src/SignalR#readme |  |
| imask | 7.6.1 | unpkg | MIT | https://www.npmjs.com/package/imask/v/7.6.1 |  |

## 파일 형태로 제공되는 라이선스 원문

패키지가 라이선스 파일을 직접 포함하는 경우 원문을 그대로 옮겼습니다.

### DotNetEnv 3.2.0

```text
The MIT License (MIT)

Copyright (c) 2016 Toni Solarin-Sodara

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Hangfire.AspNetCore 1.8.25, Hangfire.Core 1.8.25

```text
License
========

Copyright © 2013-2026 Hangfire OÜ.

Hangfire software is an open-source software that is multi-licensed under the terms of the licenses listed in this file. Recipients may choose the terms under which they are want to use or distribute the software, when all the preconditions of a chosen license are satisfied.

LGPL v3 License
---------------

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more details.

Please see COPYING.LESSER and COPYING files for details.

Commercial License
------------------

Subject to the purchase of a corresponding subscription (please see https://www.hangfire.io/pricing/), you may distribute Hangfire under the terms of commercial license, that allows you to distribute private forks and modifications. Please see LICENSE_STANDARD and LICENSE_ROYALTYFREE files for details.
```

### Mediator.Abstractions 3.0.2

```text
MIT License

Copyright (c) 2022 Martin Othamar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### NUglify 1.23.3

```text
Copyright (c) 2016, Alexandre Mutel
All rights reserved.

Redistribution and use in source and binary forms, with or without modification
, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this 
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, 
   this list of conditions and the following disclaimer in the documentation 
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND 
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED 
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL 
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR 
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER 
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE 
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

-------------------------------------------------------------------------------
The Microsoft Ajax Minifier was originally released under the following license:
-------------------------------------------------------------------------------

Copyright 2010-2015 Microsoft Corporation

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

### Oracle.EntityFrameworkCore 10.23.26301, Oracle.ManagedDataAccess.Core 23.26.301

```text
Your use of this Program is governed by the Oracle Free Distribution, Hosting, and Use Terms and Conditions set forth below, unless you have received this Program (alone or as part of another Oracle product) under an Oracle license agreement (including but not limited to the Oracle Master Agreement), in which case your use of this Program is governed solely by such license agreement with Oracle.

Oracle Free Distribution, Hosting, and Use Terms and Conditions
Definitions
"Oracle" refers to Oracle America, Inc. "You" and "Your" refers to (a) a company or organization (each an "Entity") accessing the Programs, if use of the Programs will be on behalf of such Entity; or (b) an individual accessing the Programs, if use of the Programs will not be on behalf of an Entity. "Program(s)" refers to Oracle software provided by Oracle pursuant to the following terms and any updates, error corrections, and/or Program Documentation provided by Oracle. "Program Documentation" refers to Program user manuals and Program installation manuals, if any. If available, Program Documentation may be delivered with the Programs and/or may be accessed from www.oracle.com/documentation. "Separate Terms" refers to separate license terms that are specified in the Program Documentation, readmes or notice files and that apply to Separately Licensed Technology. "Separately Licensed Technology" refers to Oracle or third party technology that is licensed under Separate Terms and not under the terms of this license.

Separately Licensed Technology
Oracle may provide certain notices to You in Program Documentation, readmes or notice files in connection with Oracle or third party technology provided as or with the Programs. If specified in the Program Documentation, readmes or notice files, such technology will be licensed to You under Separate Terms. Your rights to use Separately Licensed Technology under Separate Terms are not restricted in any way by the terms herein. For clarity, notwithstanding the existence of a notice, third party technology that is not Separately Licensed Technology shall be deemed part of the Programs licensed to You under the terms of this license.

Source Code for Open Source Software
For software that You receive from Oracle in binary form that is licensed under an open source license that gives You the right to receive the source code for that binary, You can obtain a copy of the applicable source code from https://oss.oracle.com/sources/ or http://www.oracle.com/goto/opensourcecode. If the source code for such software was not provided to You with the binary, You can also receive a copy of the source code on physical media by submitting a written request pursuant to the instructions in the "Written Offer for Source Code" section of the latter website.

-------------------------------------------------------------------------------
The following license terms apply to those Programs that are not provided to You under Separate Terms.
License Rights and Restrictions
Oracle grants to You, as a recipient of this Program, a nonexclusive, nontransferable, limited license to, subject to the conditions stated herein, use the unmodified Programs, including, without limitation, for the purposes of:
•	developing, testing, prototyping and demonstrating applications; 
•	running the unmodified Programs for training, personal use, your business operations, and the business operations of third parties;
•	making the unmodified Programs available for use by third parties in your hosted environment and in cloud services; 
•	redistributing unmodified Programs and Programs Documentation under the terms of this License; and
•	copying the unmodified Programs and Program Documentation to the extent reasonably necessary to exercise the license rights granted herein and for backup purposes.
For the purposes of this license, compiling, interpreting or configuring an otherwise unmodified Program as necessary to run the Program shall not be considered modification.

Your license is contingent on Your compliance with the following conditions:
- You include a copy of this license with any distribution by You of the Programs;
- You do not charge your customers, end users, distributees or other third parties any additional fees for the distribution or use of the Programs; however, for clarity, if you comply with the foregoing condition, distribution or use of the Program as part of your for-fee product or service that adds substantial additional value is permitted; 
- You do not remove markings or notices of either Oracle's or a licensor's proprietary rights from the Programs or Program Documentation;
- You comply with all U.S. and applicable export control and economic sanctions laws and regulations that govern Your use of the Programs (including technical data); and
- You do not cause or permit reverse engineering, disassembly or decompilation of the Programs (except as allowed by law) by You nor allow an associated party to do so.
Any source code that may be included in the distribution with the Programs may not be modified, unless such source code is under Separate Terms permitting modification.
Ownership
Oracle or its licensors retain all ownership and intellectual property rights to the Programs.

Information Collection
The Programs' installation and/or auto-update processes, if any, may transmit a limited amount of data to Oracle or its service provider about those processes to help Oracle understand and optimize them. Oracle does not associate the data with personally identifiable information. Refer to Oracle's Privacy Policy at www.oracle.com/privacy.

Disclaimer of Warranties; Limitation of Liability
THE PROGRAMS ARE PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. ORACLE FURTHER DISCLAIMS ALL WARRANTIES, EXPRESS AND IMPLIED, INCLUDING WITHOUT LIMITATION, ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NONINFRINGEMENT.
IN NO EVENT UNLESS REQUIRED BY APPLICABLE LAW WILL ORACLE BE LIABLE TO YOU FOR DAMAGES, INCLUDING ANY GENERAL, SPECIAL, INCIDENTAL OR CONSEQUENTIAL DAMAGES ARISING OUT OF THE USE OR INABILITY TO USE THE PROGRAM (INCLUDING BUT NOT LIMITED TO LOSS OF DATA OR DATA BEING RENDERED INACCURATE OR LOSSES SUSTAINED BY YOU OR THIRD PARTIES OR A FAILURE OF THE PROGRAM TO OPERATE WITH ANY OTHER PROGRAMS), EVEN IF SUCH HOLDER OR OTHER PARTY HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

Version 1.0 
Last updated:  28 June 2022
```

### pythonnet 3.2.0

```text
MIT License

Copyright (c) 2006-2021 the contributors of the Python.NET project

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
```

### SourceGear.sqlite3 3.53.4

```text
SQLite is Public Domain

https://sqlite.org/copyright.html
```

### Stubble.Core 1.10.8

```text
The MIT License (MIT)

Copyright (c) 2015 Alex McAuliffe

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Markdig

Copyright (c) 2016, Alexandre Mutel
All rights reserved.

Redistribution and use in source and binary forms, with or without modification
, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this 
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, 
   this list of conditions and the following disclaimer in the documentation 
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND 
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED 
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL 
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR 
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER 
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE 
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```
