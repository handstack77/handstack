/*!
HandStack Javascript Library v2025.3.2
https://handshake.kr

Copyright 2025, HandStack
*/

const getGlobal = () => {
    if (typeof globalThis !== 'undefined') return globalThis;
    if (typeof self !== 'undefined') return self;
    if (typeof window !== 'undefined') return window;
    if (typeof global !== 'undefined') return global;
    if (typeof this !== 'undefined') return this;
    throw new Error('전역 객체를 찾을 수 없습니다');
};

const globalRoot = getGlobal();

globalRoot.devicePlatform = 'browser';
if ('AndroidScript' in globalRoot) {
    globalRoot.devicePlatform = 'android';
} else if ('webkit' in globalRoot) {
    globalRoot.devicePlatform = 'ios';
} else if ('process' in globalRoot && typeof module === 'object') {
    globalRoot.devicePlatform = 'node';
}

class Module {
    constructor(config) {
        if (config) {
            this.extend(config);
        }
    }

    concreate() { }

    extend(source, val) {
        if (arguments.length > 1) {
            const ancestor = this[source];
            if (
                ancestor &&
                typeof val === 'function' &&
                (!ancestor.valueOf || ancestor.valueOf() !== val.valueOf()) &&
                /\bbase\b/.test(val)
            ) {
                const method = val.valueOf();

                val = function () {
                    const previous = this.base || Module.prototype.base;
                    this.base = ancestor;
                    const returnValue = method.apply(this, arguments);
                    this.base = previous;
                    return returnValue;
                };

                val.valueOf = (type) => (type === 'object' ? val : method);
                val.toString = Module.toString;
            }

            if (source === 'config') {
                const argumentsExtend = (...args) => {
                    const extended = {};
                    for (const arg of args) {
                        for (const prop in arg) {
                            if (Object.prototype.hasOwnProperty.call(arg, prop)) {
                                extended[prop] = arg[prop];
                            }
                        }
                    }
                    return extended;
                };

                this[source] = argumentsExtend(this[source], val);
            } else {
                this[source] = val;
            }
        } else if (source) {
            let extend = Module.prototype.extend;

            if (!Module.prototyping && typeof this !== 'function') {
                extend = this.extend || extend;
            }

            const prototype = { toSource: null };
            const hidden = ['constructor', 'toString', 'valueOf', 'concreate'];
            let i = Module.prototyping ? 0 : 1;
            let key;

            while ((key = hidden[i++])) {
                if (source[key] != prototype[key]) {
                    extend.call(this, key, source[key]);
                }
            }

            for (const key in source) {
                if (!prototype[key]) {
                    extend.call(this, key, source[key]);
                }
            }

            const concreate = source['concreate'];
            if (concreate) {
                concreate(source);
            }
        }
        return this;
    }

    base() { }

    static extend(newType, staticType) {
        Module.prototyping = true;
        const prototype = new this();

        prototype.extend(newType);
        prototype.base = function () { };

        delete Module.prototyping;

        const constructor = prototype.constructor;
        const object = prototype.constructor = function () {
            if (!Module.prototyping) {
                if (this.constructing || this.constructor === object) {
                    this.constructing = true;
                    constructor.apply(this, arguments);
                    delete this.constructing;
                } else if (arguments[0] != null) {
                    return (arguments[0].extend || Module.prototype.extend).call(arguments[0], prototype);
                }
            }
        };

        object.ancestor = this;
        object.extend = this.extend;
        object.each = this.each;
        object.implement = this.implement;
        object.prototype = prototype;
        object.toString = this.toString;
        object.valueOf = (type) => (type === 'object' ? object : constructor.valueOf());

        object.extend(staticType);

        if (typeof object.init === 'function') {
            object.init();
        }

        return object;
    }

    static each(elements, func, props) {
        if (func === undefined || func.length === 0) {
            return;
        }

        for (const key in elements) {
            if (typeof elements[key] === 'object') {
                func.apply(elements[key], props);
            }
        }
    }

    static implement(...args) {
        for (let i = 0; i < args.length; i++) {
            if (typeof args[i] === 'function') {
                args[i](this.prototype);
            } else {
                this.prototype.extend(args[i]);
            }
        }
        return this;
    }

    static toString() {
        return String(this.valueOf());
    }
}

Module.ancestor = Object;
Module.version = 'v2025.3.2';

const syn = { Module };
syn.Config = {
    SystemID: 'HANDSTACK',
    ApplicationID: 'HDS',
    ProjectID: 'SYS',
    SystemVersion: '1.0.0',
    TransactionTimeout: 180000,
    HostName: 'WebClient',
    UIEventLogLevel: 'Verbose',
    IsLocaleTranslations: false,
    LocaleAssetUrl: '/assets/shared/language/',
    AssetsCachingID: 'cache-id',
    IsClientCaching: true,
    IsDebugMode: false,
    IsBundleLoad: false,
    ContractRequestPath: 'view',
    TenantAppRequestPath: 'app',
    SharedAssetUrl: '/assets/shared/',
    IsApiFindServer: false,
    DiscoveryApiServerUrl: '',
    ReportServer: '',
    FileManagerServer: 'http://localhost:8000',
    FindClientIPServer: '/checkip',
    FindGlobalIDServer: '',
    FileServerType: 'L',
    FileBusinessIDSource: 'None',
    CookiePrefixName: 'HandStack',
    Environment: 'Development',
    DomainAPIServer: {
        ServerID: 'SERVERD01',
        ServerType: 'D',
        Protocol: 'http',
        IP: 'localhost',
        Port: '8000',
        Path: '/transact/api/transaction/execute',
        ClientIP: 'localhost'
    },
    Program: {
        ProgramName: 'ack',
        ProgramVersion: '1.0.0',
        LanguageID: 'ko',
        LocaleID: 'ko-KR',
        BranchCode: ''
    },
    Transaction: {
        ProtocolVersion: '001',
        SimulationType: 'P',
        DataFormat: 'J',
        MachineTypeID: 'WEB',
        EncryptionType: 'P',
        EncryptionKey: 'G',
        CompressionYN: 'N'
    },
    EnvironmentSetting: {
        Application: {
            LoaderPath: '/js/syn.domain.js'
        }
    }
};

syn.module = Module;

globalRoot.syn = syn;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = syn;
}
