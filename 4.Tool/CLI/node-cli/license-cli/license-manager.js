const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class LicenseManager {
    constructor() {
        this.algorithm = 'aes-256-cbc';
        this.hashAlgorithm = 'sha256';
        this.encoding = 'base64';
        this.licenses = new Map();
        this.defaultHosts = ['localhost', '127.0.0.1'];
        this.saltValue = 'handstack-salt-value';
        this.publisher = 'handstack.kr';
        this.currentUser = 'handstack';
    }

    /**
     * 입력값 검증
     */
    validateInput(options) {
        const required = ['moduleId', 'companyName', 'productName', 'authorizedHosts'];
        
        for (const field of required) {
            if (!options[field]) {
                throw new Error(`${field} is required`);
            }
        }

        // ModuleID 형식 검증 (영문, 숫자, 하이픈, 언더스코어만 허용)
        if (!/^[a-zA-Z0-9_-]+$/.test(options.moduleId)) {
            throw new Error('ModuleID must contain only alphanumeric characters, hyphens, and underscores');
        }

        // 만료일 형식 검증
        if (options.expiresAt && !this.isValidISODate(options.expiresAt)) {
            throw new Error('ExpiresAt must be a valid ISO date string or null');
        }

        // 호스트 목록 검증
        if (typeof options.authorizedHosts === 'string') {
            // 콤마로 구분된 문자열을 배열로 변환
            options.authorizedHosts = options.authorizedHosts.split(',').map(host => host.trim()).filter(host => host);
        }

        if (!Array.isArray(options.authorizedHosts) || options.authorizedHosts.length === 0) {
            throw new Error('AuthorizedHosts must be a non-empty array or comma-separated string');
        }

        // 각 호스트 형식 검증
        options.authorizedHosts.forEach(host => {
            if (!this.isValidHost(host)) {
                throw new Error(`Invalid host format: ${host}`);
            }
        });
    }

    /**
     * 호스트 형식 검증 (도메인 또는 IP)
     */
    isValidHost(host) {
        if (!host || typeof host !== 'string') return false;
        
        // IP 주소 검증 (간단한 형태)
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (ipRegex.test(host)) return true;

        // 도메인 검증 (기본적인 형태)
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (domainRegex.test(host)) return true;

        // 와일드카드 도메인 허용
        if (host.startsWith('*.') && domainRegex.test(host.substring(2))) return true;

        // localhost나 특수한 호스트명 허용
        if (['localhost', 'localhost.localdomain'].includes(host)) return true;

        return false;
    }

    /**
     * ISO 날짜 형식 검증
     */
    isValidISODate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date) && date.toISOString() === dateString;
    }

    /**
     * 허용된 호스트 목록 구성
     */
    buildAllowedHosts(authorizedHosts) {
        const hosts = [...this.defaultHosts];
        
        // 중복 제거하면서 추가
        authorizedHosts.forEach(host => {
            if (!hosts.includes(host)) {
                hosts.push(host);
            }
        });
        
        return hosts.join(',');
    }

    /**
     * 라이선스 데이터 문자열 구성
     */
    buildLicenseDataString({ companyName, createdAt, expiresAt, environment, allowedHosts }) {
        return `${companyName}|${createdAt}|${expiresAt || ''}|${environment}|${allowedHosts}`;
    }

    /**
     * AES256 암호화
     */
    encryptLicenseKey(data, secretKey) {
        try {
            // 비밀키를 32바이트로 조정
            const key = crypto.scryptSync(secretKey, this.saltValue, 32);
            
            // 초기화 벡터 생성
            const iv = crypto.randomBytes(16);
            
            // 암호화
            const cipher = crypto.createCipheriv(this.algorithm, key, iv);
            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            // IV와 암호화된 데이터를 결합하여 Base64로 인코딩
            const result = iv.toString('hex') + ':' + encrypted;
            
            return Buffer.from(result).toString(this.encoding);
            
        } catch (error) {
            throw new Error(`Encryption failed: ${error.message}`);
        }
    }

    /**
     * SHA256 서명 키 생성
     */
    generateSignKey(data) {
        return crypto
            .createHash(this.hashAlgorithm)
            .update(data + this.saltValue)
            .digest('hex');
    }

    /**
     * 라이선스 키 복호화 (검증용)
     */
    decryptLicenseKey(encryptedKey, secretKey) {
        try {
            // Base64 디코딩
            const decoded = Buffer.from(encryptedKey, this.encoding).toString();
            const [ivHex, encryptedData] = decoded.split(':');
            
            if (!ivHex || !encryptedData) {
                throw new Error('Invalid encrypted key format');
            }
            
            // 비밀키 복원
            const key = crypto.scryptSync(secretKey, this.saltValue, 32);
            
            // IV 복원
            const iv = Buffer.from(ivHex, 'hex');
            
            // 복호화
            const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
            let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
            
        } catch (error) {
            throw new Error(`Decryption failed: ${error.message}`);
        }
    }

    /**
     * 라이선스 키 생성
     */
    generateLicense(options) {
        // 입력 검증
        this.validateInput(options);

        const {
            moduleId,
            companyName,
            productName,
            authorizedHosts,
            environment = 'Development',
            expiresAt = null,
            createdBy = this.currentUser
        } = options;

        // 현재 시간 (UTC)
        const createdAt = new Date().toISOString();

        // 허용된 호스트 목록 생성
        const allowedHosts = this.buildAllowedHosts(authorizedHosts);

        // 라이선스 데이터 문자열 생성
        const licenseData = this.buildLicenseDataString({
            companyName,
            createdAt,
            expiresAt,
            environment,
            allowedHosts
        });

        // AES256 암호화된 키 생성
        const encryptedKey = this.encryptLicenseKey(licenseData, moduleId);

        // SHA256 서명 키 생성
        const signKey = this.generateSignKey(licenseData);

        // 라이선스 객체 구성
        const license = {
            CompanyName: companyName,
            ProductName: productName,
            AuthorizedHost: authorizedHosts.join(','),
            Key: encryptedKey,
            CreatedAt: createdAt,
            ExpiresAt: expiresAt,
            Environment: environment,
            SignKey: signKey
        };

        return {
            moduleId,
            license,
            metadata: {
                licenseDataString: licenseData,
                allowedHosts: allowedHosts.split(','),
                createdBy,
                originalHosts: authorizedHosts
            }
        };
    }

    /**
     * JavaScript 라이선스 파일 생성
     */
    generateJavaScriptLicense(moduleId, options = {}) {
        const licenseInfo = this.licenses.get(moduleId);
        if (!licenseInfo) {
            throw new Error(`License not found for module: ${moduleId}`);
        }

        const license = licenseInfo.license;
        const {
            minify = false,
            addTimestamp = true,
            customPublisher = null,
            outputDir = './licenses',
            filePrefix = '',
            fileSuffix = 'License'
        } = options;

        // 모듈 ID를 JavaScript 변수명으로 변환 (camelCase)
        const jsModuleId = this.toJavaScriptVariableName(moduleId);
        
        // 파일명 생성
        const fileName = `${filePrefix}${jsModuleId}${fileSuffix}.js`;
        
        // 현재 UTC 시간
        const currentTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
        
        // 라이선스 문자열 (Key.SignKey 형식)
        const licenseString = `${license.Key}.${license.SignKey}`;
        
        // 헤더 주석 생성
        let header = '/*!\n';
        header += ` * Product ID: ${license.ProductName}\n`;
        header += ` * Authorized Domain(or IP): ${license.AuthorizedHost}\n`;
        header += ` * Publisher: ${customPublisher || this.publisher}\n`;
        
        if (addTimestamp) {
            header += ` * Generated: ${currentTime} UTC\n`;
            header += ` * Generated By: ${this.currentUser}\n`;
            header += ` * Module ID: ${moduleId}\n`;
            header += ` * Environment: ${license.Environment}\n`;
            if (license.ExpiresAt) {
                header += ` * Expires: ${license.ExpiresAt}\n`;
            }
        }
        
        header += ' */\n';
        
        // JavaScript 코드 생성
        let jsCode = '';
        
        if (!minify) {
            jsCode += '/* eslint-disable */\n';
            jsCode += `var ${jsModuleId}License = "${licenseString}";\n`;
            jsCode += `if (typeof window !== "undefined") window.${jsModuleId}License = ${jsModuleId}License;\n`;
        } else {
            // 압축된 버전
            jsCode += `var ${jsModuleId}License="${licenseString}";if(typeof window!=="undefined")window.${jsModuleId}License=${jsModuleId}License;`;
        }
        
        // 전체 파일 내용
        const fileContent = header + jsCode;
        
        // 출력 디렉토리 생성
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // 파일 경로
        const filePath = path.join(outputDir, fileName);
        
        // 파일 저장
        fs.writeFileSync(filePath, fileContent, 'utf8');
        
        return {
            fileName,
            filePath: path.resolve(filePath),
            fileContent,
            licenseString,
            jsModuleId,
            fileSize: Buffer.byteLength(fileContent, 'utf8')
        };
    }

    /**
     * 모든 라이선스에 대한 JavaScript 파일 생성
     */
    generateAllJavaScriptLicenses(options = {}) {
        const results = [];
        const allLicenses = this.getAllLicenses();
        
        if (allLicenses.length === 0) {
            throw new Error('No licenses found to generate JavaScript files');
        }
        
        console.log(`Generating JavaScript license files for ${allLicenses.length} license(s)...\n`);
        
        allLicenses.forEach((licenseInfo, index) => {
            try {
                const result = this.generateJavaScriptLicense(licenseInfo.moduleId, options);
                results.push({
                    moduleId: licenseInfo.moduleId,
                    success: true,
                    ...result
                });
                
                console.log(`[${index + 1}/${allLicenses.length}] Generated: ${result.fileName}`);
                console.log(`   Module: ${licenseInfo.moduleId}`);
                console.log(`   Size: ${result.fileSize} bytes`);
                console.log(`   Path: ${result.filePath}`);
                console.log('');
                
            } catch (error) {
                results.push({
                    moduleId: licenseInfo.moduleId,
                    success: false,
                    error: error.message
                });
                
                console.error(`[${index + 1}/${allLicenses.length}] Failed: ${licenseInfo.moduleId}`);
                console.error(`   Error: ${error.message}`);
                console.log('');
            }
        });
        
        return results;
    }

    /**
     * 문자열을 JavaScript 변수명으로 변환 (camelCase)
     */
    toJavaScriptVariableName(str) {
        return str
            .split(/[-_]/)
            .map((word, index) => {
                if (index === 0) {
                    return word.toLowerCase();
                }
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join('');
    }

    /**
     * 라이선스 검증
     */
    validateLicense(licenseObj, moduleId) {
        try {
            // 키 복호화
            const decryptedData = this.decryptLicenseKey(licenseObj.Key, moduleId);
            
            // 서명 검증
            const expectedSignKey = this.generateSignKey(decryptedData);
            if (expectedSignKey !== licenseObj.SignKey) {
                return { valid: false, reason: 'Invalid signature' };
            }
            
            // 데이터 파싱
            const [companyName, createdAt, expiresAt, environment, allowedHosts] = decryptedData.split('|');
            
            // 기본 검증
            if (companyName !== licenseObj.CompanyName) {
                return { valid: false, reason: 'Company name mismatch' };
            }
            
            if (environment !== licenseObj.Environment) {
                return { valid: false, reason: 'Environment mismatch' };
            }
            
            // 만료일 검증
            if (expiresAt && new Date(expiresAt) < new Date()) {
                return { valid: false, reason: 'License expired' };
            }
            
            return {
                valid: true,
                data: {
                    companyName,
                    createdAt,
                    expiresAt: expiresAt || null,
                    environment,
                    allowedHosts: allowedHosts.split(',')
                }
            };
            
        } catch (error) {
            return { valid: false, reason: error.message };
        }
    }

    /**
     * 새 라이선스 생성 및 추가
     */
    addLicense(options) {
        const licenseInfo = this.generateLicense(options);
        this.licenses.set(licenseInfo.moduleId, licenseInfo);
        
        console.log(`License created for Module: ${licenseInfo.moduleId}`);
        console.log(`   Company: ${licenseInfo.license.CompanyName}`);
        console.log(`   Product: ${licenseInfo.license.ProductName}`);
        console.log(`   Authorized Hosts: ${licenseInfo.license.AuthorizedHost}`);
        console.log(`   Environment: ${licenseInfo.license.Environment}`);
        console.log(`   Created: ${licenseInfo.license.CreatedAt}`);
        console.log(`   Expires: ${licenseInfo.license.ExpiresAt || 'Never'}`);
        console.log(`   Key Preview: ${licenseInfo.license.Key.substring(0, 50)}...`);
        
        return licenseInfo;
    }

    /**
     * 라이선스 조회
     */
    getLicense(moduleId) {
        return this.licenses.get(moduleId);
    }

    /**
     * 모든 라이선스 조회
     */
    getAllLicenses() {
        return Array.from(this.licenses.values());
    }

    /**
     * 라이선스 검증 (저장된 라이선스 대상)
     */
    validateStoredLicense(moduleId, licenseObj = null) {
        const licenseInfo = licenseObj || this.licenses.get(moduleId);
        
        if (!licenseInfo) {
            return { valid: false, reason: 'License not found' };
        }
        
        const license = licenseInfo.license || licenseInfo;
        return this.validateLicense(license, moduleId);
    }

    /**
     * 라이선스 컬렉션 생성
     */
    createLicenseCollection(licenses = null) {
        const collection = { 
            Licenses: {},
            GeneratedAt: new Date().toISOString(),
            GeneratedBy: this.currentUser,
            Version: '1.0.0'
        };
        
        const licensesToExport = licenses || this.getAllLicenses();
        
        licensesToExport.forEach(licenseInfo => {
            collection.Licenses[licenseInfo.moduleId] = licenseInfo.license;
        });
        
        return collection;
    }

    /**
     * 라이선스 컬렉션 내보내기
     */
    exportLicenses() {
        return this.createLicenseCollection();
    }

    /**
     * 라이선스를 파일로 저장
     */
    saveLicenseToFile(licenseCollection, filename = 'licenses.json') {
        const filePath = path.resolve(filename);
        const jsonContent = JSON.stringify(licenseCollection, null, 2);
        
        fs.writeFileSync(filePath, jsonContent, 'utf8');
        console.log(`License saved to: ${filePath}`);
        
        return filePath;
    }

    /**
     * 파일로 저장
     */
    saveToFile(filename) {
        const collection = this.exportLicenses();
        return this.saveLicenseToFile(collection, filename);
    }

    /**
     * 파일에서 로드
     */
    loadFromFile(filename) {
        try {
            const content = fs.readFileSync(filename, 'utf8');
            const data = JSON.parse(content);
            
            if (data.Licenses) {
                this.licenses.clear(); // 기존 라이선스 제거
                
                Object.entries(data.Licenses).forEach(([moduleId, license]) => {
                    this.licenses.set(moduleId, { moduleId, license });
                });
                
                console.log(`Loaded ${Object.keys(data.Licenses).length} licenses from ${filename}`);
                console.log(`   Generated: ${data.GeneratedAt || 'Unknown'}`);
                console.log(`   Version: ${data.Version || 'Unknown'}`);
            }
            
            return data;
            
        } catch (error) {
            console.error(`Failed to load licenses from ${filename}:`, error.message);
            throw error;
        }
    }

    /**
     * 라이선스 통계
     */
    getStatistics() {
        const all = this.getAllLicenses();
        const total = all.length;
        const now = new Date();
        
        const expired = all.filter(l => {
            const expiresAt = l.license.ExpiresAt;
            return expiresAt && new Date(expiresAt) < now;
        }).length;
        
        const expiringSoon = all.filter(l => {
            const expiresAt = l.license.ExpiresAt;
            if (!expiresAt) return false;
            const expiryDate = new Date(expiresAt);
            const daysUntilExpiry = (expiryDate - now) / (1000 * 60 * 60 * 24);
            return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
        }).length;
        
        const byEnvironment = all.reduce((acc, l) => {
            const env = l.license.Environment;
            acc[env] = (acc[env] || 0) + 1;
            return acc;
        }, {});
        
        const byCompany = all.reduce((acc, l) => {
            const company = l.license.CompanyName;
            acc[company] = (acc[company] || 0) + 1;
            return acc;
        }, {});
        
        return {
            total,
            active: total - expired,
            expired,
            expiringSoon,
            byEnvironment,
            byCompany
        };
    }

    /**
     * 호스트 검증 (특정 호스트가 라이선스에서 허용되는지 확인)
     */
    validateHostAccess(moduleId, requestHost) {
        const licenseInfo = this.licenses.get(moduleId);
        if (!licenseInfo) {
            return { valid: false, reason: 'License not found' };
        }

        // 기본 라이선스 검증
        const validationResult = this.validateStoredLicense(moduleId);
        if (!validationResult.valid) {
            return validationResult;
        }

        // 허용된 호스트 목록 확인
        const allowedHosts = validationResult.data.allowedHosts;
        
        // 정확한 매치
        if (allowedHosts.includes(requestHost)) {
            return { valid: true, matchType: 'exact' };
        }
        
        // 서브도메인 매치 확인
        const domainMatch = allowedHosts.find(allowedHost => {
            // IP 주소는 서브도메인 매치 안함
            if (/^\d+\.\d+\.\d+\.\d+$/.test(allowedHost)) return false;
            
            // 와일드카드나 서브도메인 매치
            return requestHost.endsWith('.' + allowedHost) || 
                   allowedHost.startsWith('*.') && requestHost.endsWith(allowedHost.substring(1));
        });
        
        if (domainMatch) {
            return { valid: true, matchType: 'subdomain', matchedHost: domainMatch };
        }
        
        return { 
            valid: false, 
            reason: `Host '${requestHost}' not authorized. Allowed: ${allowedHosts.join(', ')}` 
        };
    }
}

module.exports = LicenseManager;
