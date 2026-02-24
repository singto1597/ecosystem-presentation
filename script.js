let allLeaderLines = [];
let viewState = 0;
let parsedData = null; // เก็บข้อมูล JSON ไว้ใช้

const mapContainer = document.getElementById('desert-map');
const statusText = document.getElementById('status-text');
const toggleBtn = document.getElementById('toggle-btn');
const infoCard = document.getElementById('info-card');

// ฟังก์ชันดึงข้อมูลจากไฟล์ JSON
async function loadData() {
    try {
        const response = await fetch('data.json');
        parsedData = await response.json();
        
        createOrganisms();
        
        // รอแป๊บนึงให้เว็บบราวเซอร์วาดกล่องเสร็จก่อน ค่อยลากเส้น ไม่งั้นเส้นเบี้ยว
        setTimeout(() => {
            createLines();
        }, 100);

    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลดไฟล์ JSON:", error);
        alert("โหลดข้อมูลไม่สำเร็จ! เช็คให้แน่ใจว่าเปิดผ่าน Live Server (ถ้าเปิดไฟล์ HTML ตรงๆ จะติด CORS error)");
    }
}

// 1. สร้าง DOM (กล่องสิ่งมีชีวิต) จากข้อมูล
function createOrganisms() {
    parsedData.organisms.forEach(org => {
        const div = document.createElement('div');
        div.id = org.id;
        div.className = 'organism';
        div.innerHTML = org.image; // ใส่ Emoji หรือถ้านายมีรูปก็ใช้เป็น <img src="..."> ได้
        
        // กำหนดตำแหน่งจาก JSON
        div.style.top = org.top;
        div.style.left = org.left;

        // เมื่อคลิกที่สิ่งมีชีวิต ให้โชว์กล่องข้อมูล
        div.addEventListener('click', (e) => {
            e.stopPropagation(); // กันไม่ให้คลิกทะลุไปโดนพื้นหลัง
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

// ปิดกล่องข้อมูลเมื่อคลิกที่พื้นหลังว่างๆ
mapContainer.addEventListener('click', (e) => {
    if (e.target === mapContainer) {
        infoCard.style.display = 'none';
    }
});

// 3. สร้างเส้น LeaderLine เตรียมไว้ (แต่ซ่อนไว้ก่อน)
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

// 4. ควบคุมการแสดงผล (กดปุ่มแล้วโชว์เส้น)
function updateView() {
    const organismsDOM = document.querySelectorAll('.organism');
    
    // รีเซ็ตเส้นทั้งหมด และเอา highlight/dim ออก
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

        // ทำให้ตัวที่ไม่เกี่ยวจางลง
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

// Event ปุ่มกด
toggleBtn.addEventListener('click', () => {
    viewState++;
    if (viewState > parsedData.foodChains.length + 1) {
        viewState = 0;
    }
    allLeaderLines.forEach(line => line.setOptions({color: '#ffeb3b', size: 3}));
    updateView();
});

// เริ่มต้นรันโปรแกรม
loadData();