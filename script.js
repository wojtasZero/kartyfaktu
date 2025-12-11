let questionsCompleted = 0, questionsCorrect = 0, currentQuestionIndex = 0;
let shuffledQuestions, uploadedQuestions;
const stats = document.getElementById('stats')
const audio = document.getElementById('audio')
const audioCorrect = new Audio('correct.mp3');
const audioWrong = new Audio('wrong.mp3');
const questionElement = document.getElementById("question");
const answersElement = document.getElementById("answers");
const nextButton = document.getElementById("next-btn");
const explanation = document.getElementById("explanation");
const nr = document.getElementById("nr");

window.addEventListener('beforeunload', function (e) {
    localStorage.setItem("audio", audio.checked);
});

function load() {
    audio.checked = localStorage.getItem("audio") === "true";
    const q = localStorage.getItem("questions");
    if (!(q === null)) {
        uploadedQuestions = parseQuestions(q);
        startQuiz();
    }
}

document.getElementById('file-input').addEventListener('change', function (e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        const text = e.target.result;
        localStorage.setItem("questions", text);
        uploadedQuestions = parseQuestions(text);
        startQuiz();
    };

    reader.readAsText(file);
});

function parseQuestions(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const questions = [];
    let currentQuestion = null;
    let processingQuestion = false;

    for (const line of lines) {
        const questionMatch = line.match(/^\d+\.\s*(.*)/);

        if (questionMatch) {
            if (currentQuestion) questions.push(currentQuestion);
            currentQuestion = {
                question: questionMatch[1].trim(),
                answers: [],
                explanation: ""
            };
            processingQuestion = true;
            continue;
        }

        const answerMatch = line.match(/^([a-z])[>)]\s*(.*)/i);
        if (answerMatch) {
            processingQuestion = false;
            const isCorrect = line[1] === '>';
            const answerText = answerMatch[2].replace(/,$/, '').trim();
            currentQuestion.answers.push({
                text: answerText,
                correct: isCorrect
            });
            continue;
        }

        if (currentQuestion && processingQuestion) {
            currentQuestion.question += '\n' + line;
        }
        else if (currentQuestion) {
            currentQuestion.explanation += line + '\n';
        }
    }

    if (currentQuestion) questions.push(currentQuestion);
    return questions;
}

nextButton.addEventListener("click", () => { nr.value++; changed(nr.value); }
);

function changed(value) {
    if (value && value > 0) {
        value--;
        currentQuestionIndex = value;
        setNextQuestion();
    }
}

function startQuiz(random = false) {
    const questions = uploadedQuestions.slice();
    shuffledQuestions = random ? questions.sort(() => Math.random() - 0.5) : questions;
    currentQuestionIndex = 0;
    questionsCompleted = 0;
    questionsCorrect = 0;
    nr.value = 1;
    updateStats()
    setNextQuestion();
}

function setNextQuestion() {
    updateStats();
    resetState();
    showQuestion(shuffledQuestions[currentQuestionIndex]);
}

function showQuestion(questionData) {
    if (questionData) {
        questionElement.textContent = questionData.question;
        nextButton.style.opacity = "1";
        questionData.answers.forEach(answer => {
            nextButton.style.opacity = "0";
            const button = document.createElement("button");
            button.textContent = answer.text;
            button.classList.add("answer-btn");
            if (answer.correct) {
                button.dataset.correct = answer.correct;
            }
            button.addEventListener("click", selectAnswer);
            answersElement.appendChild(button);
        });
        explanation.textContent = "";
    }
    else {
        questionElement.textContent = "🏁";
        nextButton.style.opacity = "0";
        explanation.textContent = "";
    }
}

function resetState() {
    clearStatusClass(document.body);
    nextButton.style.opacity = "0";
    while (answersElement.firstChild) {
        answersElement.removeChild(answersElement.firstChild);
    }
}

function selectAnswer(e) {
    explanation.textContent = shuffledQuestions[currentQuestionIndex].explanation;
    const selectedButton = e.target;
    selectedButton.classList.add("selected");
    const correct = selectedButton.dataset.correct;
    setStatusClass(selectedButton, correct);
    Array.from(answersElement.children).forEach(button => {
        setStatusClass(button, button.dataset.correct);
        button.disabled = true;
    });
    nextButton.style.opacity = "1";
    if (selectedButton.classList.contains('correct')) {
        questionsCorrect++;
        if (audio.checked) audioCorrect.play();
    } else if (audio.checked) { audioWrong.play(); }
    questionsCompleted++;
    updateStats();
}

function setStatusClass(element, correct) {
    clearStatusClass(element);
    if (correct) {
        element.classList.add("correct");
    } else {
        element.classList.add("wrong");
    }
}

function clearStatusClass(element) {
    element.classList.remove("correct");
    element.classList.remove("wrong");
}

function updateStats() {
    if (questionsCompleted < 1) { stats.textContent = ""; return; }
    stats.textContent = "Poprawność: " + questionsCorrect + " / " + questionsCompleted + " (" + Math.round(questionsCorrect / questionsCompleted * 100) + "%)\nZostało: " + (uploadedQuestions.length - currentQuestionIndex) + " / " + uploadedQuestions.length;
}
