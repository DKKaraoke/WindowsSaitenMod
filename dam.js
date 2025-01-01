const frida = require('frida');
const fs = require('fs');

const server = require('ws').Server;




async function main() {

    const fridaProcess = await frida.attach('DKKaraokeWindows.exe');
    let scriptText = fs.readFileSync("./script.js", 'utf8');
    const script = await fridaProcess.createScript(scriptText);

    script.message.connect(message => {
        try {
            if (message.type === 'send') {
                for (const element of peers) {
                    element.send(JSON.stringify(message.payload));
                }
            }
        } catch (e) {
            console.log(e)
        }
    });


    fridaProcess.detached.connect(reason => {
        console.log(`Process detached. Reason: ${reason}`);
        if (reason === 'process-terminated') {
            console.log('Process has exited.');
        } else {
            console.log('Detached for other reasons.');
        }
        process.exit(0);
    });

    await script.load();

    const wss = new server({ port: 48080 });
    let peers = [];

    wss.on('connection', function connection(ws) {
        peers.push(ws);
    });


}

main().catch(err => {
    console.error(err);
    process.exit(1);
});