let allLeaderLines = [];
let viewState = 0;
let parsedData = null; 

const mapContainer = document.getElementById('desert-map');
const statusText = document.getElementById('status-text');
const toggleBtn = document.getElementById('toggle-btn');
const infoCard = document.getElementById('info-card');

// ฟังก์ชันดึงข้อมูลจากไฟล์ JSON
async function loadData() {
    try {
        const response = await fetch('data.json');
        const rawData = await response.json();
        
        // แก้จุดที่ 1: ดึงก้อน ecosystem ออกมาก่อน
        parsedData = rawData.ecosystem; 
        
        createOrganisms();
        
        setTimeout(() => {
            createLines();
        }, 100);

    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลดไฟล์ JSON:", error);
        alert("โหลดข้อมูล JSON พัง! ลองเปิด Console (F12) ดูว่า Error อะไร");
    }
}

// 1. สร้าง DOM จากข้อมูล
function createOrganisms() {
    // แก้จุดที่ 2: เปลี่ยนจาก organisms เป็น nodes ตามไฟล์ JSON
    parsedData.nodes.forEach(org => {
        const div = document.createElement('div');
        div.id = org.id;
        div.className = 'organism';
        
        // ถ้านายอยากใส่ Emoji ชั่วคราว ให้ใส่ใน JSON ว่า "emoji": "🦅" 
        // หรือถ้าจะเอารูปมาใส่เป็น CSS Background ให้ลบบรรทัดนี้ทิ้งไปเลย
        div.innerHTML = org.emoji || ''; 
        
        // แก้จุดที่ 3: ดึงตำแหน่งจาก org.position
        div.style.top = org.position.top;
        div.style.left = org.position.left;

        div.addEventListener('click', (e) => {
            e.stopPropagation(); 
            showInfo(org);
        });

        mapContainer.appendChild(div);
    });
}

// 2. แสดงข้อมูลลงใน Card
function showInfo(org) {
    document.getElementById('card-name').textContent = org.name;
    document.getElementById('card-role').textContent = org.role;
    document.getElementById('card-desc').textContent = org.desc;
    
    const typeElement = document.getElementById('card-type');
    typeElement.textContent = org.type;
    typeElement.className = 'tag ' + org.type.toLowerCase();

    infoCard.style.display = 'block';
}

mapContainer.addEventListener('click', (e) => {
    if (e.target === mapContainer) {
        infoCard.style.display = 'none';
    }
});

// 3. สร้างเส้น LeaderLine
function createLines() {
    parsedData.webConnections.forEach(conn => {
        const elFrom = document.getElementById(conn.from);
        const elTo = document.getElementById(conn.to);

        if (elFrom && elTo) {
            const line = new LeaderLine(elFrom, elTo, { 
                color: '#ffeb3b', size: 3, path: 'fluid', 
                startPlug: 'disc', endPlug: 'arrow3', hide: true 
            });
            line.fromId = conn.from;
            line.toId = conn.to;
            allLeaderLines.push(line);
        }
    });
}

// 4. ควบคุมการแสดงผล
function updateView() {
    const organismsDOM = document.querySelectorAll('.organism');
    
    allLeaderLines.forEach(line => line.hide('draw'));
    organismsDOM.forEach(org => org.classList.remove('highlighted', 'dimmed'));

    if (viewState === 0) {
        statusText.textContent = "ซ่อนสายใยอาหาร";
    } else if (viewState === 1) {
        statusText.textContent = "แสดงสายใยอาหารทั้งหมด (Food Web)";
        allLeaderLines.forEach(line => line.show('draw'));
    } else {
        const chainIndex = viewState - 2; 
        const currentChainIDs = parsedData.foodChains[chainIndex];
        statusText.textContent = `กำลังไฮไลท์ห่วงโซ่ที่ ${chainIndex + 1}`;

        organismsDOM.forEach(org => {
            if (!currentChainIDs.includes(org.id)) {
                org.classList.add('dimmed');
            }
        });

        for (let i = 0; i < currentChainIDs.length; i++) {
            const currentId = currentChainIDs[i];
            const nextId = currentChainIDs[i + 1];

            document.getElementById(currentId).classList.add('highlighted');

            if (nextId) {
                const lineToShow = allLeaderLines.find(line => line.fromId === currentId && line.toId === nextId);
                if (lineToShow) {
                    lineToShow.setOptions({color: '#ff5722', size: 5});
                    lineToShow.show('draw');
                }
            }
        }
    }
}

toggleBtn.addEventListener('click', () => {
    viewState++;
    if (viewState > parsedData.foodChains.length + 1) {
        viewState = 0;
    }
    allLeaderLines.forEach(line => line.setOptions({color: '#ffeb3b', size: 3}));
    updateView();
});

loadData();