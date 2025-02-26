# Python 3 환경설정

HandStack 기반에서 Python 를 이용하여 함수 코드를 실행하기 위해 Windows, Linux, macOS 에서 동일한 실행 환경을 제공하는 Anaconda 의 가상 환경을 권장.

## Ubuntu 에 Anaconda 설치

```bash
wget https://repo.anaconda.com/archive/Anaconda3-2023.03-Linux-x86_64.sh -O /tmp/anaconda.sh && \
bash /tmp/anaconda.sh -b -p /opt/anaconda && \
rm /tmp/anaconda.sh && \
/opt/anaconda/bin/conda init bash && \
/opt/anaconda/bin/conda install -y python=3.11
```

## Anaconda 가상 환경 생성 및 패키지 설치
/opt/anaconda/bin/conda create -n myenv python=3.11 -y && \
/opt/anaconda/bin/conda run -n myenv pip install numpy pandas requests httpx PyMySQL pymssql asyncpg oracledb mapper-parser localStoragePy psutil logging4 suid xmltodict && \
/opt/anaconda/bin/conda clean -ya

## function 모듈 Python 런타임 설정

ModuleConfig.PythonFunctionConfig.PythonDLLFilePath 에 Anaconda 가상 환경 생성된 다음의 라이브러리를 설정

```json
{
	"PythonFunctionConfig": {
		"EnablePythonDLL": true,
		"PythonDLLFilePath": "/opt/anaconda/envs/myenv/lib/libpython3.so",
		...
	}
}
```

---

## Windows 11에 Anaconda 설치  

1. [Anaconda 공식 다운로드 페이지](https://www.anaconda.com/products/distribution)에서 Windows용 Anaconda 설치 프로그램 다운로드  
2. 설치 프로그램 실행 후 지침에 따라 설치  

## Anaconda 가상 환경 생성 및 패키지 설치  
```powershell
# Anaconda Prompt 또는 PowerShell 실행
conda create -n myenv python=3.11 -y
conda activate myenv

# 필수 패키지 설치
pip install numpy pandas requests httpx PyMySQL pymssql asyncpg oracledb mapper-parser localStoragePy psutil logging4 suid xmltodict

# 캐시 정리
conda clean -ya
```

## function 모듈 Python 런타임 설정  
`ModuleConfig.PythonFunctionConfig.PythonDLLFilePath`에 아래 경로 지정:  
```json
{
  "PythonFunctionConfig": {
    "EnablePythonDLL": true,
    "PythonDLLFilePath": "C:/Users/사용자명/Anaconda3/envs/myenv/python311.dll",
    ...
  }
}
```

## 참고
- 사용자명과 설치 경로는 실제 환경에 맞게 변경  
- `python311.dll` 파일은 `myenv` 환경의 `python.exe`가 있는 폴더에 위치  

---

## macOS에 Anaconda 설치

```bash
# 터미널에서 설치 스크립트 다운로드 및 설치
wget https://repo.anaconda.com/archive/Anaconda3-2023.03-MacOSX-x86_64.sh -O ~/anaconda.sh && \
bash ~/anaconda.sh -b -p ~/anaconda && \
rm ~/anaconda.sh && \
~/anaconda/bin/conda init zsh
```

Apple Silicon(M1/M2)의 경우 [공식 홈페이지](https://www.anaconda.com/products/distribution)에서 해당 아키텍처 지원 버전을 다운로드하세요.  

## Anaconda 가상 환경 생성 및 패키지 설치

```bash
# 터미널에서 실행
~/anaconda/bin/conda create -n myenv python=3.11 -y
~/anaconda/bin/conda activate myenv

# 패키지 설치
pip install numpy pandas requests httpx PyMySQL pymssql asyncpg oracledb mapper-parser localStoragePy psutil logging4 suid xmltodict

# 캐시 정리
~/anaconda/bin/conda clean -ya
```

## function 모듈 Python 런타임 설정  
```json
{
  "PythonFunctionConfig": {
    "EnablePythonDLL": true,
    "PythonDLLFilePath": "/Users/사용자명/anaconda/envs/myenv/lib/libpython3.11.dylib",
    ...
  }
}
```