let deck = null;
let currentGender = "female";
let currentLevel = "all";
let currentPositionCategory = null;

const deckInfo = document.getElementById("deckInfo");
const card = document.getElementById("card");
const drawBtn = document.getElementById("drawBtn");
const fileInput = document.getElementById("fileInput");
const loadDefaultBtn = document.getElementById("loadDefaultBtn");
const positionTabs = document.getElementById("positionTabs");
const positionResult = document.getElementById("positionResult");
const drawPositionBtn = document.getElementById("drawPositionBtn");

const levelLabel = {
  light: "轻度",
  stimulating: "升温",
  intense: "强烈",
  all: "全部"
};

function validateDeck(data) {
  return data && Array.isArray(data.maleCards) && Array.isArray(data.femaleCards);
}

function saveDeck(data) {
  localStorage.setItem("saturnisle_deck", JSON.stringify(data));
}

function loadSavedDeck() {
  const raw = localStorage.getItem("saturnisle_deck");
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    return validateDeck(data) ? data : null;
  } catch {
    return null;
  }
}

function setDeck(data, source = "已导入") {
  if (!validateDeck(data)) {
    alert("这个 JSON 格式不对，需要包含 maleCards 和 femaleCards。");
    return;
  }
  deck = data;
  saveDeck(data);
  const maleCount = data.maleCards.length;
  const femaleCount = data.femaleCards.length;
  deckInfo.textContent = `${source}：男生版 ${maleCount} 张，女生版 ${femaleCount} 张。`;
  renderPositionTabs();
  renderPlaceholder();
}

function getCurrentCards() {
  if (!deck) return [];
  const list = currentGender === "male" ? deck.maleCards : deck.femaleCards;
  if (currentLevel === "all") return list;
  return list.filter(card => card.level === currentLevel);
}

function drawCard() {
  const cards = getCurrentCards();
  if (!cards.length) {
    renderCard("没有可抽的牌", "请换一个筛选条件或导入牌组。", "Saturnisle Cards");
    return;
  }
  const picked = cards[Math.floor(Math.random() * cards.length)];
  const genderText = currentGender === "male" ? "男生版" : "女生版";
  renderCard(`${genderText} · ${levelLabel[picked.level] || picked.level}`, picked.content, "土星小岛");
}

function renderCard(type, content, footer) {
  card.innerHTML = `
    <p class="cardType">${escapeHtml(type)}</p>
    <h2>${escapeHtml(content)}</h2>
    <p class="cardFooter">${escapeHtml(footer)}</p>
  `;
}

function renderPlaceholder() {
  renderCard("Saturnisle", "点一下「抽一张」。", "灯亮着，牌就开始。");
}

function renderPositionTabs() {
  positionTabs.innerHTML = "";
  if (!deck || !deck.positionList || !deck.positionList.categories) {
    positionResult.textContent = "这个牌组没有动作列表。";
    return;
  }
  const cats = deck.positionList.categories;
  const keys = Object.keys(cats);
  currentPositionCategory = currentPositionCategory || keys[0];

  keys.forEach(key => {
    const btn = document.createElement("button");
    btn.textContent = cats[key];
    btn.className = key === currentPositionCategory ? "active" : "";
    btn.addEventListener("click", () => {
      currentPositionCategory = key;
      renderPositionTabs();
      positionResult.textContent = `已选择：${cats[key]}。点「抽一个动作」。`;
    });
    positionTabs.appendChild(btn);
  });
}

function drawPosition() {
  if (!deck || !deck.positionList || !currentPositionCategory) {
    positionResult.textContent = "先导入牌组。";
    return;
  }
  const list = deck.positionList[currentPositionCategory] || [];
  if (!list.length) {
    positionResult.textContent = "这个分类里还没有动作。";
    return;
  }
  const picked = list[Math.floor(Math.random() * list.length)];
  positionResult.textContent = picked;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.querySelectorAll("[data-gender]").forEach(btn => {
  btn.addEventListener("click", () => {
    currentGender = btn.dataset.gender;
    document.querySelectorAll("[data-gender]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

document.querySelectorAll("[data-level]").forEach(btn => {
  btn.addEventListener("click", () => {
    currentLevel = btn.dataset.level;
    document.querySelectorAll("[data-level]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

drawBtn.addEventListener("click", drawCard);
drawPositionBtn.addEventListener("click", drawPosition);

fileInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    setDeck(data, `已导入 ${file.name}`);
  } catch (error) {
    alert("读取失败：请确认是合法 JSON 文件。");
  } finally {
    fileInput.value = "";
  }
});

loadDefaultBtn.addEventListener("click", async () => {
  try {
    const response = await fetch("decks/saturnisle_desire_soft.json");
    const data = await response.json();
    setDeck(data, "已载入内置牌组");
  } catch {
    alert("载入内置牌组失败。如果你直接从手机文件打开，部分浏览器可能不允许读取本地 decks 文件；可以使用「导入 JSON」。");
  }
});

const saved = loadSavedDeck();
if (saved) {
  setDeck(saved, "已恢复上次牌组");
} else {
  deckInfo.textContent = "还没有导入数据。可以先点「导入 JSON」，或在网页托管后点「载入内置牌组」。";
}
