window.addEventListener('DOMContentLoaded', () => {

  const myCodeDisplay = document.getElementById('vs-my-code');
  const codeInput = document.getElementById('vs-code');
  const statusMsg = document.getElementById('status-msg');

  // --- 簡易版ポケモンデータマスター (PokeAPI等のデータの代わり) ---
  const pokemonDatabase = {
    "ピカチュウ": { name: "ピカチュウ", type: "でんき", gen: 1, height: 0.4, weight: 6.0 },
    "イーブイ": { name: "イーブイ", type: "ノーマル", gen: 1, height: 0.3, weight: 6.5 },
    "フシギダネ": { name: "フシギダネ", type: "くさ", gen: 1, height: 0.7, weight: 6.9 },
    "ルカリオ": { name: "ルカリオ", type: "かくとう", gen: 4, height: 1.2, weight: 54.0 },
    "ゲッコウガ": { name: "ゲッコウガ", type: "みず", gen: 6, height: 1.5, weight: 40.0 }
  };
  const pokemonNames = Object.keys(pokemonDatabase);

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
        // ランダムに正解ポケモンを1頭選出
        const randomName = pokemonNames[Math.floor(Math.random() * pokemonNames.length)];
        const answerPokemon = pokemonDatabase[randomName];

        const roomRef = db.ref('rooms/' + generatedCode);
        roomRef.set({
          status: 'waiting',
          scores: { host: 0, guest: 0 },
          answer: answerPokemon, // お互いが共通で追う正解データ
          winner: "",
          createdAt: firebase.database.ServerValue.TIMESTAMP
        });

        roomRef.on('value', (snapshot) => {
          const roomData = snapshot.val();
          if (roomData && roomData.status === 'playing') {
            roomRef.off();
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
  // 3. 対戦ゲーム本番処理（Guesserロジック・同期）
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
    let currentAnswer = null;

    // Firebaseデータの常時同期
    roomRef.on('value', (snapshot) => {
      const roomData = snapshot.val();
      if (!roomData) return;

      currentAnswer = roomData.answer;

      // ① スコア表示の同期
      document.getElementById('host-score-display').textContent = `ホスト: ${roomData.scores.host}点`;
      document.getElementById('guest-score-display').textContent = `ゲスト: ${roomData.scores.guest}点`;

      // ② 勝敗が決まった場合の処理
      if (roomData.winner) {
        const statusMsgArea = document.getElementById('game-status-msg');
        if (roomData.winner === role) {
          statusMsgArea.textContent = `🎉 あなたの勝ち！ 正解は【${currentAnswer.name}】でした！`;
        } else {
          statusMsgArea.textContent = `❌ 相手が先に正解しました！ 正解は【${currentAnswer.name}】でした。`;
        }
        document.getElementById('guess-submit-btn').disabled = true;
      }
    });

    // 自分の入力送信イベント
    const submitBtn = document.getElementById('guess-submit-btn');
    const guessInput = document.getElementById('pokemon-guess-input');
    const historyLog = document.getElementById('history-log');

    if (submitBtn && guessInput) {
      submitBtn.onclick = () => {
        const userInput = guessInput.value.trim();
        if (!userInput) return;

        // マスターデータに存在するかチェック
        if (!pokemonDatabase[userInput]) {
          alert("登録されているポケモン名を入力してください。\n(例: ピカチュウ, イーブイ, フシギダネ, ルカリオ, ゲッコウガ)");
          return;
        }

        const userPokemon = pokemonDatabase[userInput];
        
        // --- ⑤ Poke Guesserの判定アルゴリズムをシミュレート ---
        const tr = document.createElement('tr');

        // 名前セル
        const tdName = document.createElement('td');
        tdName.textContent = userPokemon.name;
        tr.appendChild(tdName);

        // タイプ判定 (一致: 🟩 , 不一致: 🟥)
        const tdType = document.createElement('td');
        if (userPokemon.type === currentAnswer.type) {
          tdType.textContent = "🟩 " + userPokemon.type;
          tdType.className = "cell-match";
        } else {
          tdType.textContent = "🟥 " + userPokemon.type;
          tdType.className = "cell-differ";
        }
        tr.appendChild(tdType);

        // 世代判定 (一致: 🟩 , ⬆ , ⬇)
        const tdGen = document.createElement('td');
        if (userPokemon.gen === currentAnswer.gen) {
          tdGen.textContent = "🟩 " + userPokemon.gen + "世";
          tdGen.className = "cell-match";
        } else if (userPokemon.gen < currentAnswer.gen) {
          tdGen.textContent = "⬆ " + userPokemon.gen + "世";
          tdGen.className = "cell-up";
        } else {
          tdGen.textContent = "⬇ " + userPokemon.gen + "世";
          tdGen.className = "cell-down";
        }
        tr.appendChild(tdGen);

        // 高さ判定
        const tdHeight = document.createElement('td');
        if (userPokemon.height === currentAnswer.height) {
          tdHeight.textContent = "🟩 " + userPokemon.height + "m";
          tdHeight.className = "cell-match";
        } else if (userPokemon.height < currentAnswer.height) {
          tdHeight.textContent = "⬆ " + userPokemon.height + "m";
          tdHeight.className = "cell-up";
        } else {
          tdHeight.textContent = "⬇ " + userPokemon.height + "m";
          tdHeight.className = "cell-down";
        }
        tr.appendChild(tdHeight);

        // 重さ判定
        const tdWeight = document.createElement('td');
        if (userPokemon.weight === currentAnswer.weight) {
          tdWeight.textContent = "🟩 " + userPokemon.weight + "kg";
          tdWeight.className = "cell-match";
        } else if (userPokemon.weight < currentAnswer.weight) {
          tdWeight.textContent = "⬆ " + userPokemon.weight + "kg";
          tdWeight.className = "cell-up";
        } else {
          tdWeight.textContent = "⬇ " + userPokemon.weight + "kg";
          tdWeight.className = "cell-down";
        }
        tr.appendChild(tdWeight);

        // 履歴の先頭に追加
        if (historyLog) historyLog.insertBefore(tr, historyLog.firstChild);

        // ドンピシャ正解（完全一致）した場合のトランザクション（早い者勝ち勝敗決定）
        if (userPokemon.name === currentAnswer.name) {
          roomRef.child('winner').transaction((currentWinner) => {
            if (currentWinner === "") {
              return role; // 自分が最初の勝者
            }
            return currentWinner; 
          }, (error, committed, snapshot) => {
            if (committed) {
              // 勝った側のスコアに10点を加算
              roomRef.child(`scores/${role}`).transaction((score) => (score || 0) + 10);
            }
          });
        }

        // 入力欄をクリア
        guessInput.value = "";
      };
    }
  }
});
