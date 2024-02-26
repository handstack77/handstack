using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.Net;

using HandStack.Core.ExtensionMethod;
using HandStack.Core.Extensions;
using HandStack.Web.MessageContract.Contract;
using HandStack.Web.MessageContract.DataObject;

using checkup;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using RestSharp;

namespace HDS.Function.HAC
{
    public class HAC000
    {
        public DataSet? AF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "HAC.HAC000.AF01";
            using (DataSet? result = new DataSet())
            {
                try
                {
                    result.BuildExceptionData();

                    string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
                    string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();

                    if (string.IsNullOrEmpty(userWorkID) == true
                        || string.IsNullOrEmpty(applicationID) == true)
                    {
                        result.BuildExceptionData("Y", "Warning", "필수 요청 정보 확인 필요", typeMember);
                        goto TransactionException;
                    }

                    DateTime dateTime = DateTime.Now;
                    string year = dateTime.Year.ToString();
                    string weekOfYear = dateTime.GetWeekOfYear().ToString();
                    string currentDate = dateTime.ToString("yyyyMMdd");
                    string prevWeekDate = dateTime.AddDays(-6).ToString("yyyyMMdd");
                    string rangeTime = dateTime.ToString("HH");

                    var logger = dataContext.logger;
                    logger?.Information($"{typeMember} 작업 시작");

                    var transactServerUrl = dataContext.functionHeader.Configuration?["TransactServerUrl"].ToStringSafe();
                    string url = $"{transactServerUrl}/summary?userWorkID={userWorkID}&applicationID={applicationID}&year={year}&weekOfYear={weekOfYear}&requestDate={currentDate}";
                    var client = new RestClient();
                    var request = new RestRequest(url, Method.Get);
                    
                    request.AddHeader("AuthorizationKey", ModuleConfiguration.AuthorizationKey);
                    RestResponse response = client.Execute(request);
                    if (response.StatusCode != HttpStatusCode.OK)
                    {
                        result.BuildExceptionData("Y", "Warning", $"{url} 로그 서버 실행 정보 확인 필요", typeMember);
                        goto TransactionException;
                    }
                    else
                    {
                        using var table = JsonConvert.DeserializeObject<DataTable>(response.Content.ToStringSafe());
                        if (table != null)
                        {
                            result.Tables.Add(table);
                        }
                        else
                        {
                            result.Tables.Add(new DataTable());
                        }
                    }

                    string previousYear = year;
                    string previousWeekOfYear = (int.Parse(weekOfYear) - 1).ToString();

                    DataTable dtPreviousWeek = new DataTable();
                    DataTable dtCurrentWeek = new DataTable();

                    if (weekOfYear == "01")
                    {
                        int prevYear = int.Parse(year) - 1;
                        DateTime lastDayOfYear = new DateTime(prevYear, 12, 31);

                        CalendarWeekRule weekRule = CalendarWeekRule.FirstFourDayWeek;
                        DayOfWeek firstDayOfWeek = DayOfWeek.Sunday;

                        previousYear = prevYear.ToString();
                        previousWeekOfYear = CultureInfo.InvariantCulture.Calendar.GetWeekOfYear(lastDayOfYear, weekRule, firstDayOfWeek).ToString().PadLeft(2, '0');
                    }

                    url = $"{transactServerUrl}/transaction-list?userWorkID={userWorkID}&applicationID={applicationID}&year={previousYear}&weekOfYear={previousWeekOfYear}&resultType=L";
                    request = new RestRequest(url, Method.Get);
                    
                    request.AddHeader("AuthorizationKey", ModuleConfiguration.AuthorizationKey);
                    response = client.Execute(request);
                    if (response.StatusCode != HttpStatusCode.OK)
                    {
                        result.BuildExceptionData("Y", "Warning", $"{url} 로그 서버 실행 정보 확인 필요", typeMember);
                        goto TransactionException;
                    }
                    else
                    {
                        using var table = JsonConvert.DeserializeObject<DataTable>(response.Content.ToStringSafe());
                        if (table != null)
                        {
                            dtPreviousWeek = table;
                        }
                    }

                    url = $"{transactServerUrl}/transaction-list?userWorkID={userWorkID}&applicationID={applicationID}&year={year}&weekOfYear={weekOfYear}&resultType=L";
                    request = new RestRequest(url, Method.Get);
                    
                    request.AddHeader("AuthorizationKey", ModuleConfiguration.AuthorizationKey);
                    response = client.Execute(request);
                    if (response.StatusCode != HttpStatusCode.OK)
                    {
                        result.BuildExceptionData("Y", "Warning", $"{url} 로그 서버 실행 정보 확인 필요", typeMember);
                        goto TransactionException;
                    }
                    else
                    {
                        using var table = JsonConvert.DeserializeObject<DataTable>(response.Content.ToStringSafe());
                        if (table != null)
                        {
                            dtCurrentWeek = table;
                        }
                    }

                    dtPreviousWeek.Merge(dtCurrentWeek, false, MissingSchemaAction.Add);

                    if (dtPreviousWeek.Rows.Count > 0)
                    {
                        DataView dataView = new DataView(dtPreviousWeek);
                        dataView.RowFilter = $"DateHour > '{prevWeekDate}{rangeTime}' AND DateHour <= '{currentDate}{rangeTime}'";

                        DataTable filteredTable = dataView.ToTable();
                        result.Tables.Add(filteredTable);
                    }
                    else
                    {
                        result.Tables.Add(new DataTable());
                    }
                }
                catch (Exception exception)
                {
                    result.BuildExceptionData("Y", "Error", exception.Message, typeMember, exception.StackTrace);
                }

TransactionException:
                if (result.Tables.Count == 1)
                {
                    result.Tables.Add(new DataTable());
                    result.Tables.Add(new DataTable());
                }
                else if (result.Tables.Count == 2)
                {
                    result.Tables.Add(new DataTable());
                }

                return result;
            }
        }

        public DataSet? LF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "HAC.HAC000.LF01";
            using (DataSet? result = new DataSet())
            {
                try
                {
                    result.BuildExceptionData();

                    string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
                    string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
                    string requestDate = dynamicParameters.Value("RequestDate").ToStringSafe();
                    string requestHour = dynamicParameters.Value("RequestHour").ToStringSafe();

                    if (string.IsNullOrEmpty(userWorkID) == true
                        || string.IsNullOrEmpty(applicationID) == true
                        || string.IsNullOrEmpty(requestDate) == true
                        || string.IsNullOrEmpty(requestHour) == true)
                    {
                        result.BuildExceptionData("Y", "Warning", "필수 요청 정보 확인 필요", typeMember);
                        goto TransactionException;
                    }

                    string year = string.Empty;
                    string weekOfYear = string.Empty;
                    string format = "yyyyMMdd";
                    DateTime dtRequestDate;
                    if (DateTime.TryParseExact(requestDate, format, CultureInfo.InvariantCulture, DateTimeStyles.None, out dtRequestDate))
                    {
                        year = dtRequestDate.Year.ToString();
                        weekOfYear = dtRequestDate.GetWeekOfYear().ToString();
                    }

                    var transactServerUrl = dataContext.functionHeader.Configuration?["TransactServerUrl"].ToStringSafe();
                    string url = $"{transactServerUrl}/transaction-list?userWorkID={userWorkID}&applicationID={applicationID}&year={year}&weekOfYear={weekOfYear}&requestDate={requestDate}&requestHour={requestHour}&resultType=V";
                    var client = new RestClient();
                    var request = new RestRequest(url, Method.Get);
                    
                    request.AddHeader("AuthorizationKey", ModuleConfiguration.AuthorizationKey);
                    RestResponse response = client.Execute(request);
                    if (response.StatusCode != HttpStatusCode.OK)
                    {
                        result.BuildExceptionData("Y", "Warning", $"{url} 로그 서버 실행 정보 확인 필요", typeMember);
                    }
                    else
                    {
                        using var table = JsonConvert.DeserializeObject<DataTable>(response.Content.ToStringSafe());
                        if (table != null)
                        {
                            result.Tables.Add(table);
                        }
                        else
                        {
                            result.BuildExceptionData("Y", "Warning", $"{url} 로그 서버 응답 정보 확인 필요", typeMember);
                        }
                    }
                }
                catch (Exception exception)
                {
                    result.BuildExceptionData("Y", "Error", exception.Message, typeMember, exception.StackTrace);
                }

TransactionException:
                if (result.Tables.Count == 1)
                {
                    result.Tables.Add(new DataTable());
                }

                return result;
            }
        }

        public DataSet? LF02(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "HAC.HAC000.LF02";
            using (DataSet? result = new DataSet())
            {
                try
                {
                    result.BuildExceptionData();

                    string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
                    string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
                    string requestDate = dynamicParameters.Value("RequestDate").ToStringSafe();
                    string requestHour = dynamicParameters.Value("RequestHour").ToStringSafe();

                    if (string.IsNullOrEmpty(userWorkID) == true
                        || string.IsNullOrEmpty(applicationID) == true
                        || string.IsNullOrEmpty(requestDate) == true
                        || string.IsNullOrEmpty(requestHour) == true)
                    {
                        result.BuildExceptionData("Y", "Warning", "필수 요청 정보 확인 필요", typeMember);
                        goto TransactionException;
                    }

                    string year = string.Empty;
                    string weekOfYear = string.Empty;
                    string format = "yyyyMMdd";
                    DateTime dtRequestDate;
                    if (DateTime.TryParseExact(requestDate, format, CultureInfo.InvariantCulture, DateTimeStyles.None, out dtRequestDate))
                    {
                        year = dtRequestDate.Year.ToString();
                        weekOfYear = dtRequestDate.GetWeekOfYear().ToString();
                    }

                    var transactServerUrl = dataContext.functionHeader.Configuration?["TransactServerUrl"].ToStringSafe();
                    string url = $"{transactServerUrl}/transaction-list?userWorkID={userWorkID}&applicationID={applicationID}&year={year}&weekOfYear={weekOfYear}&requestDate={requestDate}&requestHour={requestHour}&resultType=E";
                    var client = new RestClient();
                    var request = new RestRequest(url, Method.Get);
                    
                    request.AddHeader("AuthorizationKey", ModuleConfiguration.AuthorizationKey);
                    RestResponse response = client.Execute(request);
                    if (response.StatusCode != HttpStatusCode.OK)
                    {
                        result.BuildExceptionData("Y", "Warning", $"{url} 로그 서버 실행 정보 확인 필요", typeMember);
                    }
                    else
                    {
                        using var table = JsonConvert.DeserializeObject<DataTable>(response.Content.ToStringSafe());
                        if (table != null)
                        {
                            result.Tables.Add(table);
                        }
                        else
                        {
                            result.BuildExceptionData("Y", "Warning", $"{url} 로그 서버 응답 정보 확인 필요", typeMember);
                        }
                    }
                }
                catch (Exception exception)
                {
                    result.BuildExceptionData("Y", "Error", exception.Message, typeMember, exception.StackTrace);
                }

TransactionException:
                if (result.Tables.Count == 1)
                {
                    result.Tables.Add(new DataTable());
                }

                return result;
            }
        }
    }
}
