window.addEventListener('DOMContentLoaded', () => {

  const myCodeDisplay = document.getElementById('vs-my-code');
  const codeInput = document.getElementById('vs-code');
  const statusMsg = document.getElementById('status-msg');

  // --- ポケモンデータを格納するオブジェクト ---
  let pokemonDatabase = {};
  let pokemonNames = [];

  // 日本語タイプ名のマッピング辞書
  const typeTranslations = {
    normal: "ノーマル", fire: "ほのお", water: "みず", grass: "くさ", electric: "でんき",
    ice: "こおり", fighting: "かくとう", poison: "どく", ground: "じめん", flying: "ひこう",
    psychic: "エスパー", bug: "むし", rock: "いわ", ghost: "ゴースト", dragon: "ドラゴン",
    steel: "はがね", fairy: "フェアリー"
  };

  // --- PokeAPIから初代151匹のデータを一括取得する関数 ---
  async function loadPokemonData() {
    if (statusMsg) statusMsg.textContent = "ポケモンデータを読み込んでいます(151匹)...";
    
    try {
      // 1. 初代151匹の日本語名リストをまとめて取得
      const listResponse = await fetch('https://pokeapi.co/api/v2/pokemon-species/?limit=151');
      const listData = await listResponse.json();
      
      // 2. 各ポケモンの詳細データを並列で取得（高速化）
      const detailPromises = listData.results.map(async (p, index) => {
        const id = index + 1;
        
        // 詳細情報と種族情報の両方を取得
        const [pokeRes, speciesRes] = await Promise.all([
          fetch(`https://pokeapi.co/api/v2/pokemon/${id}`),
          fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`)
        ]);
        
        const pokeData = await pokeRes.json();
        const speciesData = await speciesRes.json();

        // 日本語名を探す
        const jaNameObj = speciesData.names.find(n => n.language.name === "ja-Hrkt");
        const jaName = jaNameObj ? jaNameObj.name : p.name;

        // タイプを日本語に変換 (複数タイプある場合はスラッシュ区切り)
        const typesJa = pokeData.types.map(t => typeTranslations[t.type.name] || t.type.name).join('/');

        // データベースに登録する形式に整形
        pokemonDatabase[jaName] = {
          name: jaName,
          type: typesJa,
          gen: 1, // 初代なので1固定
          height: pokeData.height / 10, // デシメートルをメートルに変換
          weight: pokeData.weight / 10  // ヘクトグラムをキログラムに変換
        };
      });

      await Promise.all(detailPromises);
      pokemonNames = Object.keys(pokemonDatabase);
      
      if (statusMsg) statusMsg.textContent = "準備完了！ルームを作成するか、参加してください。";
      console.log("PokeAPI 151匹の読み込みが完了しました", pokemonDatabase);

    } catch (error) {
      console.error("PokeAPIからのデータ取得に失敗しました:", error);
      if (statusMsg) statusMsg.textContent = "データの読み込みに失敗しました。再読み込みしてください。";
    }
  }

  // アプリ起動時にデータを自動ロード
  loadPokemonData();

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
      if (pokemonNames.length === 0) {
        alert("ポケモンのデータを読み込み中です。しばらくお待ちください。");
        return;
      }

      const generatedCode = String(Math.floor(1000 + Math.random() * 9000));
      if (myCodeDisplay) myCodeDisplay.textContent = generatedCode;
      if (statusMsg) statusMsg.textContent = "ルームを作成しました。対戦相手を待っています...";

      const db = getDatabase();
      if (db) {
        // ロードした151匹の中からランダムに正解を決定
        const randomName = pokemonNames[Math.floor(Math.random() * pokemonNames.length)];
        const answerPokemon = pokemonDatabase[randomName];

        const roomRef = db.ref('rooms/' + generatedCode);
        roomRef.set({
          status: 'waiting',
          scores: { host: 0, guest: 0 },
          answer: answerPokemon,
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
    const lobbyScreen = document.getElementById('lobby-screen');
    const quizScreen = document.getElementById('quiz-screen');
    if (lobbyScreen) lobbyScreen.classList.add('hidden');
    if (quizScreen) quizScreen.classList.remove('hidden');

    const db = getDatabase();
    if (!db) return;

    const roomRef = db.ref('rooms/' + roomCode);
    let currentAnswer = null;

    roomRef.on('value', (snapshot) => {
      const roomData = snapshot.val();
      if (!snapshot.exists() || !roomData) return;

      currentAnswer = roomData.answer;

      document.getElementById('host-score-display').textContent = `ホスト: ${roomData.scores.host}点`;
      document.getElementById('guest-score-display').textContent = `ゲスト: ${roomData.scores.guest}点`;

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

    const submitBtn = document.getElementById('guess-submit-btn');
    const guessInput = document.getElementById('pokemon-guess-input');
    const historyLog = document.getElementById('history-log');

    if (submitBtn && guessInput) {
      submitBtn.onclick = () => {
        const userInput = guessInput.value.trim();
        if (!userInput) return;

        // APIから構築した151匹のマスターデータに存在するかチェック
        if (!pokemonDatabase[userInput]) {
          alert("初代（図鑑番号1〜151）の正しいポケモン名をカタカナで入力してください。\n(例: フシギバナ, リザードン, カメックス)");
          return;
        }

        const userPokemon = pokemonDatabase[userInput];
        const tr = document.createElement('tr');

        // 名前
        const tdName = document.createElement('td');
        tdName.textContent = userPokemon.name;
        tr.appendChild(tdName);

        // タイプ判定
        const tdType = document.createElement('td');
        if (userPokemon.type === currentAnswer.type) {
          tdType.textContent = "🟩 " + userPokemon.type;
          tdType.className = "cell-match";
        } else {
          tdType.textContent = "🟥 " + userPokemon.type;
          tdType.className = "cell-differ";
        }
        tr.appendChild(tdType);

        // 世代判定（初代なので常に一致か、他世代拡張時のためのロジック）
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

        if (historyLog) historyLog.insertBefore(tr, historyLog.firstChild);

        // 完全一致（正解）時の勝利処理
        if (userPokemon.name === currentAnswer.name) {
          roomRef.child('winner').transaction((currentWinner) => {
            if (currentWinner === "") return role;
            return currentWinner;
          }, (error, committed, snapshot) => {
            if (committed) {
              roomRef.child(`scores/${role}`).transaction((score) => (score || 0) + 10);
            }
          });
        }

        guessInput.value = "";
      };
    }
  }
});
