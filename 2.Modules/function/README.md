# function 모듈

## 개요
`function`은 계약 기반 서버 기능 실행 모듈입니다. `featureMeta.json`과 `featureMain.js/cs/py`를 읽어 Node.js, C#, Python 런타임에서 함수를 실행하고 결과를 `DynamicResponse`로 반환합니다.

## 책임 범위
- 함수 계약 존재 여부 확인, 메타 조회, 실행 API를 제공합니다.
- Node.js, C#, Python 런타임을 같은 거래 인터페이스로 감쌉니다.
- C# 함수는 동적 컴파일/로딩/언로드를 수행합니다.
- 계약 파일 변경을 감시해 캐시를 갱신합니다.
- 함수 내부에서 전/후처리 거래와 외부 HTTP 호출을 조합할 수 있게 합니다.

## 주요 진입점
- `GET /function/api/execution/has`
- `GET /function/api/execution/refresh`
- `GET /function/api/execution/retrieve`
- `GET /function/api/execution/meta`
- `POST /function/api/execution`
- 주요 구현 클래스
  - `ExecutionController`
  - `FunctionClient`
  - `FunctionRequestHandler`
  - `ExecutionRefreshRequestHandler`
  - `Runner`, `Compiler`, `UnloadableAssemblyLoadContext`

## 주요 디렉터리
- `Areas/function/Controllers`: `/function/api/execution/*`
- `DataClient/FunctionClient.cs`: 런타임 선택과 계약 실행 핵심
- `Builder`: C# 함수 동적 컴파일/실행기
- `Contracts/function`: 샘플 함수 계약
- `node.config.json`, `package.json`, `requirements.txt`: 런타임 준비 파일

## 계약 및 데이터 자산
- 함수 계약의 중심은 `featureMeta.json`입니다.
- 실제 코드는 `featureMain.js`, `featureMain.cs`, `featureMain.py` 중 계약에 맞는 파일을 사용합니다.
- `EntryType`, `EntryMethod`, `BeforeTransaction`, `AfterTransaction`, `FallbackTransaction`이 계약에 포함됩니다.
- `FunctionSource`는 데이터 원본과 작업 디렉터리를 함께 선언합니다.

## 설정 포인트
- `ContractBasePath`: 함수 계약 루트
- `NodeFunctionConfig`: Node.js 로그/워치/타임아웃 설정
- `CSharpFunctionConfig`: C# 함수 워치와 로그 경로
- `PythonFunctionConfig`: Python DLL 경로, 로그 경로, 파일 감시 설정
- `FunctionSource`: DataSourceID, 연결 문자열, `WorkingDirectoryPath`
- `LogServerUrl`, `ModuleLogFilePath`: 운영 로그 수집 설정

## 실행 흐름
1. 호출자는 보통 `transact`의 F 타입 서비스를 실행합니다.
2. `function`은 `FunctionMapper`에서 `featureMeta.json`을 읽어 `EntryType`, `EntryMethod`, 파라미터를 해석합니다.
3. `FunctionClient`가 런타임(Node/C#/Python)을 골라 실제 코드를 실행합니다.
4. 함수 내부 필요에 따라 `syn.$w.transactionDirect`로 다른 거래를 연쇄 호출합니다.

## 운영 메모
- `NodeFunctionConfig`, `CSharpFunctionConfig`, `PythonFunctionConfig`별로 파일 감시와 로그 경로를 분리합니다.
- C# 함수는 `featureMain.cs`를 동적 컴파일하므로 참조 모듈과 타입명을 계약과 맞춰야 합니다.
- Python 런타임은 기본적으로 비활성화되어 있으며 DLL 경로를 정확히 지정해야 합니다.

### Python 런타임 준비
#### Ubuntu / Linux
```bash
wget https://repo.anaconda.com/archive/Anaconda3-2023.03-Linux-x86_64.sh -O /tmp/anaconda.sh && \
bash /tmp/anaconda.sh -b -p /opt/anaconda && \
rm /tmp/anaconda.sh && \
/opt/anaconda/bin/conda init bash && \
/opt/anaconda/bin/conda install -y python=3.11

/opt/anaconda/bin/conda create -n myenv python=3.11 -y && \
/opt/anaconda/bin/conda run -n myenv pip install numpy pandas requests httpx PyMySQL pymssql asyncpg oracledb mapper-parser localStoragePy psutil logging4 suid xmltodict && \
/opt/anaconda/bin/conda clean -ya
```

#### Windows
```powershell
conda create -n myenv python=3.11 -y
conda activate myenv
pip install numpy pandas requests httpx PyMySQL pymssql asyncpg oracledb mapper-parser localStoragePy psutil logging4 suid xmltodict
conda clean -ya
```

#### macOS
```bash
wget https://repo.anaconda.com/archive/Anaconda3-2023.03-MacOSX-x86_64.sh -O ~/anaconda.sh && \
bash ~/anaconda.sh -b -p ~/anaconda && \
rm ~/anaconda.sh && \
~/anaconda/bin/conda init zsh

~/anaconda/bin/conda create -n myenv python=3.11 -y
~/anaconda/bin/conda activate myenv
pip install numpy pandas requests httpx PyMySQL pymssql asyncpg oracledb mapper-parser localStoragePy psutil logging4 suid xmltodict
~/anaconda/bin/conda clean -ya
```

### Python DLL 설정 예
```json
{
  "PythonFunctionConfig": {
    "EnablePythonDLL": true,
    "PythonDLLFilePath": "C:/Users/사용자명/Anaconda3/envs/myenv/python311.dll"
  }
}
```

## 빌드 및 작업 명령
```powershell
.\build.ps1
.\task.ps1
```
