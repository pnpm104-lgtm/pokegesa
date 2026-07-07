// ==========================================
// 1. ルーム作成（ホスト側）の処理修正
// ==========================================
const createBtn = document.getElementById('vs-create');
const myCodeDisplay = document.getElementById('vs-my-code');
const statusMsg = document.getElementById('status-msg');

if (createBtn) {
  createBtn.addEventListener('click', () => {
    // 【修正】100～999の「3桁」のランダムな数字を生成
    const generatedCode = String(Math.floor(100 + Math.random() * 900));
    
    // 画面の「---」部分を生成した3桁コードに書き換え
    if (myCodeDisplay) {
      myCodeDisplay.textContent = generatedCode;
    }
    
    if (statusMsg) {
      statusMsg.textContent = "ルームを作成しました。対戦相手を待っています...";
    }

    // Firebase等のリアルタイムデータベースに3桁のコードを保存
    // (お使いの環境の変数名に合わせて調整してください)
    if (typeof db !== 'undefined') {
      db.ref('rooms/' + generatedCode).set({
        status: 'waiting',
        createdAt: Date.now()
      });
    }
    
    console.log("Generated Room Code:", generatedCode);
  });
}

// ==========================================
// 2. ルーム参加（ゲスト側）の処理修正
// ==========================================
const joinBtn = document.getElementById('vs-join');
const codeInput = document.getElementById('vs-code');

if (joinBtn) {
  joinBtn.addEventListener('click', () => {
    if (!codeInput) return;
    
    const enteredCode = codeInput.value.trim();

    // 【修正】入力チェックを「3桁の数字」に変更
    if (enteredCode.length !== 3 || isNaN(enteredCode)) {
      alert("3桁の数字を入力してください。");
      return;
    }

    // Firebase等でのルーム検索・参加処理へ
    if (typeof db !== 'undefined') {
      db.ref('rooms/' + enteredCode).once('value').then((snapshot) => {
        if (snapshot.exists()) {
          console.log("ルームが見つかりました！接続します。");
          // 既存の参加完了・ゲーム開始ロジックをここに記述
        } else {
          alert("ルームが見つかりません。コードを確認してください。");
        }
      });
    }

    console.log("Trying to join room:", enteredCode);
  });
}
