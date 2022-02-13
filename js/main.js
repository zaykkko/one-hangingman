(function () {
    //Retrievers
    function retrieveSavedWords() {
        var words = localStorage.getItem("saved_words");

        return words ? words.split(",") : [];
    }
    //Creators
    function createTableEntry(word) {
        var wordContainer = document.createElement("div"),
            wordText = document.createElement("h3"),
            dltBtn = document.createElement("button");

        wordContainer.classList.add("tableWord");
        wordContainer.setAttribute("data-word", word.toLowerCase());

        wordText.textContent = word;

        dltBtn.classList.add("wordDltBtn");
        dltBtn.textContent = "eliminar";

        wordContainer.appendChild(wordText);
        wordContainer.appendChild(dltBtn);

        wordsTable.append(wordContainer);
    }
    function createCanvasGame() {
        var canvas = document.createElement("canvas");
        canvas.setAttribute("width", CANVAS_WIDTH);
        canvas.setAttribute("height", CANVAS_HEIGHT);

        gameContainer.prepend(canvas);

        var ctx = (canvasCtx = canvas.getContext("2d")),
            {height, width} = canvas;

        //Ahorcadera
        ctx.beginPath();
        ctx.lineWidth = 5;
        ctx.strokeStyle = "black";
        ctx.moveTo(10, height - 50);
        ctx.lineTo(width - width / 2, height - 50);
        ctx.moveTo(10, height - 50);
        ctx.moveTo((width - width / 2) / 2, height - 50);
        ctx.lineTo((width - width / 2) / 2, 20);
        ctx.lineTo(width / 4 + width / 2, 20);
        ctx.lineTo(width / 4 + width / 2, height / 6);
        ctx.stroke();
    }
    function createSecretWordBorders() {
        pickedWord.forEach(() => {
            var h2 = document.createElement("h2");

            secretWordContainer.appendChild(h2);
        });
    }
    function createMissedWord(letter) {
        var h2 = document.createElement("h2");
        h2.textContent = letter;

        missedLettersContainer.appendChild(h2);
    }
    //Renders
    function renderWordsTable() {
        if (savedWords.length) {
            wordsContainer.classList.remove("emptyMsgVisible");

            savedWords.forEach((word) => createTableEntry(word));
        } else {
            wordsContainer.classList.add("emptyMsgVisible");
        }
        wordsContainer.onclick = onWordDeleteBtnClicked;
        renderWordsLimit();
    }
    function renderWordsLimit() {
        if (savedWords.length) {
            wordsContainer.classList.remove("emptyMsgVisible");
        } else {
            wordsContainer.classList.add("emptyMsgVisible");
        }

        tableLength.textContent = savedWords.length;
        tableMaxLength.textContent = TABLE_MAX_WORDS;

        if (savedWords.length >= TABLE_MAX_WORDS) {
            formAddWordBtn.disabled = true;
        } else {
            formAddWordBtn.disabled = false;
        }

        if (!savedWords.length) {
            startGameBtn.disabled = true;
        } else {
            startGameBtn.disabled = false;
        }
    }
    function renderCanvasTimer(timeDiff) {
        var mins = Math.floor(timeDiff / 60) % 60,
            secs = Math.floor(timeDiff % 60);

        canvasCtx.clearRect(
            CANVAS_WIDTH / 2 - 40,
            CANVAS_HEIGHT - 40,
            100,
            100
        );
        canvasCtx.font = 'bold 1.5em "Nunito Sans", sans-serif';
        canvasCtx.fillStyle = "#000";
        canvasCtx.fillText(
            `${mins < 10 ? "0" + mins : mins}:${secs < 10 ? "0" + secs : secs}`,
            CANVAS_WIDTH / 2 - 35,
            CANVAS_HEIGHT - 10
        );
    }
    function updateTimer() {
        var timeDiff = (expirationTimer - Date.now()) / 1000;

        if (timeDiff >= 0) {
            if (previousTime != timeDiff) {
                previousTime = timeDiff;

                renderCanvasTimer(timeDiff);
            }

            timerRequestId = requestAnimationFrame(updateTimer);
        } else {
            renderGameFinished(false);

            renderCanvasTimer(0, 0);
        }
    }
    function renderSecretWordMatches(letter) {
        var validResult = false;

        pickedWord.forEach((val, index) => {
            if (
                !letter ||
                (val
                    .replace(/á/i, "a")
                    .replace(/é/i, "e")
                    .replace(/í/i, "i")
                    .replace(/ó/i, "o")
                    .replace(/ú/i, "u")
                    .replace(/ü/i, "u") == letter &&
                    !visibleLetters[index])
            ) {
                validResult = true;

                visibleLetters[index] = 1;
                secretWordContainer.childNodes[index].textContent = val;
            }
        });

        return validResult;
    }
    function renderHangingManNextFrame(skipFrame) {
        for (
            var i = 0;
            i < skipFrame && currentHangingManFrame < HANGING_MAN_LAST_FRAME;
            i++
        ) {
            currentHangingManFrame++;

            canvasCtx.beginPath();
            canvasCtx.fillStyle = "#000";
            HANGING_MAN_FRAMES[currentHangingManFrame](
                canvasCtx,
                CANVAS_WIDTH,
                CANVAS_HEIGHT
            );
            canvasCtx.stroke();
        }
    }
    function renderGameFinished(won) {
        riskingForm.style.cssText = "display: none!important";

        cancelAnimationFrame(timerRequestId);

        renderSecretWordMatches();

        mainScreenBtn.onclick = onMainScreenBtnClicked;

        if (won) {
            finishMsg.classList.add("gameWon");
        } else {
            finishMsg.classList.add("gameLost");
        }
    }
    //Handlers
    function wordFormOnSubmit(event) {
        event.preventDefault();

        var val = formWordInput.value
            .replace(/[^áéíóúüa-z]/gi, "")
            .toLowerCase();

        if (val && savedWords.length <= TABLE_MAX_WORDS) {
            if (!savedWords.length || !savedWords.some((word) => word == val)) {
                savedWords.push(val);
                localStorage.setItem("saved_words", savedWords.join(","));

                createTableEntry(val);
                renderWordsLimit();

                wordsContainer.classList.remove("emptyMsgVisible");
                gameInfo.style.cssText = "";
            } else {
                gameInfo.style.cssText =
                    "color: var(--body-text-error-color);font-weight: bold;text-decoration:underline;";
            }
        }

        formWordInput.value = "";
    }
    function onWordDeleteBtnClicked(event) {
        var target = event.target.parentElement,
            attribute = target.getAttribute("data-word");

        if (attribute) {
            savedWords = savedWords.filter((word) => word != attribute);
            localStorage.setItem("saved_words", savedWords.join(","));

            target.remove();
            renderWordsLimit();
        }
    }
    function onStartBtnClick() {
        gameEnded = false;

        missedLetters = [];

        currentHangingManFrame = -1;

        secretWordContainer.textContent = "";
        missedLettersContainer.textContent = "";

        finishMsg.classList.remove("gameWon");
        finishMsg.classList.remove("gameLost");

        var canvas = gameContainer.querySelector("canvas");

        if (canvas) {
            canvas.remove();
        }

        gameMainScreen.style.cssText = "display: none!important";
        gameContainer.style.cssText = "display: flex!important";
        riskingForm.style.cssText = "display: flex!important";

        pickedWord =
            savedWords[Math.floor(Math.random() * savedWords.length)].split("");

        visibleLetters = Array(pickedWord.length).fill(0);

        previousTime = -1;

        expirationTimer = Date.now() + 5 * (1000 * 60);

        isRiskingCheck.onchange = onRiskCheckboxChange;
        riskingForm.onsubmit = onRiskFormSubmit;

        timerRequestId = requestAnimationFrame(updateTimer);

        createCanvasGame();
        createSecretWordBorders();
    }
    function onRiskCheckboxChange(event) {
        var isRisking = event.target.checked;

        riskingInput.setAttribute(
            "maxlength",
            isRisking ? pickedWord.length : 1
        );
        riskingInput.setAttribute(
            "placeholder",
            isRisking ? "Ingresa una palabra" : "Ingresa una letra"
        );

        isUserRisking = isRisking;
    }
    function onRiskFormSubmit(event) {
        event.preventDefault();

        var wordOrLetter = riskingInput.value
            .replace(/[^áéíóúüa-z]/gi, "")
            .toLowerCase()
            .replace(/á/i, "a")
            .replace(/é/i, "e")
            .replace(/í/i, "i")
            .replace(/ó/i, "o")
            .replace(/ú/i, "u")
            .replace(/ü/i, "u");

        riskingInput.value = "";

        if (wordOrLetter && !gameEnded) {
            if (!isUserRisking) {
                if (
                    !missedLetters.some((letters) => letters == wordOrLetter) &&
                    !renderSecretWordMatches(wordOrLetter)
                ) {
                    missedLetters.push(wordOrLetter);

                    createMissedWord(wordOrLetter);

                    renderHangingManNextFrame(1);
                }
            } else {
                if (
                    pickedWord
                        .join("")
                        .replace(/á/i, "a")
                        .replace(/é/i, "e")
                        .replace(/í/i, "i")
                        .replace(/ó/i, "o")
                        .replace(/ú/i, "u")
                        .replace(/ü/i, "u") !== wordOrLetter
                ) {
                    renderHangingManNextFrame(2);
                } else {
                    renderGameFinished(true);
                }
            }

            if (currentHangingManFrame == HANGING_MAN_LAST_FRAME) {
                renderGameFinished(false);
            }
        }
    }
    function onMainScreenBtnClicked() {
        gameMainScreen.style.cssText = "display: flex!important";
        gameContainer.style.cssText = "display: none!important";
        riskingForm.style.cssText = "display: none!important";
    }

    var CANVAS_HEIGHT = 500,
        CANVAS_WIDTH = 310,
        HANGING_MAN_FRAMES = [
            (ctx, width, height) =>
                ctx.arc(
                    width / 4 + width / 2,
                    height / 6 + 50,
                    50,
                    0,
                    2 * Math.PI
                ),
            (ctx, width, height) =>
                ctx.moveTo(width / 4 + width / 2, height / 6 + 100) &
                ctx.lineTo(width / 4 + width / 2, height / 2 + height / 6),
            (ctx, width, height) =>
                ctx.moveTo(width / 4 + width / 2, height / 2) &
                ctx.lineTo(width / 4 + width / 2 + 50, height / 2),
            (ctx, width, height) =>
                ctx.moveTo(width / 4 + width / 2, height / 2) &
                ctx.lineTo(width / 4 + width / 2 - 50, height / 2),
            (ctx, width, height) =>
                ctx.moveTo(width / 4 + width / 2, height / 2 + height / 6) &
                ctx.lineTo(
                    width / 4 + width / 2 - 50,
                    height / 2 + height / 6 + 60
                ),
            (ctx, width, height) =>
                ctx.moveTo(width / 4 + width / 2, height / 2 + height / 6) &
                ctx.lineTo(
                    width / 4 + width / 2 + 50,
                    height / 2 + height / 6 + 60
                )
        ],
        TABLE_MAX_WORDS = 30,
        HANGING_MAN_LAST_FRAME = HANGING_MAN_FRAMES.length - 1,
        canvasCtx,
        gameEnded = false,
        isUserRisking = false,
        previousTime = -1,
        timerRequestId,
        expirationTimer,
        pickedWord,
        visibleLetters,
        missedLetters = [],
        currentHangingManFrame = -1,
        savedWords = retrieveSavedWords();

    var gameInfo = document.getElementById("game-info-repeat"),
        tableLength = document.getElementById("table-length"),
        tableMaxLength = document.getElementById("table-max-length"),
        wordsContainer = document.getElementById("words-history"),
        wordsTable = document.getElementById("words-table"),
        formWordInput = document.querySelector("[name='word_input']"),
        formAddWordBtn = document.getElementById("word-submit-btn"),
        formElement = document.getElementById("word-form"),
        gameMainScreen = document.getElementById("main-screen"),
        startGameBtn = document.getElementById("start-game-btn"),
        secretWordContainer = document.getElementById("secret-word"),
        missedLettersContainer = document.getElementById("missed-letters"),
        isRiskingCheck = document.getElementById("risk-check"),
        riskingInput = document.querySelector("[name='word_or_letter']"),
        riskingForm = document.getElementById("letter-form"),
        finishMsg = document.getElementById("finished-msg"),
        mainScreenBtn = document.getElementById("finished-main"),
        gameContainer = document.getElementById("game-container");

    //First renders
    renderWordsTable();

    formElement.onsubmit = wordFormOnSubmit;
    startGameBtn.onclick = onStartBtnClick;
})();
