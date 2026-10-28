using System;
using System.Linq;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;

using HandStack.Web;

using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

using Serilog;
using Serilog.Core;
using Serilog.Events;

namespace ack
{
    internal sealed class StartupLogCounter : ILogEventSink
    {
        private long warning;
        private long error;
        private readonly object syncRoot = new();
        private bool stopped;

        public void Emit(LogEvent logEvent)
        {
            lock (syncRoot)
            {
                if (stopped == true) return;
                if (logEvent.Level == LogEventLevel.Warning) warning++;
                else if (logEvent.Level >= LogEventLevel.Error) error++;
            }
        }

        public (long Warning, long Error) Stop()
        {
            lock (syncRoot)
            {
                stopped = true;
                return (warning, error);
            }
        }
    }

    internal static class StartupSummary
    {
        internal static readonly StartupLogCounter Counter = new();

        internal static void Write(IServiceProvider services)
        {
            var counts = Counter.Stop();
            Log.Information("서버 시작 완료. 시작 로그: 경고 {Warning}건, 오류 {Error}건", counts.Warning, counts.Error);

            var addresses = services.GetRequiredService<IServer>().Features.Get<IServerAddressesFeature>()?.Addresses;
            if (addresses != null)
            {
                foreach (var address in addresses)
                {
                    Log.Information("수신 주소: {Address}", address);
                    if (Uri.TryCreate(address, UriKind.Absolute, out var uri) == false) continue;
                    if (uri.Host == "[::]" || uri.Host == "::" || uri.Host == "0.0.0.0" || uri.Host == "*" || uri.Host == "+")
                    {
                        Log.Information("로컬 접속: {Address}", new UriBuilder(uri) { Host = "localhost" }.Uri.ToString());
                        try
                        {
                            var ips = NetworkInterface.GetAllNetworkInterfaces()
                                .Where(item => item.OperationalStatus == OperationalStatus.Up)
                                .SelectMany(item => item.GetIPProperties().UnicastAddresses)
                                .Select(item => item.Address)
                                .Where(ip => ip.AddressFamily == AddressFamily.InterNetwork && IPAddress.IsLoopback(ip) == false)
                                .Distinct();
                            foreach (var ip in ips)
                                Log.Information("네트워크 접속 후보: {Address}", new UriBuilder(uri) { Host = ip.ToString() }.Uri.ToString());
                        }
                        catch (NetworkInformationException ex)
                        {
                            Log.Warning(ex, "네트워크 접속 후보를 조회하지 못했습니다.");
                        }
                    }
                }
            }

            var configuration = services.GetRequiredService<IConfiguration>();
            if (configuration.GetValue<bool>("AppSettings:UseForwardProxy"))
            {
                var proxies = configuration.GetSection("AppSettings:ForwardProxyIP").GetChildren()
                    .Select(item => item.Value).Where(value => string.IsNullOrWhiteSpace(value) == false).ToArray();
                Log.Information("전달 프록시 사용: true, 설정된 신뢰 프록시 IP: {Proxies}", proxies.Length == 0 ? "없음" : string.Join(", ", proxies));
            }
            if (GlobalConfiguration.WithOrigins.Count > 0)
                Log.Information("허용 Origin: {Origins}", string.Join(", ", GlobalConfiguration.WithOrigins));
            if (GlobalConfiguration.WithOnlyIPs.Count > 0)
                Log.Information("허용 접속 IP: {IPs}", string.Join(", ", GlobalConfiguration.WithOnlyIPs));
        }
    }
}
