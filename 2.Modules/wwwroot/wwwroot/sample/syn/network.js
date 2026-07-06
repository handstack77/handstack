'use strict';
let $network = {
    extends: [
        'parsehtml'
    ],

    prop: {
        demoChannel: null,
        demoFrame: null
    },

    hook: {
        pageLoad() {
            syn.$l.get('txt_myChannelID').value = syn.$n.myChannelID || '';
        }
    },

    method: {
        appendLog(id, message) {
            var el = syn.$l.get(id);
            var stamp = new Date().toLocaleTimeString();
            el.value = (el.value ? el.value + '\n' : '') + '[' + stamp + '] ' + message;
            el.scrollTop = el.scrollHeight;
        },

        // rooms/channel 편의 메서드(call/broadCast/emit/findChannel)를 시연하기 위해,
        // 화면 뒤에 숨겨진 iframe 하나를 만들어 'network-demo' channelID로 채널을 연결한다.
        // 이 iframe은 syn.js를 그대로 로드해서 스스로 rooms.connect()로 응답한다.
        ensureDemoChannel() {
            if ($this.prop.demoChannel != null) {
                return $this.prop.demoChannel;
            }

            var frame = document.createElement('iframe');
            frame.style.display = 'none';
            frame.setAttribute('title', 'network-demo-partner');
            frame.srcdoc = '<!doctype html><html><body>' +
                '<script src="/js/syn.js"><' + '/script>' +
                '<script>' +
                'window.addEventListener("load", function () {' +
                '  var channel = syn.$n.rooms.connect({ window: window.parent, origin: "*", scope: "network-demo" });' +
                '  channel.bind("ping", function (transaction, params) {' +
                '    return "pong: " + JSON.stringify(params);' +
                '  });' +
                '  channel.bind("note", function (origin, params) {' +
                '    var back = syn.$n.findChannel("network-demo");' +
                '    if (back) {' +
                '      back.emit({ method: "note-ack", params: params });' +
                '    }' +
                '  });' +
                '});' +
                '<' + '/script>' +
                '</body></html>';

            document.body.appendChild(frame);
            $this.prop.demoFrame = frame;

            $this.prop.demoChannel = syn.$n.rooms.connect({
                debugOutput: true,
                window: frame.contentWindow,
                origin: '*',
                scope: 'network-demo'
            });

            $this.prop.demoChannel.bind('note-ack', function (origin, params) {
                $this.method.appendLog('txt_roomsOutput', 'note-ack 수신: ' + JSON.stringify(params));
            });

            $this.method.appendLog('txt_roomsOutput', '데모용 숨김 iframe과 채널(scope: network-demo) 연결을 시작했습니다.');

            return $this.prop.demoChannel;
        }
    },

    event: {
        btn_findChannel_click() {
            $this.method.ensureDemoChannel();
            var connection = syn.$n.findChannel('network-demo');
            syn.$l.get('txt_findChannel').value = connection ? '연결됨 (scope: network-demo)' : '연결 대기 중 (잠시 후 다시 확인하세요)';
        },

        btn_call_click() {
            $this.method.ensureDemoChannel();
            var params = { message: syn.$l.get('txt_callParams').value };
            syn.$n.call('network-demo', 'ping', params);
            $this.method.appendLog('txt_roomsOutput', 'call("network-demo", "ping", ' + JSON.stringify(params) + ') 호출 (성공/실패 로그는 debugOutput 설정에 따라 브라우저 콘솔에 표시됩니다)');
        },

        btn_broadCast_click() {
            $this.method.ensureDemoChannel();
            var params = { message: syn.$l.get('txt_broadCastParams').value };
            syn.$n.broadCast('ping', params);
            $this.method.appendLog('txt_roomsOutput', 'broadCast("ping", ' + JSON.stringify(params) + ') 호출 (연결된 모든 채널로 전송)');
        },

        btn_emit_click() {
            $this.method.ensureDemoChannel();
            // emit()은 syn.$n.myChannelID로 지정된 채널을 사용하므로, 데모를 위해 임시로 지정한다.
            // 실제 서비스에서는 자식 화면이 자신의 URL(channelID 쿼리 문자열)로부터 자동 설정된다.
            syn.$n.myChannelID = 'network-demo';
            var params = { message: syn.$l.get('txt_emitParams').value };
            syn.$n.emit('note', params);
            $this.method.appendLog('txt_roomsOutput', 'emit("note", ' + JSON.stringify(params) + ') 호출 (myChannelID 채널로 전송, note-ack 응답 대기)');
        },

        btn_startSse_click() {
            var url = syn.$l.get('txt_sseUrl').value;
            if (!url) {
                $this.method.appendLog('txt_sseOutput', 'SSE 접속 주소를 먼저 입력하세요. (예시일 뿐 실제 서버가 아닌 https://example.com/sse 는 연결되지 않습니다)');
                return;
            }

            syn.$n.startSse('demo-sse', url, {
                open() {
                    $this.method.appendLog('txt_sseOutput', 'open: SSE 연결이 열렸습니다.');
                },
                message(evt) {
                    $this.method.appendLog('txt_sseOutput', 'message: ' + evt.data);
                },
                error(evt) {
                    $this.method.appendLog('txt_sseOutput', 'error: SSE 연결 오류 또는 종료 (콘솔 로그 참고)');
                }
            });
        },

        btn_getSseConnection_click() {
            var connection = syn.$n.getSseConnection('demo-sse');
            if (connection) {
                syn.$l.get('txt_sseState').value = 'readyState: ' + connection.readyState + ', url: ' + connection.url;
            }
            else {
                syn.$l.get('txt_sseState').value = '연결된 SSE(demo-sse)가 없습니다.';
            }
        },

        btn_stopSse_click() {
            var result = syn.$n.stopSse('demo-sse');
            $this.method.appendLog('txt_sseOutput', 'stopSse("demo-sse") 결과: ' + result);
        },

        btn_stopAllSse_click() {
            syn.$n.stopAllSse();
            $this.method.appendLog('txt_sseOutput', 'stopAllSse() 호출: 모든 SSE 연결을 닫았습니다.');
        },

        btn_startSocket_click() {
            var url = syn.$l.get('txt_wsUrl').value;
            if (!url) {
                $this.method.appendLog('txt_wsOutput', 'WebSocket 접속 주소를 먼저 입력하세요. (예시일 뿐 실제 서버가 아닌 wss://example.com/socket 은 연결되지 않습니다)');
                return;
            }

            syn.$n.startSocket('demo-ws', url, {
                open() {
                    $this.method.appendLog('txt_wsOutput', 'open: WebSocket 연결이 열렸습니다.');
                },
                message(data) {
                    $this.method.appendLog('txt_wsOutput', 'message: ' + (typeof data === 'string' ? data : JSON.stringify(data)));
                },
                close(evt) {
                    $this.method.appendLog('txt_wsOutput', 'close: 연결이 닫혔습니다. code: ' + evt.code);
                },
                error() {
                    $this.method.appendLog('txt_wsOutput', 'error: WebSocket 연결 오류');
                }
            }, {
                autoReconnect: false
            });
        },

        btn_sendSocketMessage_click() {
            var message = syn.$l.get('txt_wsMessage').value;
            var result = syn.$n.sendSocketMessage('demo-ws', { text: message });
            $this.method.appendLog('txt_wsOutput', 'sendSocketMessage("demo-ws", ...) 결과: ' + result);
        },

        btn_getSocket_click() {
            var socket = syn.$n.getSocket('demo-ws');
            if (socket) {
                syn.$l.get('txt_wsState').value = 'readyState: ' + socket.readyState;
            }
            else {
                syn.$l.get('txt_wsState').value = '연결된 WebSocket(demo-ws)이 없습니다.';
            }
        },

        btn_stopSocket_click() {
            syn.$n.stopSocket('demo-ws');
            $this.method.appendLog('txt_wsOutput', 'stopSocket("demo-ws") 호출: 연결을 닫았습니다.');
        },

        btn_stopAllSockets_click() {
            syn.$n.stopAllSockets();
            $this.method.appendLog('txt_wsOutput', 'stopAllSockets() 호출: 모든 WebSocket 연결을 닫았습니다.');
        }
    }
};
