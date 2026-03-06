// ==========================================
// ตั้งค่าโหมดนักพัฒนา (Developer Mode)
// true  = ปิด LIFF, ใช้ข้อมูลจำลอง (สำหรับเทสหน้าเว็บใน Chrome/Browser ทั่วไป)
// false = เปิด LIFF ใช้งานจริง (ต้องเปิดใน LINE)
const IS_DEV_MODE = false; 
// ==========================================

const API_BASE_URL = "https://sheetevantdataapi.vercel.app/api";

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
        // ใน Dev mode อาจจะไม่แสดง Alert รบกวน ถ้าอยากดู UI เฉยๆ
        if (!IS_DEV_MODE) {
             Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลนิทรรศการได้', 'error');
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
        // ตรวจสอบว่ามีข้อมูลหรือไม่ก่อนเรียก populateDates
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
    
    // ลบ Event Listener เก่าออกก่อน (ถ้ามี) เพื่อป้องกันการซ้อนทับ แต่ในที่นี้ใช้วิธีเปลี่ยน innerHTML ก็พอได้
    // แต่การ addEventListener ซ้ำๆ บน element เดิมอาจมีปัญหา แนะนำให้ใช้ onchange ใน html หรือ logic แบบนี้
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
            opt.textContent += " (เต็ม)";
            opt.style.color = "#888"; // เพิ่มสีเทาให้เห็นชัด
        }
        
        timeSelect.appendChild(opt);
    });
}

// เริ่มต้นดึงข้อมูลเมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener('DOMContentLoaded', fetchData);


// --- ฟังก์ชัน LIFF และการส่งฟอร์ม ---
function initializeLiff() {
    // เช็คโหมด Dev ก่อน
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
        // กรณี Error แต่ยังอยากให้เห็นฟอร์มตอนเทส
        Swal.fire('LIFF Error', 'ไม่สามารถเชื่อมต่อ LINE ได้', 'error');
    });
}

// ฟังก์ชันจำลองข้อมูลสำหรับ Dev Mode
function runDevMode() {
    const mockProfile = {
        userId: "U_DEV_TEST_001",
        displayName: "Dev User (Test Mode)",
        pictureUrl: "https://cdn-icons-png.flaticon.com/512/149/149071.png" // รูป Default
    };

    // ใส่ข้อมูลจำลองลงในฟอร์ม
    document.getElementById("userid").value = mockProfile.userId;
    document.getElementById("displayname").value = mockProfile.displayName;
    document.getElementById("profileimage").value = mockProfile.pictureUrl;
    
    // แสดงผลบนหน้าเว็บ
    const profileImg = document.getElementById("profileImageDisplay");
    profileImg.src = mockProfile.pictureUrl;
    profileImg.style.display = "block"; // บังคับโชว์

    document.getElementById("displayName").textContent = mockProfile.displayName;
    
    // แสดง Container ฟอร์ม
    document.querySelector('.container').style.display = 'block';

    console.log("Mock Data Loaded:", mockProfile);
    
    // หมายเหตุ: ใน Dev Mode เราจะไม่เรียก checkRegistration() 
    // เพื่อให้คุณเห็นหน้าฟอร์มเสมอ ไม่โดนเด้งไปหน้า Ticket
}

function getUserProfile() {
    liff.getProfile().then(profile => {
        document.getElementById("userid").value = profile.userId;
        document.getElementById("displayname").value = profile.displayName;
        document.getElementById("profileimage").value = profile.pictureUrl;
        document.getElementById("profileImageDisplay").src = profile.pictureUrl;
        document.getElementById("displayName").textContent = profile.displayName;
        document.querySelector('.container').style.display = 'block';
        
        // เช็คการลงทะเบียนเฉพาะตอนใช้งานจริง
        checkRegistration(profile.userId);
    }).catch(err => {
        console.error('Error getting profile', err);
    });
}

function checkRegistration(userId) {
    Swal.fire({
        title: 'กำลังตรวจสอบการลงทะเบียน...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });
    
    fetch(`${API_BASE_URL}/users`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch user list');
            return response.json();
        })
        .then(userIds => {
            if (userIds.includes(userId)) {
                Swal.close();
                // ถ้าลงทะเบียนแล้ว ให้เด้งไปหน้าบัตร
                window.location.href = 'eticket.html';
            } else {
                Swal.close();
            }
        })
        .catch(error => {
            console.error('Error fetching userIds:', error);
            Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถตรวจสอบการลงทะเบียนได้', 'error');
        });
}

async function submitForm() {
    const form = document.getElementById('eventForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    Swal.fire({
        title: 'กำลังลงทะเบียน',
        text: 'กรุณารอสักครู่...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
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

    // ใน Dev Mode อาจจะแค่ Alert ข้อมูลออกมาดู ไม่ต้องยิง API จริงก็ได้
    // แต่ถ้ายิง API จริง ข้อมูลจะเข้าไปใน Sheet เป็นชื่อ Dev User
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
            Swal.fire({
                title: 'ลงทะเบียนสำเร็จ!',
                icon: 'success',
                timer: 2000,
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
        Swal.fire({
            title: 'เกิดข้อผิดพลาด',
            text: error.message,
            icon: 'error'
        });
    }
}

window.onload = initializeLiff;