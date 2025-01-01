const startButton = document.getElementById('startButton')

let mesList = [];
let mesToUse = [];

let iconMap = new Map();
// 画像の読み込み
for (let i = 0; i < 42; i++) {
    const img = new Image(); // 画像オブジェクトを作成
    // 画像のソースを設定
    const index = i;
    img.src = "icons/" + i + ".png";
    img.onload = () => {
        iconMap.set(index, img);
    }
}

let counters = getParameterList();
let icons = [];

window.addEventListener('load', () => {

    let ws = new WebSocket("ws://localhost:48080");

    let tempList = [];
    let timeStamp = 0;

    ws.onmessage = async mes => {
        let parsed = JSON.parse(mes.data);
        console.log(parsed);

        if (parsed.value && parsed.value * 1 > 0.3) {
            tempList.push(parsed);
        }

        if (parsed.status) {
            counters = getParameterList();
            icons = [];
        }
        timeStamp = new Date().getTime();
    }

    setInterval(() => {
        if (new Date().getTime() - timeStamp < 10) {
            return;
        }
        mesList.push(...tempList.splice(0, tempList.length));
    }, 5);

    navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: {
            width: 1600,
            height: 1080,
            frameRate: 60
        }
    }).then(stream => {

        const video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;
        video.play();

        // Canvasの設定
        const canvas = document.createElement('canvas');
        canvas.width = 1600;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');

        let parent = document.querySelector("#content");
        document.querySelector("#content").append(canvas);

        // 毎フレーム描画するためのループ
        video.addEventListener('play', function () {
            let lastYellowPosition = -1;
            const drawFrame = () => {
                // Videoが再生中であれば
                if (!video.paused && !video.ended) {
                    // MediaStreamの上部1920x300をCanvasに描画
                    ctx.drawImage(video, 0, 30, 1600, 300, 0, 0, 1600, 300);


                    // 上から40pxあたり、縦120pxの範囲 (40px-160px) のピクセルデータを取得
                    const imageData = ctx.getImageData(0, 40, 1600, 120);
                    const data = imageData.data; // RGBAのピクセルデータ

                    let yellowPosition = -1;

                    // 横方向にループ（1920ピクセル）
                    for (let x = 0; x < 1600; x += 4) {
                        let yellowCount = 0;

                        // 縦40ピクセル分ループ
                        for (let y = 0; y < 120; y++) {
                            const index = (y * 1600 + x) * 4; // RGBAの開始インデックス
                            const r = data[index];
                            const g = data[index + 1];
                            const b = data[index + 2];

                            // 色が黄色に近いか確認
                            if (isYellowish(r, g, b)) {
                                yellowCount++;
                            }
                        }

                        // 縦120pxのうち一定以上のピクセルが黄色なら、そのx位置を記録
                        if (yellowCount > 90) {  // 例えば120ピクセル中90ピクセル以上が黄色なら
                            yellowPosition = x;
                            break; // 最初に見つけた位置で止める
                        }
                    }


                    ctx.font = '40px sans-serif';  // フォントサイズとフォントファミリー
                    ctx.fillStyle = 'black';       // 文字の色

                    // 黄色い棒の横位置をログに出力
                    if (yellowPosition !== -1) {

                        if (yellowPosition < lastYellowPosition - 50) {
                            icons = [];
                        }

                        if (mesList.length >= 2) {
                            mesList = Object.values(
                                mesList.reduce((acc, item) => {
                                    // type がすでに存在し、tech が小さい場合は更新
                                    if (!acc[getPositionFromType(item.tech)] || acc[getPositionFromType(item.tech)].tech < item.tech) {
                                        acc[getPositionFromType(item.tech)] = item;
                                    }
                                    return acc;
                                }, {})
                            );

                        }
                        for (const element of mesList) {
                            let position = yellowPosition;
                            let type = getPositionFromType(element.tech);
                            if (type == 1) {
                                position -= 160;
                            } else if (type == 2) {
                                position -= 130;
                            } else {
                                position -= 100;
                            }
                            if (counters[element.tech]) {
                                let item = counters[element.tech];
                                if (item.value) {
                                    item.value++;
                                }
                                else {
                                    item.value = 1;
                                }

                            }
                            icons.push({
                                tech: element.tech,
                                position: position // 一旦130減らしてみる
                            })
                        }

                        if (mesList.length != 0) {
                            mesList = [];
                        }
                        lastYellowPosition = yellowPosition;

                    } else {
                    }

                    for (const element of icons) {
                        const icon = iconMap.get(element.tech);
                        if (!icon) {
                            continue;
                        }

                        ctx.drawImage(icon, element.position, 30, 50, 50);
                        /*
                        ctx.font = '40px sans-serif';  // フォントサイズとフォントファミリー
                        ctx.fillStyle = 'Yellow';       // 文字の色

                        ctx.fillText(element.text, element.position, 50);
                        */
                    }
                    requestAnimationFrame(drawFrame);  // 次のフレームで再描画
                }
                canvas.style.width = parent.clientWidth + "px";

                drawCounters();

            };
            drawFrame();  // 初回フレームの描画開始
        });


    }).catch(e => console.log(e))
})


let drawn = false;

function drawCounters() {

    if (drawn) {

        for (let i = 0; i < counters.length; i++) {
            let param = counters[i];
            if (!param) {
                continue;
            }
            document.querySelector("#param-" + i).innerHTML = param.value ? param.value : 0;
        }
        return;
    }

    drawn = true;
    const cardContainer = document.getElementById("card-container");
    cardContainer.innerHTML = "";
    // 各パラメータをカードとして表示
    for (let i = 0; i < counters.length; i++) {
        let param = counters[i];
        if (!param) {
            continue;
        }
        const card = document.createElement("div");
        card.className = "parameter-card";

        card.innerHTML = `
    <h2>${param.name}</h2>
    <div class="value"><img width=30 height=30 src="icons/${i}.png"><span id="param-${i}"></span></div>
  `;

        cardContainer.appendChild(card);
    }
}


function isYellowish(r, g, b) {
    // 黄色はおおよそ (r: 200-255, g: 200-255, b: 0-100) の範囲
    return r > 200 && g > 200 && b < 100;
}



function getPositionFromType(type) {
    switch (type) {
        case 0:
        case 10:
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 9:
        case 0xc:
        case 6:
        case 7:
        case 8:
        case 0x28:
            return 1;
        case 0xb:  // こぶし(中間)
        case 0x22:  // ビブラート
        case 0x23:  // ビブラート
        case 0x24:  // ビブラート
        case 0x25:  // ビブラート
        case 0x26:  // ビブラート
        case 0xd:
        case 0xe:
        case 0x16:
        case 0x2a:
            return 2;
        case 0x12:  // フォール
        case 0x13:  // 早いフォール
        case 0x14:  // ヒーカップ
        case 0x15:  // フォール付きヒーカップ
        case 0x29:  // フォールエッジ
            return 3;
        default:
            return 0;
    }
}

function getParameterList() {
    return [
        { name: "しゃくり" },
        { name: "大しゃくり" },
        { name: "早しゃくり" },
        { name: "早しゃくり大" },
        { name: "Lアクセント" },
        { name: "Lアクセント強" },
        { name: "Vアクセント" },
        { name: "Vアクセント谷" },
        { name: "Vアクセント下" },
        { name: "逆Vアクセント" },
        { name: "先頭こぶし" },
        { name: "中間こぶし" },
        { name: "フライダウン" },
        { name: "ハンマリング" },
        { name: "プリング" },
        { name: "上昇port." },
        { name: "下降port." },
        null,
        { name: "フォール" },
        { name: "早フォール" },
        { name: "ヒーカップ" },
        { name: "フォールヒーカ" },
        { name: "スロウダウン" },
        { name: "スライダー" },
        { name: "水平" },
        { name: "スタッカート" },//25
        { name: "U形" },
        { name: "逆U形" },
        { name: "への字形" },
        { name: "アーチ形" },
        { name: "ビブ30" },
        { name: "ビブ31" },
        { name: "ビブ32" },
        { name: "ビブ33" },
        { name: "ビブ34" },
        { name: "ビブ35" },
        { name: "ビブ36" },
        { name: "ビブ37" },
        { name: "ビブ38" },
        { name: "ジャストヒット" },
        { name: "エッジボイス" },
        { name: "フォールエッジ" },
        { name: "逆こぶし" },
        { name: "歌い回しなし" },
    ]
}