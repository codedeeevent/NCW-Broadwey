// ==========================================
// ตั้งค่าโหมดนักพัฒนา (Developer Mode)
// true  = ปิด LIFF, ใช้ข้อมูลจำลอง (สำหรับเทสหน้าเว็บใน Chrome/Browser ทั่วไป)
// false = เปิด LIFF ใช้งานจริง (ต้องเปิดใน LINE)
const IS_DEV_MODE = false; 
// ==========================================

const API_BASE_URL = "https://sheetevantdataapi.vercel.app/api";

// ==========================================
// 🎨 เพิ่ม CSS พิเศษสำหรับ SweetAlert2 ให้เข้าธีม
// ==========================================
const style = document.createElement('style');
style.innerHTML = `
    @keyframes swalHeartbeat {
        0%, 100% { transform: scale(1); }
        15%, 45% { transform: scale(1.2); }
        30% { transform: scale(1); }
    }
    .swal-heart-loader {
        font-size: 60px;
        color: #d63031;
        animation: swalHeartbeat 1.5s infinite;
        text-shadow: 0 0 15px rgba(214,48,49,0.5);
        margin: 15px 0;
        line-height: 1;
    }
    .swal-glass-popup {
        background: rgba(255, 255, 255, 0.9) !important;
        backdrop-filter: blur(10px) !important;
        -webkit-backdrop-filter: blur(10px) !important;
        border-radius: 24px !important;
        border: 1px solid rgba(255, 255, 255, 1) !important;
        box-shadow: 0 15px 35px rgba(138, 3, 3, 0.15) !important;
        font-family: 'Kanit', sans-serif !important;
    }
    .swal2-title {
        color: #5c0f0f !important;
    }
    .swal2-html-container {
        color: #8a7366 !important;
    }
`;
document.head.appendChild(style);

// 🎨 สร้าง Preset ล่วงหน้าสำหรับใช้ซ้ำ
const themeSwal = Swal.mixin({
    customClass: { popup: 'swal-glass-popup' },
    confirmButtonColor: '#d63031',
    backdrop: `rgba(0, 0, 0, 0.5)`
});


/**
 * ฟังก์ชันทำความสะอาดและจัดมาตรฐานข้อความ
 */
const normalizeString = (str) => str ? String(str).trim().replace(/\s+/g, ' ') : '';

// --- ฟังก์ชันสำหรับดึงข้อมูลนิทรรศการจาก API ---
async function fetchData() {
    try {
        const response = await fetch(`${API_BASE_URL}/exhibitions`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        populateExhibitions(data);
    } catch (error) {
        console.error("Error fetching exhibition data:", error);
        if (!IS_DEV_MODE) {
             themeSwal.fire({
                 icon: 'error',
                 iconColor: '#d63031',
                 title: 'ขัดข้อง',
                 text: 'ไม่สามารถโหลดข้อมูลนิทรรศการได้ กรุณาลองใหม่'
             });
        }
    }
}

function populateExhibitions(data) {
    const exhibitionSelect = document.getElementById('exhibition');
    exhibitionSelect.innerHTML = '<option value="" disabled selected>กรุณาเลือกนิทรรศการ</option>';
    for (const exhibitionName in data) {
        const opt = document.createElement('option');
        opt.value = exhibitionName;
        opt.textContent = exhibitionName;
        exhibitionSelect.appendChild(opt);
    }
    exhibitionSelect.addEventListener('change', () => {
        if (data[exhibitionSelect.value]) {
            populateDates(data[exhibitionSelect.value]);
            document.getElementById('visitTime').innerHTML = '<option value="" disabled selected>กรุณาเลือกรอบการเข้าชม</option>';
        }
    });
}

function populateDates(datesData) {
    const dateSelect = document.getElementById('visitDate');
    dateSelect.innerHTML = '<option value="" disabled selected>เลือกวันที่เข้าชม</option>';
    for (const dateKey in datesData) {
        const opt = document.createElement('option');
        opt.value = dateKey;
        opt.textContent = dateKey;
        dateSelect.appendChild(opt);
    }
    
    dateSelect.onchange = () => {
        if (datesData[dateSelect.value]) {
            populateTimes(datesData[dateSelect.value]);
        }
    };
}

function populateTimes(timeObjects) {
    const timeSelect = document.getElementById('visitTime');
    timeSelect.innerHTML = '<option value="" disabled selected>เลือกรอบการเข้าชม</option>';

    if (!timeObjects || timeObjects.length === 0) {
        return;
    }

    timeObjects.forEach(slot => {
        const opt = document.createElement('option');
        opt.value = slot.time;
        opt.textContent = slot.time;

        if (normalizeString(slot.status) === "เต็ม") {
            opt.disabled = true;
            opt.textContent += " (เต็มแล้ว)";
            opt.style.color = "#b33939"; // สีแดงหม่น
        }
        
        timeSelect.appendChild(opt);
    });
}

// เริ่มต้นดึงข้อมูลเมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener('DOMContentLoaded', fetchData);


// --- ฟังก์ชัน LIFF และการส่งฟอร์ม ---
function initializeLiff() {
    if (IS_DEV_MODE) {
        console.warn("⚠️ Running in Developer Mode: LIFF is skipped.");
        runDevMode();
        return;
    }

    liff.init({
        liffId: '2007559959-b1qmJP72' // ใส่ LIFF ID ของคุณ
    }).then(() => {
        if (liff.isLoggedIn()) {
            getUserProfile();
        } else {
            liff.login();
        }
    }).catch(err => {
        console.error('LIFF Initialization failed', err);
        themeSwal.fire({
            icon: 'error',
            iconColor: '#d63031',
            title: 'เชื่อมต่อล้มเหลว',
            text: 'ไม่สามารถเชื่อมต่อระบบ LINE ได้'
        });
    });
}

function runDevMode() {
    const mockProfile = {
        userId: "U_DEV_TEST_001",
        displayName: "Dev User (Test Mode)",
        pictureUrl: "https://cdn-icons-png.flaticon.com/512/149/149071.png"
    };

    document.getElementById("userid").value = mockProfile.userId;
    document.getElementById("displayname").value = mockProfile.displayName;
    document.getElementById("profileimage").value = mockProfile.pictureUrl;
    
    const profileImg = document.getElementById("profileImageDisplay");
    profileImg.src = mockProfile.pictureUrl;
    profileImg.style.display = "block"; 

    document.getElementById("displayName").textContent = mockProfile.displayName;
    document.querySelector('.container').style.display = 'block';

    console.log("Mock Data Loaded:", mockProfile);
}

function getUserProfile() {
    liff.getProfile().then(profile => {
        document.getElementById("userid").value = profile.userId;
        document.getElementById("displayname").value = profile.displayName;
        document.getElementById("profileimage").value = profile.pictureUrl;
        document.getElementById("profileImageDisplay").src = profile.pictureUrl;
        document.getElementById("displayName").textContent = profile.displayName;
        document.querySelector('.container').style.display = 'block';
        
        checkRegistration(profile.userId);
    }).catch(err => {
        console.error('Error getting profile', err);
    });
}

function checkRegistration(userId) {
    // 🎨 หน้า Loading ตอนเปิดเว็บครั้งแรก (ใช้หัวใจเต้นแทนวงกลมหมุนๆ)
    themeSwal.fire({
        title: 'กำลังตรวจสอบสถานะ...',
        html: '<div class="swal-heart-loader">❤</div><div style="font-size:0.9em;">รอสักครู่นะคะ/ครับ</div>',
        allowOutsideClick: false,
        showConfirmButton: false
    });
    
    fetch(`${API_BASE_URL}/users`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch user list');
            return response.json();
        })
        .then(userIds => {
            if (userIds.includes(userId)) {
                Swal.close();
                window.location.href = 'eticket.html';
            } else {
                Swal.close();
            }
        })
        .catch(error => {
            console.error('Error fetching userIds:', error);
            themeSwal.fire('ขัดข้อง', 'ไม่สามารถตรวจสอบสถานะได้', 'error');
        });
}

async function submitForm() {
    const form = document.getElementById('eventForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // 🎨 หน้า Loading ตอนกดปุ่มลงทะเบียน
    themeSwal.fire({
        title: 'กำลังบันทึกข้อมูล...',
        html: '<div class="swal-heart-loader">❤</div><div style="font-size:0.9em;">กำลังถักทอเส้นด้ายแดงของคุณ...</div>',
        allowOutsideClick: false,
        showConfirmButton: false
    });

    const formData = {
        timestamp: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
        fullName: document.getElementById("fullName").value,
        phoneNumber: document.getElementById("phoneNumber").value,
        userId: document.getElementById("userid").value,
        displayName: document.getElementById("displayname").value,
        profileImage: document.getElementById("profileimage").value,
        exhibition: document.getElementById("exhibition").value,
        visitDate: document.getElementById("visitDate").value,
        visitTime: document.getElementById("visitTime").value,
    };

    console.log("Submitting Data:", formData);

    try {
        const response = await fetch(`${API_BASE_URL}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            // 🎨 Alert ตอนลงทะเบียนสำเร็จ
            themeSwal.fire({
                title: 'ลงทะเบียนสำเร็จ!',
                text: 'แล้วพบกันที่นิทรรศการฮีลใจนะคะ/ครับ',
                icon: 'success',
                iconColor: '#d63031', // เปลี่ยนเครื่องหมายถูกเป็นสีแดง
                timer: 2500,
                showConfirmButton: false
            }).then(() => {
                window.location.href = 'eticket.html';
            });
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        // 🎨 Alert ตอนเกิดข้อผิดพลาด
        themeSwal.fire({
            title: 'เกิดข้อผิดพลาด',
            text: error.message,
            icon: 'error',
            iconColor: '#d63031'
        });
    }
}

window.onload = initializeLiff;
