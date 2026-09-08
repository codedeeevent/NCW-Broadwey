// ==========================================
// ตั้งค่าโหมดนักพัฒนา (Developer Mode)
// true  = ปิด LIFF, ใช้ข้อมูลจำลอง (สำหรับเทสหน้าเว็บ)
// false = เปิด LIFF ใช้งานจริง
const IS_DEV_MODE = false; 
// ==========================================

const API_BASE_URL = "https://sheetevantdataapi.vercel.app/api";

// ==========================================
// 🎨 เพิ่ม CSS พิเศษสำหรับ SweetAlert2 ให้เข้าธีมด้ายแดง (เหมือนหน้า script.js)
// ==========================================
const style = document.createElement('style');
style.innerHTML = `
    @keyframes fateHeartbeat {
        0%, 100% { transform: scale(1); text-shadow: 0 0 10px rgba(214, 48, 49, 0.4); }
        50% { transform: scale(1.3); text-shadow: 0 0 25px rgba(214, 48, 49, 1); }
    }
    @keyframes weaveThread {
        0% { stroke-dashoffset: 150; opacity: 0; }
        20% { opacity: 1; }
        80% { opacity: 1; }
        100% { stroke-dashoffset: 0; opacity: 0.3; }
    }
    .fate-loader-wrapper {
        position: relative; width: 160px; height: 70px; margin: 20px auto 10px auto; display: flex; justify-content: space-between; align-items: center;
    }
    .fate-heart { font-size: 32px; color: #d63031; z-index: 2; animation: fateHeartbeat 1.5s infinite ease-in-out; }
    .fate-heart.right { animation-delay: 0.75s; }
    .fate-svg { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 120px; height: 60px; z-index: 1; overflow: visible; }
    .fate-path { fill: none; stroke: #d63031; stroke-width: 3; stroke-linecap: round; filter: drop-shadow(0 0 6px rgba(214, 48, 49, 0.8)); stroke-dasharray: 150; animation: weaveThread 2s infinite ease-in-out alternate; }
    
    .swal-glass-popup {
        background: rgba(255, 255, 255, 0.9) !important;
        backdrop-filter: blur(12px) !important;
        -webkit-backdrop-filter: blur(12px) !important;
        border-radius: 28px !important;
        border: 1px solid rgba(255, 255, 255, 1) !important;
        box-shadow: 0 15px 45px rgba(138, 3, 3, 0.15), inset 0 0 0 2px rgba(255,255,255,0.5) !important;
        font-family: 'Kanit', sans-serif !important;
    }
    .swal2-title { color: #5c0f0f !important; font-size: 1.4em !important; font-weight: 600 !important; }
    .swal2-html-container { color: #8a7366 !important; margin-top: 5px !important; }
`;
document.head.appendChild(style);

const redThreadLoaderHTML = `
    <div class="fate-loader-wrapper">
        <div class="fate-heart left">❤</div>
        <svg class="fate-svg" viewBox="0 0 120 60"><path class="fate-path" d="M 10 30 C 40 -10, 80 70, 110 30" /></svg>
        <div class="fate-heart right">❤</div>
    </div>
`;

// สร้าง Preset ล่วงหน้าสำหรับใช้ซ้ำ
const themeSwal = Swal.mixin({
    customClass: { popup: 'swal-glass-popup' },
    confirmButtonColor: '#d63031',
    backdrop: `rgba(0, 0, 0, 0.5)`
});

// ==========================================

function initializeLiff() {
    // 1. เช็คโหมด Dev ก่อน
    if (IS_DEV_MODE) {
        console.warn("⚠️ Running in Developer Mode: Using Mock Ticket Data.");
        runDevMode(); // เรียกฟังก์ชันจำลองข้อมูล
        return;
    }

    // 2. ถ้าไม่ใช่ Dev Mode ให้รัน LIFF ตามปกติ (ใช้ Loading ด้ายแดง)
    themeSwal.fire({
        title: 'กำลังตรวจสอบ',
        html: redThreadLoaderHTML + '<div style="font-size:0.95em;">กำลังดึงข้อมูล E-Ticket ของคุณ...</div>',
        allowOutsideClick: false,
        showConfirmButton: false
    });

    // ⚠️ ลืมเปลี่ยน liffId เป็นอันใหม่หรือเปล่าครับ? อันนี้อิงตามโค้ดของคุณนะ
    liff.init({
        liffId: '2007559959-5nxBRkdm' 
    }).then(() => {
        if (liff.isLoggedIn()) {
            liff.getProfile().then(profile => {
                const userId = profile.userId;
                checkRegistration(userId);
            }).catch(err => {
                console.error('Error getting profile', err);
                Swal.close();
                window.location.href = 'index.html';
            });
        } else {
            liff.login();
        }
    }).catch(err => {
        console.error('LIFF Initialization failed', err);
        Swal.close();
    });
}

// --- ฟังก์ชันจำลองข้อมูล (Dev Mode) ---
function runDevMode() {
    // อัปเดต Mock Data ให้เป็นธีมใหม่
    const mockUserId = "U_DEV_TICKET_001";
    const mockData = {
        exhibition: "ศรัทธาสุดท้าย นิทรรศการฮีลใจ",
        date: "28/09/2026", // ลองเปลี่ยนวันที่เพื่อเทส Expired ได้
        timeSlot: "รอบเช้า (09:00-12:00)" // ลองเปลี่ยนเวลาได้
    };

    // จำลองการ delay เหมือนโหลด API
    setTimeout(() => {
        document.getElementById('exhibition-name').textContent = mockData.exhibition;
        document.getElementById('exhibition-date').textContent = `${mockData.date}`;
        document.getElementById('exhibition-time-slot').textContent = mockData.timeSlot;
        
        generateQRCode(mockUserId);
        checkIfExpired(mockData.date, mockData.timeSlot);
    }, 1500); // รอ 1.5 วิ ให้ Animation บัตรเล่นนิดนึง
}

function checkRegistration(userId) {
    fetch(`${API_BASE_URL}/users`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch user list');
            return response.json();
        })
        .then(userIds => {
            if (userIds.includes(userId)) {
                fetchExhibitionDetails(userId);
            } else {
                themeSwal.fire({
                    title: 'ไม่พบข้อมูล',
                    text: 'คุณยังไม่ได้ลงทะเบียนเข้าชมนิทรรศการ',
                    icon: 'warning',
                    iconColor: '#d63031',
                    confirmButtonText: 'กลับไปลงทะเบียน'
                }).then(() => {
                    window.location.href = 'index.html';
                });
            }
        })
        .catch(error => {
            console.error('Error fetching userIds:', error);
            themeSwal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถตรวจสอบการลงทะเบียนได้',
                icon: 'error',
                iconColor: '#d63031'
            }).then(() => {
                window.location.href = 'index.html';
            });
        });
}

function fetchExhibitionDetails(userId) {
    fetch(`${API_BASE_URL}/user-details?userId=${userId}`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch user details');
            return response.json();
        })
        .then(data => {
            // เช็คว่า data เป็น Array หรือ Object (API บางตัวส่งกลับมาเป็น Array)
            const userData = Array.isArray(data) ? data[0] : data;

            if (userData && userData.exhibition && userData.date && userData.timeSlot) {
                const formattedDate = formatDate(userData.date);
                
                document.getElementById('exhibition-name').textContent = userData.exhibition;
                document.getElementById('exhibition-date').textContent = `${formattedDate}`;
                document.getElementById('exhibition-time-slot').textContent = userData.timeSlot;
                
                generateQRCode(userId);
                checkIfExpired(userData.date, userData.timeSlot);
                
                Swal.close();
            } else {
                throw new Error('Invalid user data received.');
            }
        })
        .catch(error => {
            console.error('Error fetching exhibition details:', error);
            themeSwal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถดึงข้อมูลบัตรของคุณได้',
                icon: 'error',
                iconColor: '#d63031'
            }).then(() => {
                window.location.href = 'index.html';
            });
        });
}

function generateQRCode(userId) {
    const qrCodeText = userId;

    if (!qrCodeText || qrCodeText.trim() === '') {
        console.error('Invalid user ID for QR code generation');
        return;
    }

    const qrCodeContainer = document.getElementById('qrcode');
    qrCodeContainer.innerHTML = '';
    
    new QRCode(qrCodeContainer, {
        text: qrCodeText,
        width: 180, // ปรับขนาดให้พอดีกับ Wrapper
        height: 180,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
}

function formatDate(dateString) {
    if (!dateString) return '';
    const parts = String(dateString).split('/');
    if (parts.length === 3) {
        return dateString;
    }
    try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (e) {
        return dateString;
    }
}

function checkIfExpired(dateString, timeSlotString) {
    try {
        // ดึงเวลาสิ้นสุดรอบจากข้อความ เช่น "รอบเช้า (09:00-12:00)" -> จะดึง "12:00"
        const endTimeMatch = timeSlotString.match(/(\d{2}:\d{2})(?=\)$)/);
        if (!endTimeMatch) {
            console.error("Could not parse end time:", timeSlotString);
            return;
        }
        const endTime = endTimeMatch[1]; 

        const dateParts = dateString.split('/');
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; 
        const year = parseInt(dateParts[2], 10);

        const timeParts = endTime.split(':');
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);

        const expiryDateTime = new Date(year, month, day, hours, minutes);
        const now = new Date();

        if (now > expiryDateTime) {
            const overlay = document.getElementById('expired-overlay');
            // เปลี่ยนเป็น flex เพื่อให้ตราประทับแสดงกลางจอ
            overlay.style.display = 'flex'; 
        }

    } catch (error) {
        console.error("Error checking expiration:", error);
    }
}

window.onload = initializeLiff;
