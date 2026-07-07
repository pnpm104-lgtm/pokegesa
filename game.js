// 画面の読み込みがすべて完了してから安全に実行する
window.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 0. HTML側の設定を自動的に4桁用に調整
  // ==========================================
  const myCodeDisplay = document.getElementById('vs-my-code');
  const codeInput = document.getElementById('vs-code');
  const statusMsg = document.getElementById('status-msg');

  if (myCodeDisplay && (myCodeDisplay.textContent === '---' || myCodeDisplay.textContent === '------')) {
    myCodeDisplay.textContent = '----';
  }
  if (codeInput) {
    codeInput.maxLength = 4;
    codeInput.placeholder = '1234';
    const p = codeInput.previousElementSibling;
    if (p && p.tagName === 'P') p.textContent = 'コード（数字4桁）を入力してください';
  }

  // Firebaseデータベースを安全に取得する関数
  function getDatabase() {
    if (typeof firebase !== 'undefined') {
      return firebase.database();
    }
    return null;
  }

  // ==========================================
  // 1. ルーム作成（ホスト側）の処理
  // ==========================================
  const createBtn = document.getElementById('vs-create');

  if (createBtn) {
    createBtn.addEventListener('click', () => {
      // 1000～9999の「4桁」のランダムな数字を生成
      const generatedCode = String(Math.floor(1000 + Math.random() * 9000));
      
      // 画面に4桁コードを表示
      if (myCodeDisplay) {
        myCodeDisplay.textContent = generatedCode;
      }
      if (statusMsg) {
        statusMsg.textContent = "ルームを作成しました。対戦相手を待っています...";
      }

      const db = getDatabase();
      if (db) {
        // Firebaseに4桁のルームを作成
        const roomRef = db.ref('rooms/' + generatedCode);
        roomRef.set({
          status: 'waiting',
          createdAt: firebase.database.ServerValue.TIMESTAMP
        });

        // 相手が参加してくるのを監視
        roomRef.on('value', (snapshot) => {
          const roomData = snapshot.val();
          if (roomData && roomData.status === 'playing') {
            roomRef.off(); // 監視を解除
            startGame(generatedCode, 'host');
          }
        });
      } else {
        console.warn("Firebase未接続：画面上でのみ4桁コードを生成しました。");
      }

      console.log("Generated 4-Digit Room Code:", generatedCode);
    });
  }

  // ==========================================
  // 2. ルーム参加（ゲスト側）の処理
  // ==========================================
  const joinBtn = document.getElementById('vs-join');

  if (joinBtn) {
    joinBtn.addEventListener('click', () => {
      if (!codeInput) return;
      
      const enteredCode = codeInput.value.trim();

      // 入力チェックを「4桁の数字」に変更
      if (enteredCode.length !== 4 || isNaN(enteredCode)) {
        alert("4桁の数字を入力してください。");
        return;
      }

      const db = getDatabase();
      if (!db) {
        alert("通信環境の準備ができていません。");
        return;
      }

      // Firebaseで4桁のルームがあるか確認
      const roomRef = db.ref('rooms/' + enteredCode);
      roomRef.once('value').then((snapshot) => {
        if (snapshot.exists()) {
          const roomData = snapshot.val();
          
          if (roomData.status === 'waiting') {
            // ルームのステータスを対戦中（playing）に更新
            roomRef.update({ status: 'playing' }).then(() => {
              console.log("ルームに参加成功！");
              startGame(enteredCode, 'guest');
            });
          } else {
            alert("このルームはすでに満員か、対戦が始まっています。");
          }
        } else {
          alert("ルームが見つかりません。コードを確認してください。");
        }
      }).catch((error) => {
        console.error("Error joining room:", error);
      });
    });
  }

  // ==========================================
  // 3. ゲーム開始画面への切り替え処理（仮）
  // ==========================================
  function startGame(roomCode, role) {
    alert(`${role === 'host' ? 'ゲストが参加しました！' : 'ルームに参加しました！'} 対戦を開始します！(Room: ${roomCode})`);
  }

});
