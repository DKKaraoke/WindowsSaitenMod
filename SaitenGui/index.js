const { app, BrowserWindow, desktopCapturer, session } = require('electron')
const net = require('net');

app.whenReady().then(async () => {

    const { spawn } = require('child_process');

    const child = spawn("hook/dam.exe", {}, {
        stdio: 'pipe', // piping all stdio to /dev/null
        detached: false, // メインプロセスから切り離す設定
        env: process.env, // NODE_ENV を tick.js へ与えるため
    });

    child.on('exit', (code, signal) => {
        process.exit();
    });

    const host = 'localhost';
    const port = 48080;

    try {
        await checkConnection(host, port);
    } catch {
        process.exit(1);
        return;
    }

    const mainWindow = new BrowserWindow({
        height: 1080, width: 1600,
        // frame: false, // transparent: true
    });
    mainWindow.setMenuBarVisibility(false);

    mainWindow.on('closed', () => {
        app.quit();        // アプリを終了
    });


    session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
        desktopCapturer.getSources({ types: ['window'] }).then((sources) => {
            // 最初に見つけた画面へのアクセスを認可します。
            var target = null;
            for (const element of sources) {
                if (element.name.indexOf("KARAOKE@DAM") != -1) {
                    target = element;
                    break;
                }
            }
            if (!target) {
                // rendererに通知したほうが好ましい
                process.exit(1);
                return;
            }
            callback({ video: target, audio: "loopback" })
        })
        // If true, use the system picker if available.
        // Note: this is currently experimental. If the system picker
        // is available, it will be used and the media request handler
        // will not be invoked.
    }, { useSystemPicker: true })

    mainWindow.loadFile('index.html');
    // mainWindow.webContents.openDevTools()
})


function checkConnection(host, port, retries = 30, delay = 200) {
    return new Promise((resolve, reject) => {
        const tryConnect = (attempt) => {
            if (attempt > retries) {
                return reject(new Error(`Failed to connect to ${host}:${port} after ${retries} attempts.`));
            }

            const socket = new net.Socket();
            socket.setTimeout(5000); // タイムアウトを5秒に設定

            socket.connect(port, host, () => {
                console.log(`Successfully connected to ${host}:${port} on attempt ${attempt}`);
                socket.destroy(); // 接続確認後にソケットを閉じる
                resolve();
            });

            socket.on('error', (err) => {
                console.log(`Attempt ${attempt}: Failed to connect to ${host}:${port}. Retrying in ${delay}ms...`);
                socket.destroy(); // エラー時にもソケットを閉じる
                setTimeout(() => tryConnect(attempt + 1), delay); // 再試行
            });

            socket.on('timeout', () => {
                console.log(`Attempt ${attempt}: Connection to ${host}:${port} timed out. Retrying in ${delay}ms...`);
                socket.destroy(); // タイムアウト時にもソケットを閉じる
                setTimeout(() => tryConnect(attempt + 1), delay); // 再試行
            });
        };

        tryConnect(1); // 初回試行
    });
};