# MSSQL 2022 서버
# https://docs.microsoft.com/ko-kr/sql/linux/sql-server-linux-docker-container-configure?view=sql-server-ver16&pivots=cs1-bash
# https://docs.microsoft.com/ko-kr/sql/linux/quickstart-install-connect-docker?view=sql-server-ver16&pivots=cs1-bash
docker run -d -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=handstack~!@34" -p 1433:1433 --name mssql --hostname mssql mcr.microsoft.com/mssql/server:2022-latest

# MariaDB
# https://hub.docker.com/_/mariadb
# https://royleej9.tistory.com/entry/Docker-mariadb-%EB%B0%8F-utf-8-%EC%84%A4%EC%A0%95
docker run -d -e "MARIADB_USER=ack" -e "MARIADB_PASSWORD=ack~!@34" -e "MARIADB_ROOT_PASSWORD=handstack~!@34" -p 3306:3306 --name mariadb --hostname mariadb mariadb:latest --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci

# Oracle
# https://github.com/oracle/docker-images/tree/main/OracleDatabase/SingleInstance
# https://newbedev.com/pull-access-denied-for-container-registry-oracle-com-database-enterprise
# https://container-registry.oracle.com/ords/f?p=113:4:107186872094316:::4:P4_REPOSITORY,AI_REPOSITORY,AI_REPOSITORY_NAME,P4_REPOSITORY_NAME,P4_EULA_ID,P4_BUSINESS_AREA_ID:803,803,Oracle%20Database%20Express%20Edition,Oracle%20Database%20Express%20Edition,1,0&cs=3SELC_Ct1WC1MUsbGgPNi7ceM_t8VXVSi6Pjsqjc1g6RV6mW_kjYRUgi9b-iLsui57Gtzp3b9N5jAyqkXrCD8gA
# https://m.blog.naver.com/brainkorea/222063860838
# https://github.com/oracle/docker-images/issues/2362
docker run -d -e "ORACLE_SID=XE" -e "ORACLE_PDB=ORCLPDB" -e "ORACLE_PWD=handstack~!@34" -p 1521:1521 -p 5500:5500 --name oracle-xe --hostname oracle-xe container-registry.oracle.com/database/express:21.3.0-xe

# PostgreSQL
# https://www.bearpooh.com/122
# https://hub.docker.com/_/postgres
docker run -d -e "TZ=Asia/Seoul" -e "POSTGRES_PASSWORD=handstack~!@34" -p 5432:5432 --name postgresql --hostname postgresql postgres:latest

########################################################################################################################################

Connection strings for SQL Server 2008
http://www.connectionstrings.com/sql-server-2008

Connection strings for Oracle
http://www.connectionstrings.com/oracle

Connection strings for MySQL
http://www.connectionstrings.com/mysql

Connection strings for IBM DB2
http://www.connectionstrings.com/ibm-db2

Connection strings for Excel 2007
http://www.connectionstrings.com/excel-2007

Connection strings for Textfile
http://www.connectionstrings.com/textfile

Connection strings for Access 2007
http://www.connectionstrings.com/access-2007

Connection strings for SQL Azure
http://www.connectionstrings.com/sql-azure

Connection strings for OLAP, Analysis Services
http://www.connectionstrings.com/olap-analysis-services