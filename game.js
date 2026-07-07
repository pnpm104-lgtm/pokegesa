window.addEventListener('DOMContentLoaded', () => {

  const myCodeDisplay = document.getElementById('vs-my-code');
  const codeInput = document.getElementById('vs-code');
  const statusMsg = document.getElementById('status-msg');

  // 仮の問題データ（本来はAPI等から取得するものを同期用に定義）
  const sampleQuestion = {
    hint: "たかさ: 0.4m / おもさ: 6.0kg / でんきタイプ の ねずみポケモン は？",
    choices: ["ピカチュウ", "イーブイ", "ヒトカゲ", "ゼニガメ"],
    answerIndex: 0 // ピカチュウが正解
  };

  function getDatabase() {
    if (typeof firebase !== 'undefined') return firebase.database();
    return null;
  }

  // ==========================================
  // 1. ルーム作成（ホスト側）
  // ==========================================
  const createBtn = document.getElementById('vs-create');
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      const generatedCode = String(Math.floor(1000 + Math.random() * 9000));
      if (myCodeDisplay) myCodeDisplay.textContent = generatedCode;
      if (statusMsg) statusMsg.textContent = "ルームを作成しました。対戦相手を待っています...";

      const db = getDatabase();
      if (db) {
        const roomRef = db.ref('rooms/' + generatedCode);
        // 設計通りの初期データ構造を作成
        roomRef.set({
          status: 'waiting',
          scores: { host: 0, guest: 0 },
          game: {
            hint: sampleQuestion.hint,
            choices: sampleQuestion.choices,
            answerIndex: sampleQuestion.answerIndex,
            winner: "" // 先に正解したプレイヤーを記録する用
          },
          createdAt: firebase.database.ServerValue.TIMESTAMP
        });

        roomRef.on('value', (snapshot) => {
          const roomData = snapshot.val();
          if (roomData && roomData.status === 'playing') {
            roomRef.off(); // ロビー用の監視を解除
            startGame(generatedCode, 'host');
          }
        });
      }
    });
  }

  // ==========================================
  // 2. ルーム参加（ゲスト側）
  // ==========================================
  const joinBtn = document.getElementById('vs-join');
  if (joinBtn) {
    joinBtn.addEventListener('click', () => {
      if (!codeInput) return;
      const enteredCode = codeInput.value.trim();

      if (enteredCode.length !== 4 || isNaN(enteredCode)) {
        alert("4桁の数字を入力してください。");
        return;
      }

      const db = getDatabase();
      if (!db) return alert("通信環境の準備ができていません。");

      const roomRef = db.ref('rooms/' + enteredCode);
      roomRef.once('value').then((snapshot) => {
        if (snapshot.exists()) {
          const roomData = snapshot.val();
          if (roomData.status === 'waiting') {
            roomRef.update({ status: 'playing' }).then(() => {
              startGame(enteredCode, 'guest');
            });
          } else {
            alert("このルームはすでに満員か、対戦が始まっています。");
          }
        } else {
          alert("ルームが見つかりません。コードを確認してください。");
        }
      });
    });
  }

  // ==========================================
  // 3. 対戦ゲーム本番処理（同期・スコア管理）
  // ==========================================
  function startGame(roomCode, role) {
    // 画面切り替え
    const lobbyScreen = document.getElementById('lobby-screen');
    const quizScreen = document.getElementById('quiz-screen');
    if (lobbyScreen) lobbyScreen.classList.add('hidden');
    if (quizScreen) quizScreen.classList.remove('hidden');

    const db = getDatabase();
    if (!db) return;

    const roomRef = db.ref('rooms/' + roomCode);

    // Firebaseから問題データとスコアをリアルタイム監視
    roomRef.on('value', (snapshot) => {
      const roomData = snapshot.val();
      if (!roomData) return;

      // 1. スコアボードの更新
      document.getElementById('host-score-display').textContent = `ホスト: ${roomData.scores.host}点`;
      document.getElementById('guest-score-display').textContent = `ゲスト: ${roomData.scores.guest}点`;

      // 2. 問題の表示
      document.getElementById('quiz-hint').textContent = roomData.game.hint;
      roomData.game.choices.forEach((choice, index) => {
        const btn = document.getElementById(`btn-choice${index}`);
        if (btn) {
          btn.textContent = `${index + 1}. ${choice}`;
          
          // ボタンクリック時の正誤判定イベントを設定
          btn.onclick = () => {
            if (index === roomData.game.answerIndex) {
              // 正解した場合、Firebaseのwinnerに自分がまだ誰も書いていなければ書き込む（早い者勝ち判定）
              roomRef.child('game/winner').transaction((currentWinner) => {
                if (currentWinner === "") {
                  return role; // 自分が勝者
                }
                return currentWinner; // すでに誰かが正解していたらそのまま
              }, (error, committed, snapshot) => {
                if (committed) {
                  // スコアを加算
                  roomRef.child(`scores/${role}`).transaction((score) => (score || 0) + 10);
                  alert("正解！あなたが先に当てました！(+10点)");
                }
              });
            } else {
              alert("不正解！もう一度考えてみよう！");
            }
          };
        }
      });

      // 3. 勝敗判定（どちらかが正解した瞬間の通知表示）
      const gameStatusMsg = document.getElementById('game-status-msg');
      if (roomData.game.winner) {
        if (roomData.game.winner === role) {
          gameStatusMsg.textContent = "あなたが先取しました！";
        } else {
          gameStatusMsg.textContent = "相手に先を越されました！";
        }
      } else {
        gameStatusMsg.textContent = "早く正解をクリックしよう！";
      }
    });
  }
});
