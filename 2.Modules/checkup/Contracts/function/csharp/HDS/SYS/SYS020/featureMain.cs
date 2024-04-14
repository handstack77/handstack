using System;
using System.Collections.Generic;
using System.Data;
using System.Net;

using HandStack.Core.ExtensionMethod;
using HandStack.Web.Extensions;
using HandStack.Web.MessageContract.DataObject;

using checkup;
using checkup.Entity;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using RestSharp;

namespace HDS.Function.SYS
{
    public class SYS020
    {
        public DataSet? LF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "SYS.SYS020.LF01";
            using (DataSet? result = new DataSet())
            {
                result.BuildExceptionData();

                string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
                string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
                string serverID = dynamicParameters.Value("ServerID").ToStringSafe();
                string globalID = dynamicParameters.Value("GlobalID").ToStringSafe();
                string environment = dynamicParameters.Value("Environment").ToStringSafe();
                string projectID = dynamicParameters.Value("ProjectID").ToStringSafe();
                string serviceID = dynamicParameters.Value("ServiceID").ToStringSafe();
                string transactionID = dynamicParameters.Value("TransactionID").ToStringSafe();
                string startedAt = dynamicParameters.Value("StartedAt").ToStringSafe();
                string endedAt = dynamicParameters.Value("EndedAt").ToStringSafe();

                if (string.IsNullOrEmpty(userWorkID) == true
                    || string.IsNullOrEmpty(applicationID) == true
                    || string.IsNullOrEmpty(startedAt) == true
                    || string.IsNullOrEmpty(endedAt) == true
                )
                {
                    result.BuildExceptionData("Y", "Warning", "필수 요청 정보 확인 필요", typeMember);
                    goto TransactionException;
                }

                try
                {
                    var logServerListUrl = dataContext.functionHeader.Configuration?["LogServerListUrl"].ToStringSafe();
                    string url = $"{logServerListUrl}?applicationID={applicationID}&serverID={serverID}&globalID={globalID}&environment={environment}&projectID={projectID}&serviceID={serviceID}&transactionID={transactionID}&startedAt={startedAt}&endedAt={endedAt}";
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
                    result.BuildExceptionData("Y", "Error", exception.Message, typeMember);
                    goto TransactionException;
                }

TransactionException:
                if (result.Tables.Count == 1)
                {
                    result.Tables.Add(new DataTable());
                }

                return result;
            }
        }

        public DataSet? GF01(List<DynamicParameter> dynamicParameters, DataContext dataContext)
        {
            string typeMember = "SYS.SYS020.GF01";
            using (DataSet? result = new DataSet())
            {
                result.BuildExceptionData();

                string userWorkID = dynamicParameters.Value("UserWorkID").ToStringSafe();
                string applicationID = dynamicParameters.Value("ApplicationID").ToStringSafe();
                string logNo = dynamicParameters.Value("LogNo").ToStringSafe();

                if (string.IsNullOrEmpty(userWorkID) == true
                    || string.IsNullOrEmpty(applicationID) == true
                    || string.IsNullOrEmpty(logNo) == true
                )
                {
                    result.BuildExceptionData("Y", "Warning", "필수 요청 정보 확인 필요", typeMember);
                    goto TransactionException;
                }

                try
                {
                    var logServerDetailUrl = dataContext.functionHeader.Configuration?["LogServerDetailUrl"].ToStringSafe();
                    string url = $"{logServerDetailUrl}?applicationID={applicationID}&logNo={logNo}";
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
                    result.BuildExceptionData("Y", "Error", exception.Message, typeMember);
                    goto TransactionException;
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
