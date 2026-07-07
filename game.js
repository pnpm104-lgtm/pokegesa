// ==========================================
// データベース変数を安全に取得する関数
// ==========================================
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
const myCodeDisplay = document.getElementById('vs-my-code');
const statusMsg = document.getElementById('status-msg');

if (createBtn) {
  createBtn.addEventListener('click', () => {
    // 100～999の「3桁」のランダムな数字を生成
    const generatedCode = String(Math.floor(100 + Math.random() * 900));
    
    // 画面に3桁コードを表示
    if (myCodeDisplay) {
      myCodeDisplay.textContent = generatedCode;
    }
    if (statusMsg) {
      statusMsg.textContent = "ルームを作成しました。対戦相手を待っています...";
    }

    const db = getDatabase();
    if (db) {
      // Firebaseにルームを作成し、statusを'waiting'にする
      const roomRef = db.ref('rooms/' + generatedCode);
      roomRef.set({
        status: 'waiting',
        createdAt: firebase.database.ServerValue.TIMESTAMP
      });

      // 相手が参加してくるのをリアルタイムに監視
      roomRef.on('value', (snapshot) => {
        const roomData = snapshot.val();
        if (roomData && roomData.status === 'playing') {
          roomRef.off(); // 監視を解除
          startGame(generatedCode, 'host');
        }
      });
    } else {
      console.warn("Firebase未接続：ローカルでのみコードを生成しました。");
    }

    console.log("Generated Room Code:", generatedCode);
  });
}

// ==========================================
// 2. ルーム参加（ゲスト側）の処理
// ==========================================
const joinBtn = document.getElementById('vs-join');
const codeInput = document.getElementById('vs-code');

if (joinBtn) {
  joinBtn.addEventListener('click', () => {
    if (!codeInput) return;
    
    const enteredCode = codeInput.value.trim();

    // 入力チェック（3桁の数字かどうか）
    if (enteredCode.length !== 3 || isNaN(enteredCode)) {
      alert("3桁の数字を入力してください。");
      return;
    }

    const db = getDatabase();
    if (!db) {
      alert("通信環境（Firebase）の準備ができていません。");
      return;
    }

    // Firebaseで該当するルームがあるか確認
    const roomRef = db.ref('rooms/' + enteredCode);
    roomRef.once('value').then((snapshot) => {
      if (snapshot.exists()) {
        const roomData = snapshot.val();
        
        if (roomData.status === 'waiting') {
          // ルームのステータスを'playing'（対戦中）に更新
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
// 3. ゲーム開始画面への切り替え処理
// ==========================================
function startGame(roomCode, role) {
  alert(`${role === 'host' ? 'ゲストが参加しました！' : 'ルームに参加しました！'} 対戦を開始します！(Room: ${roomCode})`);
  
  // ロビー画面を隠してゲーム画面を出す
  const lobbyScreen = document.getElementById('lobby-screen');
  const quizArea = document.querySelector('.quiz-area');
  
  if (lobbyScreen) lobbyScreen.classList.add('hidden');
  if (quizArea) quizArea.classList.remove('hidden');
}
