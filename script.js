const API_KEY = "K88087715788957";

let pages = JSON.parse(localStorage.getItem("bookPages")) || {};
let currentFile = null;

// элементы
const cameraInput = document.getElementById("cameraInput");
const galleryInput = document.getElementById("galleryInput");
const preview = document.getElementById("preview");
const pageNumber = document.getElementById("pageNumber");

const scanButton = document.getElementById("scanButton");
const pagesList = document.getElementById("pagesList");
const status = document.getElementById("status");

const fromPage = document.getElementById("fromPage");
const toPage = document.getElementById("toPage");

const showText = document.getElementById("showText");
const downloadText = document.getElementById("downloadText");

const output = document.getElementById("output");

// загрузка фото
cameraInput.onchange = loadImage;
galleryInput.onchange = loadImage;

function loadImage(e){
    currentFile = e.target.files[0];
    preview.src = URL.createObjectURL(currentFile);
    preview.style.display = "block";
}

// сохранить
function save(){
    localStorage.setItem("bookPages", JSON.stringify(pages));
}

// обновить список
function render(){
    pagesList.innerHTML = "";

    const keys = Object.keys(pages).map(Number).sort((a,b)=>a-b);

    if(keys.length === 0){
        pagesList.innerHTML = "Пока нет страниц";
        return;
    }

    keys.forEach(p=>{
        const div = document.createElement("div");
        div.className = "pageItem";
        div.innerText = "Страница " + p;
        pagesList.appendChild(div);
    });
}

// OCR СКАН
scanButton.onclick = async () => {

    if(!currentFile){
        alert("Выбери фото");
        return;
    }

    status.innerText = "Сканирование...";

    let form = new FormData();
    form.append("apikey", API_KEY);
    form.append("language", "lav+eng");
    form.append("OCREngine", "2");
    form.append("file", currentFile);

    try {

        let res = await fetch("https://api.ocr.space/parse/image", {
            method: "POST",
            body: form
        });

        let data = await res.json();

        console.log("OCR RESPONSE:", data);

        if(data.IsErroredOnProcessing){
            throw new Error(data.ErrorMessage);
        }

        let text = data.ParsedResults?.[0]?.ParsedText || "";

        let page = Number(pageNumber.value);

        pages[page] = text;

        save();
        render();

        status.innerText = "Страница " + page + " сохранена";

        pageNumber.value = page + 1;

        currentFile = null;
        preview.style.display = "none";

    } catch (e) {

        console.log("ERROR:", e);
        status.innerText = "❌ Ошибка OCR (см. консоль)";

    }
};

// сброс
document.getElementById("resetBook").onclick = () => {
    pages = {};
    save();
    render();
    output.value = "";
};

// собрать текст
showText.onclick = () => {

    let from = Number(fromPage.value);
    let to = Number(toPage.value);

    let result = "";

    for(let i = from; i <= to; i++){
        if(pages[i]){
            result += "\n=== " + i + " ===\n" + pages[i];
        }
    }

    output.value = result || "нет страниц";
};

// скачать
downloadText.onclick = () => {

    let blob = new Blob([output.value], {type:"text/plain"});
    let a = document.createElement("a");

    a.href = URL.createObjectURL(blob);
    a.download = "book.txt";
    a.click();
};

render();