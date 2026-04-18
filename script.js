const eduData = {
    '1.png': '💡 彩虹培养环象征多样菌群生态，在合成生物学里，“设计 + 培养”往往缺一不可。',
    '2.png': '💡 DNA 双螺旋是生命信息载体，A 配 T、C 配 G，就是遗传信息最经典的配对规则。',
    '3.png': '💡 剪刀与 DNA 代表基因编辑工具，像 CRISPR 这样的技术让精准改写生命蓝图成为可能。',
    '4.png': '💡 移液枪是实验室高频工具，微升级别的液体操作，决定了实验是否足够精准。',
    '5.png': '💡 生物计算让算法与实验协同工作，设计序列、预测结构、筛选方案都越来越智能。',
    '6.png': '💡 发光细胞常用于报告系统，通过荧光信号，研究者能更直观地观察生命过程。',
    '7.png': '💡 工程化蛋白与酶像可编排零件，能帮助我们搭建更稳定、更高效的生物系统。',
    '8.png': '💡 锥形瓶和培养液是“细胞工厂”的日常舞台，很多神奇产物都从这里开始生产。',
    '9.png': '💡 培养皿中的菌落像微观城市，不同颜色与形态，往往对应不同实验状态。',
    '10.png': '💡 iGEM 金牌是全球合成生物学竞赛中的亮眼荣誉，代表完整的设计、实验与展示能力。'
};

const CARD_SIZE = 84;
const SLOT_LIMIT = 7;
const TOTAL_LEVELS = 3;

function generateGrid(rows, cols, startX, startY, stepX, stepY) {
    const list = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            list.push({ x: startX + c * stepX, y: startY + r * stepY });
        }
    }
    return list;
}

const levelLayouts = [
    [
        ...generateGrid(3, 4, 125, 145, 110, 92),  // 12
        ...generateGrid(2, 3, 180, 190, 110, 92)   // 6
    ],
    [
        ...generateGrid(3, 5, 70, 110, 110, 92),   // 15
        ...generateGrid(3, 4, 125, 155, 110, 92),  // 12
        ...generateGrid(2, 3, 180, 200, 110, 92)   // 6
    ],
    [
        ...generateGrid(4, 6, 40, 30, 110, 92),    // 24
        ...generateGrid(3, 5, 95, 75, 110, 92),    // 15
        ...generateGrid(3, 4, 150, 52, 110, 92),   // 12
        ...generateGrid(2, 3, 205, 97, 110, 92),   // 6
        ...generateGrid(1, 3, 260, 142, 110, 92)   // 3
    ]
];

const baseImages = Object.keys(eduData);

const gameBoard = document.getElementById('game-board');
const slotArea = document.getElementById('slot-area');
const scoreDisplay = document.getElementById('score');
const toast = document.getElementById('toast');
const gameOverScreen = document.getElementById('game-over-screen');
const gameOverMsg = document.getElementById('game-over-msg');
const gameOverSubmsg = document.getElementById('game-over-submsg');
const primaryBtn = document.getElementById('primary-btn');
const restartBtn = document.getElementById('restart-btn');
const levelText = document.getElementById('level-text');
const stageDots = document.getElementById('stage-dots');

let currentScore = 0;
let currentLevel = 0;
let overlayAction = 'restart';

function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function buildStageDots() {
    stageDots.innerHTML = '';
    for (let i = 0; i < TOTAL_LEVELS; i++) {
        const dot = document.createElement('div');
        dot.className = 'stage-dot';
        if (i < currentLevel) {
            dot.classList.add('cleared');
        } else if (i === currentLevel) {
            dot.classList.add('active');
        }
        stageDots.appendChild(dot);
    }
}

function openOverlay(title, subtitle, primaryLabel, action) {
    gameOverMsg.innerHTML = title;
    gameOverSubmsg.innerHTML = subtitle;
    primaryBtn.textContent = primaryLabel;
    overlayAction = action;
    gameOverScreen.classList.remove('hidden');
}

function closeOverlay() {
    gameOverScreen.classList.add('hidden');
}

function updateHeader() {
    scoreDisplay.textContent = currentScore;
    levelText.textContent = `${currentLevel + 1} / ${TOTAL_LEVELS}`;
    buildStageDots();
}

function createDeckForLevel(layoutLength) {
    const groupsCount = Math.floor(layoutLength / 3);
    const pool = [];
    const imageCycle = shuffle(baseImages);

    for (let i = 0; i < groupsCount; i++) {
        const imageName = imageCycle[i % imageCycle.length];
        pool.push(imageName, imageName, imageName);
    }

    return shuffle(pool);
}

function createCard(imageName, pos, index) {
    const card = document.createElement('div');
    card.className = 'card entering';
    card.dataset.name = imageName;
    card.style.left = pos.x + 'px';
    card.style.top = pos.y + 'px';
    card.style.zIndex = String(index + 1);

    const img = document.createElement('img');
    img.src = 'assets/' + imageName;
    img.alt = imageName;
    card.appendChild(img);

    card.addEventListener('click', () => {
        if (card.parentNode !== gameBoard) return;
        if (card.classList.contains('blocked')) return;
        if (slotArea.children.length >= SLOT_LIMIT) return;

        const slotCard = document.createElement('div');
        slotCard.className = 'card to-slot';
        slotCard.dataset.name = imageName;

        const slotImg = document.createElement('img');
        slotImg.src = 'assets/' + imageName;
        slotImg.alt = imageName;
        slotCard.appendChild(slotImg);

        card.remove();
        slotArea.appendChild(slotCard);

        const matchedNow = checkMatch();
        updateCardsStatus();

        if (!matchedNow) {
            checkLevelState();
        }
    });

    return card;
}

function initLevel(levelIndex) {
    currentLevel = levelIndex;
    const layout = levelLayouts[currentLevel];

    gameBoard.innerHTML = '';
    slotArea.innerHTML = '';
    closeOverlay();
    updateHeader();

    const imageNames = createDeckForLevel(layout.length);

    layout.forEach((pos, index) => {
        const card = createCard(imageNames[index], pos, index);
        gameBoard.appendChild(card);
    });

    updateCardsStatus();
    showToast(`✨ 第 ${currentLevel + 1} 关开始！准备好进行像素实验了吗？`, '#4d4566');
}

function restartRun() {
    currentScore = 0;
    initLevel(0);
}

function updateCardsStatus() {
    const boardCards = Array.from(gameBoard.children);

    boardCards.forEach((cardA) => {
        let isBlocked = false;
        const rectA = {
            left: parseFloat(cardA.style.left),
            top: parseFloat(cardA.style.top),
            right: parseFloat(cardA.style.left) + CARD_SIZE,
            bottom: parseFloat(cardA.style.top) + CARD_SIZE,
            z: parseInt(cardA.style.zIndex, 10)
        };

        boardCards.forEach((cardB) => {
            if (cardA === cardB) return;

            const rectB = {
                left: parseFloat(cardB.style.left),
                top: parseFloat(cardB.style.top),
                right: parseFloat(cardB.style.left) + CARD_SIZE,
                bottom: parseFloat(cardB.style.top) + CARD_SIZE,
                z: parseInt(cardB.style.zIndex, 10)
            };

            const overlap = !(
                rectA.right <= rectB.left ||
                rectA.left >= rectB.right ||
                rectA.bottom <= rectB.top ||
                rectA.top >= rectB.bottom
            );

            if (rectB.z > rectA.z && overlap) {
                isBlocked = true;
            }
        });

        cardA.classList.toggle('blocked', isBlocked);
    });
}

function removeTriple(name) {
    const cardsInSlot = Array.from(slotArea.children).filter(card => card.dataset.name === name).slice(0, 3);

    cardsInSlot.forEach((card) => {
        card.classList.add('matching');
    });

    setTimeout(() => {
        cardsInSlot.forEach((card) => card.remove());
        updateCardsStatus();
        checkLevelState();
    }, 180);

    currentScore += 1;
    updateHeader();
    showToast(eduData[name], '#2f786c');
}

function hasPendingMatch() {
    const counts = {};

    Array.from(slotArea.children).forEach((card) => {
        const name = card.dataset.name;
        counts[name] = (counts[name] || 0) + 1;
    });

    return Object.values(counts).some((count) => count >= 3);
}

function checkMatch() {
    const cardsInSlot = Array.from(slotArea.children);
    const counts = {};
    let matchedNow = false;

    cardsInSlot.forEach((card) => {
        const name = card.dataset.name;
        counts[name] = (counts[name] || 0) + 1;
    });

    Object.keys(counts).forEach((name) => {
        if (counts[name] >= 3) {
            matchedNow = true;
            removeTriple(name);
        }
    });

    return matchedNow;
}

function checkLevelState() {
    if (gameBoard.children.length === 0 && slotArea.children.length === 0) {
        if (currentLevel < TOTAL_LEVELS - 1) {
            openOverlay(
                `🎉 第 ${currentLevel + 1} 关完成`,
                '像素实验进展顺利！下一关的卡牌层级会更多、路线也更复杂。',
                '进入下一关',
                'next'
            );
        } else {
            openOverlay(
                '恭喜通关',
                '你已顺利完成全部 3 个像素关卡，合成生物学收藏图鉴全部点亮！',
                '再玩一次',
                'restart'
            );
        }
        return;
    }

    if (hasPendingMatch()) {
        return;
    }

    if (slotArea.children.length >= SLOT_LIMIT) {
        openOverlay(
            '⚠️ 槽位满了',
            '当前组合暂时卡住了，重新整理策略后再挑战一次吧。',
            '重试本关',
            'retry'
        );
    }
}

function showToast(message, bgColor) {
    toast.textContent = message;
    toast.style.backgroundColor = bgColor;
    toast.classList.remove('hidden');

    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
        toast.classList.add('hidden');
    }, 2100);
}

primaryBtn.addEventListener('click', () => {
    if (overlayAction === 'next') {
        initLevel(currentLevel + 1);
    } else if (overlayAction === 'retry') {
        initLevel(currentLevel);
    } else {
        restartRun();
    }
});

restartBtn.addEventListener('click', () => {
    restartRun();
});

restartRun();
