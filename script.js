
function main() {

    const baseAddress = Module.getBaseAddress("DKKaraokeWindows.exe");

    disableForegroundCheck(baseAddress);
    hookTypeA(baseAddress);
    hookTypeB(baseAddress);
}


main();


function disableForegroundCheck(baseAddress) {


    const targetPointer = parseInt(baseAddress) + 0x0e8940;
    const targetPointerTxt = "0x" + targetPointer.toString(16);
    const addr0 = new NativePointer(targetPointerTxt);

    Memory.writeByteArray(addr0, [0xc3, 0x90, 0x90, 0x90]);

}


function hookTypeA(baseAddress) {

    const targetPointer = parseInt(baseAddress) + 0x01d29e2;
    const targetPointerTxt = "0x" + targetPointer.toString(16);
    const addr0 = new NativePointer(targetPointerTxt);

    try {
        Interceptor.attach(addr0, {
            onEnter: function (args) {

                // 本当は、XMM0レジスタの中を読めば終わりだが、fridaはこれを読みだせない。  
                // したがって、XMM0のデータをメモリに書き込む命令の直後でそのメモリの内容を呼び出すことで値を取得している。
                // その時の命令が f2 0f 11 4 ec 60  ( movsd qword ptr [rsp + rbp * 0x8 + 0x60] , xmm0)
                // これをコードで実現している
                let base = parseInt(this.context.rsp, "16");
                let type = parseInt(this.context.rbp, "16");
                let target = base + type * 0x8 + 0x60;
                let ptr = new NativePointer("0x" + target.toString(16));
                let isDetected = ptr.readDouble();
                //Memory.writeDouble(ptr, 1);
                //return;

                if (isDetected > 0) {
                    print(type);
                }

            }
        });
    } catch (e) {
        console.log(e);
    }

}


function hookTypeB(baseAddress) {

    const targetPointer = parseInt(baseAddress) + 0x01d2c08;
    const targetPointerTxt = "0x" + targetPointer.toString(16);
    const addr0 = new NativePointer(targetPointerTxt);

    try {
        Interceptor.attach(addr0, {
            onEnter: function (args) {

                let base = parseInt(this.context.rsp, "16");
                let type = parseInt(this.context.r15, "16");
                let target = base + type * 0x8 + 0x70;
                let ptr = new NativePointer("0x" + target.toString(16));
                let isDetected = ptr.readDouble();


                if (isDetected > 0) {
                    print(type);
                }

            }
        });
    } catch (e) {
        console.log(e);
    }

}

function print(type) {
    switch (type) {
        case 0:  // しゃくり
            console.log("しゃくり");
            break;
        case 10:  // こぶし(先頭)
            console.log("こぶし(先頭)");
            break;
        case 0xb:  // こぶし(中間)
            console.log("こぶし(中間)");
            break;
        case 0x12:  // フォール
            console.log("フォール");
            break;
        case 0x21:  // 
        case 0x22:  // ビブラート
        case 0x23:  // ビブラート
        case 0x24:  // ビブラート
        case 0x25:  // ビブラート
        case 0x26:  // ビブラート
            console.log("ビブラート" + type);
            break;
        case 1:  // 大しゃくり
            console.log("大しゃくり");
            break;
        case 2:  // 早いしゃくり
            console.log("早いしゃくり");
            break;
        case 3:  // 早いしゃくり(強)
            console.log("早いしゃくり(強)");
            break;
        case 4:  // L字アクセント
            console.log("L字アクセント");
            break;
        case 5:  // L字アクセント(強)
            console.log("L字アクセント(強)");
            break;
        case 9:  // 逆V字アクセント
            console.log("逆V字アクセント");
            break;
        case 0xc:  // フライダウン
            console.log("フライダウン");
            break;
        case 6:  // V字アクセント
            console.log("V字アクセント");
            break;
        case 7:  // V字アクセント(谷切れ)
            console.log("V字アクセント(谷切れ)");
            break;
        case 8:  // V字アクセント(下から)
            console.log("V字アクセント(下から)");
            break;
        case 0xd:  // ハンマリング・オン
            console.log("ハンマリング・オン");
            break;
        case 0xe:  // プリング・オフ
            console.log("プリング・オフ");
            break;
        case 0x16:  // スロウダウン
            console.log("スロウダウン");
            break;
        case 0xf:  // 上昇ポルタメント
            console.log("上昇ポルタメント");
            break;
        case 0x10:  // 下降ポルタメント
            console.log("下降ポルタメント");
            break;
        case 0x17:  // スライダー
            console.log("スライダー");
            break;
        case 0x18:  // 水平
            console.log("水平");
            break;
        case 0x19:  // スタッカート
            console.log("スタッカート");
            break;
        case 0x1a:  // U形
            console.log("U形");
            break;
        case 0x1b:  // 逆U形
            console.log("逆U形");
            break;
        case 0x1c:  // への字形
            console.log("への字形");
            break;
        case 0x1d:  // アーチ形
            console.log("アーチ形");
            break;
        case 0x1e:  // ？？？
        case 0x1f:  // ？？？
        case 0x20:  // ？？？
            console.log("特殊ビブラート" + type);
            break;
        case 0x27:  // ジャストヒット
            console.log("ジャストヒット");
            break;
        case 0x2b:  // 歌い回しなし
            console.log("歌い回しなし");
            break;

        case 0x13:  // 早いフォール
            console.log("早いフォール");
            break;
        case 0x14:  // ヒーカップ
            console.log("ヒーカップ");
            break;
        case 0x15:  // フォール付きヒーカップ
            console.log("フォール付きヒーカップ");
            break;
        case 0x28:  // エッジボイス
            console.log("エッジボイス");
            break;
        case 0x29:  // フォールエッジ
            console.log("フォールエッジ");
            break;
        case 0x2a:  // 逆こぶし
            console.log("逆こぶし");
            break;
        default:
            break;
    }
}