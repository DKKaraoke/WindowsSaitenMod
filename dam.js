const frida = require('frida');
const fs = require('fs');


async function main() {

    const process = await frida.attach('DKKaraokeWindows.exe');
    let scriptText = fs.readFileSync("./script.js", 'utf8');
    const script = await process.createScript(scriptText);

    await script.load();
}

main().catch(err => {
    console.error(err);
});