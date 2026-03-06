// ==========================================
// ตั้งค่าโหมดนักพัฒนา (Developer Mode)
// true  = ปิด LIFF, ใช้ข้อมูลจำลอง (สำหรับเทสหน้าเว็บ)
// false = เปิด LIFF ใช้งานจริง
const IS_DEV_MODE = false; 
// ==========================================

const API_BASE_URL = "https://sheetevantdataapi.vercel.app/api";

function initializeLiff() {
    // 1. เช็คโหมด Dev ก่อน
    if (IS_DEV_MODE) {
        console.warn("⚠️ Running in Developer Mode: Using Mock Ticket Data.");
        runDevMode(); // เรียกฟังก์ชันจำลองข้อมูล
        return;
    }

    // 2. ถ้าไม่ใช่ Dev Mode ให้รัน LIFF ตามปกติ
    Swal.fire({
        title: 'กำลังโหลด',
        text: 'กำลังสร้าง E-Ticket ของคุณ...',
        background: '#1a1a1a', // ปรับสี Alert ให้เข้าธีม
        color: '#fff',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

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
    // จำลอง User ID และข้อมูลบัตร
    const mockUserId = "U_DEV_TICKET_001";
    const mockData = {
        exhibition: "Lone Wolf: หมาป่าเดียวดาย",
        date: "06/03/2026", // ลองเปลี่ยนวันที่เพื่อเทส Expired ได้
        timeSlot: "รอบ (10:00-11:00)" // ลองเปลี่ยนเวลาได้
    };

    // จำลองการ delay เหมือนโหลด API
    setTimeout(() => {
        document.getElementById('exhibition-name').textContent = mockData.exhibition;
        document.getElementById('exhibition-date').textContent = `วันที่: ${mockData.date}`;
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
                generateQRCode(userId);
            } else {
                Swal.fire({
                    title: 'ไม่พบข้อมูล',
                    text: 'คุณยังไม่ได้ลงทะเบียน',
                    icon: 'warning',
                    background: '#1a1a1a',
                    color: '#fff',
                    confirmButtonColor: '#8a0303',
                    confirmButtonText: 'ตกลง'
                }).then(() => {
                    window.location.href = 'index.html';
                });
            }
        })
        .catch(error => {
            console.error('Error fetching userIds:', error);
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถตรวจสอบการลงทะเบียนได้',
                icon: 'error',
                background: '#1a1a1a',
                color: '#fff'
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
                document.getElementById('exhibition-date').textContent = `วันที่: ${formattedDate}`;
                document.getElementById('exhibition-time-slot').textContent = userData.timeSlot;
                
                checkIfExpired(userData.date, userData.timeSlot);
                
                Swal.close();
            } else {
                throw new Error('Invalid user data received.');
            }
        })
        .catch(error => {
            console.error('Error fetching exhibition details:', error);
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถดึงข้อมูลบัตรของคุณได้',
                icon: 'error',
                background: '#1a1a1a',
                color: '#fff'
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
            // เปลี่ยนเป็น flex เพื่อให้ตัวหนังสืออยู่กลาง
            overlay.style.display = 'flex'; 
        }

    } catch (error) {
        console.error("Error checking expiration:", error);
    }
}

window.onload = initializeLiff;