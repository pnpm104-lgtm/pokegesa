export const Handlers = {
  onStartRandom: () => {
    console.log("ランダムモード開始");
  },
  onStartStats: () => {
    console.log("統計モード開始");
  },
  onStartVersus: () => {
    console.log("対戦モード開始");
    // 友達と2人で遊べるように、部屋のコードを自動生成して表示する仕組み
    const roomCodeElement = document.getElementById("versus-room-code");
    if (roomCodeElement) {
      // 6桁のランダムな数字（部屋コード）を作る
      const generatedCode = Math.floor(100000 + Math.random() * 900000);
      roomCodeElement.innerText = generatedCode;
    }
    
    // 「ルームを作成」の画面を表示する処理
    const createArea = document.getElementById("create-room-area");
    if (createArea) {
      createArea.style.display = "block";
    }
  }
};

export function initGame(options) {
  console.log("ゲーム初期化:", options);
  // 画面を指定されたコンテナ（対戦画面など）に切り替える
  if (options && options.initialScreen) {
    const screen = document.getElementById(options.initialScreen);
    if (screen) {
      screen.style.display = "block";
    }
  }
}
