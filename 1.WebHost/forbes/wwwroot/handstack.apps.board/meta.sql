CREATE TABLE IF NOT EXISTS Board (
    -- 게시글 ID
	"ID" INTEGER NOT NULL CONSTRAINT "PK_Board" PRIMARY KEY AUTOINCREMENT,
    
    -- 분류
	"Category" TEXT NULL,
    
    -- 제목
	"Title" TEXT NULL,
    
    -- 내용
	"Content" TEXT NULL,
    
    -- 작성자
	"Author" TEXT NULL,
    
    -- 입력일시
	"DatePosted" TEXT NULL
);

INSERT INTO Board (Category, Title, Content, Author, DatePosted) VALUES ('정보', '정보 게시물 제목1', '정보 게시물 내용1', '개발자', datetime('now', 'localtime', '-1 day'))
    , ('강좌', '강좌 게시물 제목1', '강좌 게시물 내용1', '개발자', datetime('now', 'localtime', '-1 day'))
    , ('소식', '소식 게시물 제목1', '소식 게시물 내용1', '개발자', datetime('now', 'localtime', '-1 day'))
    , ('정보', '정보 게시물 제목2', '정보 게시물 내용2', '개발자', datetime('now', 'localtime', '-2 day'))
    , ('강좌', '강좌 게시물 제목2', '강좌 게시물 내용2', '개발자', datetime('now', 'localtime', '-2 day'))
    , ('소식', '소식 게시물 제목2', '소식 게시물 내용2', '개발자', datetime('now', 'localtime', '-2 day'))
    , ('정보', '정보 게시물 제목3', '정보 게시물 내용3', '개발자', datetime('now', 'localtime', '-3 day'))
    , ('강좌', '강좌 게시물 제목3', '강좌 게시물 내용3', '개발자', datetime('now', 'localtime', '-3 day'))
    , ('소식', '소식 게시물 제목3', '소식 게시물 내용3', '개발자', datetime('now', 'localtime', '-3 day'))
    , ('정보', '정보 게시물 제목4', '정보 게시물 내용4', '개발자', datetime('now', 'localtime', '-4 day'))
    , ('강좌', '강좌 게시물 제목4', '강좌 게시물 내용4', '개발자', datetime('now', 'localtime', '-4 day'))
    , ('소식', '소식 게시물 제목4', '소식 게시물 내용4', '개발자', datetime('now', 'localtime', '-4 day'))
    , ('정보', '정보 게시물 제목5', '정보 게시물 내용5', '개발자', datetime('now', 'localtime', '-5 day'))
    , ('강좌', '강좌 게시물 제목5', '강좌 게시물 내용5', '개발자', datetime('now', 'localtime', '-5 day'))
    , ('소식', '소식 게시물 제목5', '소식 게시물 내용5', '개발자', datetime('now', 'localtime', '-5 day'))
    , ('정보', '정보 게시물 제목6', '정보 게시물 내용6', '개발자', datetime('now', 'localtime', '-6 day'))
    , ('강좌', '강좌 게시물 제목6', '강좌 게시물 내용6', '개발자', datetime('now', 'localtime', '-6 day'))
    , ('소식', '소식 게시물 제목6', '소식 게시물 내용6', '개발자', datetime('now', 'localtime', '-6 day'))
    , ('정보', '정보 게시물 제목7', '정보 게시물 내용7', '개발자', datetime('now', 'localtime', '-7 day'))
    , ('강좌', '강좌 게시물 제목7', '강좌 게시물 내용7', '개발자', datetime('now', 'localtime', '-7 day'))
    , ('소식', '소식 게시물 제목7', '소식 게시물 내용7', '개발자', datetime('now', 'localtime', '-7 day'))
    , ('정보', '정보 게시물 제목8', '정보 게시물 내용8', '개발자', datetime('now', 'localtime', '-8 day'))
    , ('강좌', '강좌 게시물 제목8', '강좌 게시물 내용8', '개발자', datetime('now', 'localtime', '-8 day'))
    , ('소식', '소식 게시물 제목8', '소식 게시물 내용8', '개발자', datetime('now', 'localtime', '-8 day'))
    , ('정보', '정보 게시물 제목9', '정보 게시물 내용9', '개발자', datetime('now', 'localtime', '-9 day'))
    , ('강좌', '강좌 게시물 제목9', '강좌 게시물 내용9', '개발자', datetime('now', 'localtime', '-9 day'))
    , ('소식', '소식 게시물 제목9', '소식 게시물 내용9', '개발자', datetime('now', 'localtime', '-9 day'))
    , ('정보', '정보 게시물 제목10', '정보 게시물 내용10', '개발자', datetime('now', 'localtime', '-10 day'))
    , ('강좌', '강좌 게시물 제목10', '강좌 게시물 내용10', '개발자', datetime('now', 'localtime', '-10 day'))
    , ('소식', '소식 게시물 제목10', '소식 게시물 내용10', '개발자', datetime('now', 'localtime', '-10 day'));

INSERT INTO Board (Category, Title, Content, Author, DatePosted) VALUES ('정보', '정보 게시물 제목11', '정보 게시물 내용11', '개발자', datetime('now', 'localtime', '-11 day'))
    , ('강좌', '강좌 게시물 제목11', '강좌 게시물 내용11', '개발자', datetime('now', 'localtime', '-11 day'))
    , ('소식', '소식 게시물 제목11', '소식 게시물 내용11', '개발자', datetime('now', 'localtime', '-11 day'))
    , ('정보', '정보 게시물 제목12', '정보 게시물 내용12', '개발자', datetime('now', 'localtime', '-12 day'))
    , ('강좌', '강좌 게시물 제목12', '강좌 게시물 내용12', '개발자', datetime('now', 'localtime', '-12 day'))
    , ('소식', '소식 게시물 제목12', '소식 게시물 내용12', '개발자', datetime('now', 'localtime', '-12 day'))
    , ('정보', '정보 게시물 제목13', '정보 게시물 내용13', '개발자', datetime('now', 'localtime', '-13 day'))
    , ('강좌', '강좌 게시물 제목13', '강좌 게시물 내용13', '개발자', datetime('now', 'localtime', '-13 day'))
    , ('소식', '소식 게시물 제목13', '소식 게시물 내용13', '개발자', datetime('now', 'localtime', '-13 day'))
    , ('정보', '정보 게시물 제목14', '정보 게시물 내용14', '개발자', datetime('now', 'localtime', '-14 day'))
    , ('강좌', '강좌 게시물 제목14', '강좌 게시물 내용14', '개발자', datetime('now', 'localtime', '-14 day'))
    , ('소식', '소식 게시물 제목14', '소식 게시물 내용14', '개발자', datetime('now', 'localtime', '-14 day'))
    , ('정보', '정보 게시물 제목15', '정보 게시물 내용15', '개발자', datetime('now', 'localtime', '-15 day'))
    , ('강좌', '강좌 게시물 제목15', '강좌 게시물 내용15', '개발자', datetime('now', 'localtime', '-15 day'))
    , ('소식', '소식 게시물 제목15', '소식 게시물 내용15', '개발자', datetime('now', 'localtime', '-15 day'))
    , ('정보', '정보 게시물 제목16', '정보 게시물 내용16', '개발자', datetime('now', 'localtime', '-16 day'))
    , ('강좌', '강좌 게시물 제목16', '강좌 게시물 내용16', '개발자', datetime('now', 'localtime', '-16 day'))
    , ('소식', '소식 게시물 제목16', '소식 게시물 내용16', '개발자', datetime('now', 'localtime', '-16 day'))
    , ('정보', '정보 게시물 제목17', '정보 게시물 내용17', '개발자', datetime('now', 'localtime', '-17 day'))
    , ('강좌', '강좌 게시물 제목17', '강좌 게시물 내용17', '개발자', datetime('now', 'localtime', '-17 day'))
    , ('소식', '소식 게시물 제목17', '소식 게시물 내용17', '개발자', datetime('now', 'localtime', '-17 day'))
    , ('정보', '정보 게시물 제목18', '정보 게시물 내용18', '개발자', datetime('now', 'localtime', '-18 day'))
    , ('강좌', '강좌 게시물 제목18', '강좌 게시물 내용18', '개발자', datetime('now', 'localtime', '-18 day'))
    , ('소식', '소식 게시물 제목18', '소식 게시물 내용18', '개발자', datetime('now', 'localtime', '-18 day'))
    , ('정보', '정보 게시물 제목19', '정보 게시물 내용19', '개발자', datetime('now', 'localtime', '-19 day'))
    , ('강좌', '강좌 게시물 제목19', '강좌 게시물 내용19', '개발자', datetime('now', 'localtime', '-19 day'))
    , ('소식', '소식 게시물 제목19', '소식 게시물 내용19', '개발자', datetime('now', 'localtime', '-19 day'))
    , ('정보', '정보 게시물 제목20', '정보 게시물 내용20', '개발자', datetime('now', 'localtime', '-20 day'))
    , ('강좌', '강좌 게시물 제목20', '강좌 게시물 내용20', '개발자', datetime('now', 'localtime', '-20 day'))
    , ('소식', '소식 게시물 제목20', '소식 게시물 내용20', '개발자', datetime('now', 'localtime', '-20 day'));

INSERT INTO Board (Category, Title, Content, Author, DatePosted) VALUES ('정보', '정보 게시물 제목21', '정보 게시물 내용21', '개발자', datetime('now', 'localtime', '-21 day'))
    , ('강좌', '강좌 게시물 제목21', '강좌 게시물 내용21', '개발자', datetime('now', 'localtime', '-21 day'))
    , ('소식', '소식 게시물 제목21', '소식 게시물 내용21', '개발자', datetime('now', 'localtime', '-21 day'))
    , ('정보', '정보 게시물 제목22', '정보 게시물 내용22', '개발자', datetime('now', 'localtime', '-22 day'))
    , ('강좌', '강좌 게시물 제목22', '강좌 게시물 내용22', '개발자', datetime('now', 'localtime', '-22 day'))
    , ('소식', '소식 게시물 제목22', '소식 게시물 내용22', '개발자', datetime('now', 'localtime', '-22 day'))
    , ('정보', '정보 게시물 제목23', '정보 게시물 내용23', '개발자', datetime('now', 'localtime', '-23 day'))
    , ('강좌', '강좌 게시물 제목23', '강좌 게시물 내용23', '개발자', datetime('now', 'localtime', '-23 day'))
    , ('소식', '소식 게시물 제목23', '소식 게시물 내용23', '개발자', datetime('now', 'localtime', '-23 day'))
    , ('정보', '정보 게시물 제목24', '정보 게시물 내용24', '개발자', datetime('now', 'localtime', '-24 day'))
    , ('강좌', '강좌 게시물 제목24', '강좌 게시물 내용24', '개발자', datetime('now', 'localtime', '-24 day'))
    , ('소식', '소식 게시물 제목24', '소식 게시물 내용24', '개발자', datetime('now', 'localtime', '-24 day'))
    , ('정보', '정보 게시물 제목25', '정보 게시물 내용25', '개발자', datetime('now', 'localtime', '-25 day'))
    , ('강좌', '강좌 게시물 제목25', '강좌 게시물 내용25', '개발자', datetime('now', 'localtime', '-25 day'))
    , ('소식', '소식 게시물 제목25', '소식 게시물 내용25', '개발자', datetime('now', 'localtime', '-25 day'))
    , ('정보', '정보 게시물 제목26', '정보 게시물 내용26', '개발자', datetime('now', 'localtime', '-26 day'))
    , ('강좌', '강좌 게시물 제목26', '강좌 게시물 내용26', '개발자', datetime('now', 'localtime', '-26 day'))
    , ('소식', '소식 게시물 제목26', '소식 게시물 내용26', '개발자', datetime('now', 'localtime', '-26 day'))
    , ('정보', '정보 게시물 제목27', '정보 게시물 내용27', '개발자', datetime('now', 'localtime', '-27 day'))
    , ('강좌', '강좌 게시물 제목27', '강좌 게시물 내용27', '개발자', datetime('now', 'localtime', '-27 day'))
    , ('소식', '소식 게시물 제목27', '소식 게시물 내용27', '개발자', datetime('now', 'localtime', '-27 day'))
    , ('정보', '정보 게시물 제목28', '정보 게시물 내용28', '개발자', datetime('now', 'localtime', '-28 day'))
    , ('강좌', '강좌 게시물 제목28', '강좌 게시물 내용28', '개발자', datetime('now', 'localtime', '-28 day'))
    , ('소식', '소식 게시물 제목28', '소식 게시물 내용28', '개발자', datetime('now', 'localtime', '-28 day'))
    , ('정보', '정보 게시물 제목29', '정보 게시물 내용29', '개발자', datetime('now', 'localtime', '-29 day'))
    , ('강좌', '강좌 게시물 제목29', '강좌 게시물 내용29', '개발자', datetime('now', 'localtime', '-29 day'))
    , ('소식', '소식 게시물 제목29', '소식 게시물 내용29', '개발자', datetime('now', 'localtime', '-29 day'))
    , ('정보', '정보 게시물 제목30', '정보 게시물 내용30', '개발자', datetime('now', 'localtime', '-30 day'))
    , ('강좌', '강좌 게시물 제목30', '강좌 게시물 내용30', '개발자', datetime('now', 'localtime', '-30 day'))
    , ('소식', '소식 게시물 제목30', '소식 게시물 내용30', '개발자', datetime('now', 'localtime', '-30 day'));

-- 기초코드
INSERT INTO BaseCode (GroupCode,CodeID,CodeValue,CategoryID,Value1,Value2,Value3,Value4,Value5,Comment,SortingNo,CreatedMemberNo,CreatedAt) VALUES
	 ('SYS000','SYS006','프로젝트 구분','system',NULL,NULL,NULL,NULL,NULL,'개발관점에서 화면, 업무, 데이터베이스로 프로젝트를 구분',NULL,'system',DATETIME('NOW', 'localtime')),
	 ('SYS000','SYS014','데이터베이스 제공자','system',NULL,NULL,NULL,NULL,NULL,'데이터베이스 제공자',NULL,'system',DATETIME('NOW', 'localtime')),
	 ('SYS000','SYS016','기초코드 구분','system',NULL,NULL,NULL,NULL,NULL,'기초코드 구분',NULL,'system',DATETIME('NOW', 'localtime'));

INSERT INTO BaseCode (GroupCode,CodeID,CodeValue,CategoryID,Value1,Value2,Value3,Value4,Value5,Comment,SortingNo,CreatedMemberNo,CreatedAt) VALUES
	 ('SYS006','1','화면','system',NULL,NULL,NULL,NULL,NULL,NULL,1,'system',DATETIME('NOW', 'localtime')),
	 ('SYS006','2','업무','system',NULL,NULL,NULL,NULL,NULL,NULL,2,'system',DATETIME('NOW', 'localtime')),
	 ('SYS006','3','데이터베이스','system',NULL,NULL,NULL,NULL,NULL,NULL,3,'system',DATETIME('NOW', 'localtime')),
	 ('SYS006','4','배치 프로그램','system',NULL,NULL,NULL,NULL,NULL,NULL,4,'system',DATETIME('NOW', 'localtime')),
	 ('SYS006','5','파일','system',NULL,NULL,NULL,NULL,NULL,NULL,5,'system',DATETIME('NOW', 'localtime'));

INSERT INTO BaseCode (GroupCode,CodeID,CodeValue,CategoryID,Value1,Value2,Value3,Value4,Value5,Comment,SortingNo,CreatedMemberNo,CreatedAt) VALUES
	 ('SYS014','1','MSSQL','system',NULL,NULL,NULL,NULL,NULL,NULL,1,'system',DATETIME('NOW', 'localtime')),
	 ('SYS014','2','ORACLE','system',NULL,NULL,NULL,NULL,NULL,NULL,2,'system',DATETIME('NOW', 'localtime')),
	 ('SYS014','3','MYSQL','system',NULL,NULL,NULL,NULL,NULL,NULL,3,'system',DATETIME('NOW', 'localtime')),
	 ('SYS014','4','SQLite','system',NULL,NULL,NULL,NULL,NULL,NULL,4,'system',DATETIME('NOW', 'localtime')),
	 ('SYS014','5','PostgreSQL','system',NULL,NULL,NULL,NULL,NULL,NULL,5,'system',DATETIME('NOW', 'localtime'));

INSERT INTO BaseCode (GroupCode,CodeID,CodeValue,CategoryID,Value1,Value2,Value3,Value4,Value5,Comment,SortingNo,CreatedMemberNo,CreatedAt) VALUES
	 ('SYS016','0','시스템','system',NULL,NULL,NULL,NULL,NULL,NULL,1,'system',DATETIME('NOW', 'localtime')),
	 ('SYS016','1','공통','system',NULL,NULL,NULL,NULL,NULL,NULL,2,'system',DATETIME('NOW', 'localtime')),
	 ('SYS016','2','프로그램','system',NULL,NULL,NULL,NULL,NULL,NULL,3,'system',DATETIME('NOW', 'localtime'));

-- 코드도움
INSERT INTO CodeHelp (CodeHelpID,DataSourceID,CodeHelpName,CommandText,CodeColumnID,ValueColumnID,UseYN,Comment,CreatedMemberNo,CreatedAt) VALUES
     ('CHP001','CHECKUPDB','기초코드','SELECT BC.CodeID
       , BC.CodeValue
FROM   BaseCode BC
WHERE  BC.GroupCode = @GroupCode
ORDER  BY BC.SortingNo;','CodeID','CodeValue','Y','기초코드 데이터','system',DATETIME('NOW', 'localtime'));

INSERT INTO CodeHelp (CodeHelpID,DataSourceID,CodeHelpName,CommandText,CodeColumnID,ValueColumnID,UseYN,Comment,CreatedMemberNo,CreatedAt) VALUES
	 ('CHP014','CHECKUPDB','태넌트 엔티티 정보','SELECT ME.EntityNo
    , ME.EntityID || '' ['' || ME.EntityName || '']'' AS EntityName
	, ME.Acronyms
	, (SELECT json_group_array(
		json_object(
			''FieldID'', FieldID,
			''FieldType'', FieldType,
			''MaxLength'', MaxLength,
			''SortingNo'', SortingNo,
			''FieldIndex'', FieldIndex
		)
	) AS EntityField
FROM (SELECT MF.FieldID, MF.FieldType, MF.MaxLength, MF.SortingNo, CASE WHEN MF.PK = ''Y'' OR MF.IX = ''Y'' OR MF.UI = ''Y'' THEN ''Y'' ELSE ''N'' END AS FieldIndex FROM MetaField MF WHERE MF.EntityNo = ME.EntityNo)
MF) AS EntityField
FROM MetaEntity ME
WHERE  ME.DeletedAt IS NULL
	AND ME.ApplicationNo = @ApplicationNo
ORDER  BY ME.EntityID;','EntityNo','EntityName','Y','사용자 엔티티 정보','system',DATETIME('NOW', 'localtime'));

-- 코드도움 스키마
INSERT INTO CodeHelpScheme (CodeHelpID,ColumnID,ColumnText,HiddenYN,SortingNo) VALUES
	 ('CHP001','CodeID','코드ID',0,3),
	 ('CHP001','CodeValue','코드값',0,4),
	 ('CHP001','LocaleID','언어권ID',1,2),
	 ('CHP001','SelectY','기본선택여부',1,1);