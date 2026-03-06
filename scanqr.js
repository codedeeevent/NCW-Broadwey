// --- ค่าคงที่สำหรับ API ---
const API_SUBMIT_URL = 'https://sheetevantdataapi.vercel.app/api/submit';
const API_CHECK_URL = 'https://sheetevantdataapi.vercel.app/api/check-duplicate';

window.onload = function() {
    liff.init({ liffId: "2007559959-x55Zn2Vw" }) // ใส่ LIFF ID ของหน้าสแกน
        .then(() => {
            // ปุ่มสแกน QR Code
            document.getElementById('scanButton').addEventListener('click', () => {
                if (!liff.isLoggedIn()) {
                    liff.login();
                    return;
                }
                
                liff.scanCodeV2()
                    .then(result => {
                        if (result.value) {
                            document.getElementById('scannedData').value = result.value;
                            Swal.fire({
                                title: 'สแกนสำเร็จ!',
                                text: `E-Ticket: ${result.value}`,
                                icon: 'success',
                                timer: 1500,
                                showConfirmButton: false
                            });
                        }
                    })
                    .catch(error => {
                        console.error('QR code scan error:', error);
                        Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถสแกน QR code ได้', 'error');
                    });
            });

            // ปุ่มบันทึกข้อมูล
            document.getElementById('saveButton').addEventListener('click', () => {
                const scannedData = document.getElementById('scannedData').value;

                if (scannedData.trim() === '') {
                    Swal.fire('กรุณาสแกน E-Ticket ก่อน', '', 'warning');
                    return;
                }

                Swal.fire({
                    title: 'กำลังตรวจสอบ E-Ticket',
                    text: 'กรุณารอสักครู่...',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                // 1. เรียก API เพื่อดึงข้อมูลที่เคยสแกนแล้วทั้งหมด
                fetch(API_CHECK_URL)
                    .then(response => {
                        if (!response.ok) throw new Error('Failed to check for duplicates');
                        return response.json();
                    })
                    .then(scannedItems => {
                        // 2. ตรวจสอบว่าข้อมูลที่สแกนมาซ้ำหรือไม่
                        // vvvvvvvvvvvvvvvv จุดที่แก้ไข vvvvvvvvvvvvvvvv
                        const isDuplicate = scannedItems.some(item => item.userId === scannedData);
                        // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

                        if (isDuplicate) {
                            Swal.fire('E-Ticket นี้ถูกใช้งานแล้ว', 'ไม่สามารถลงทะเบียนซ้ำได้', 'error');
                        } else {
                            // 3. ถ้าไม่ซ้ำ ให้ส่งข้อมูลไปบันทึก
                            saveScannedData(scannedData);
                        }
                    })
                    .catch(error => {
                        Swal.close();
                        console.error('Error fetching data for duplicate check:', error);
                        Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถตรวจสอบข้อมูลซ้ำได้', 'error');
                    });
            });
        })
        .catch(error => {
            console.error('LIFF initialization error:', error);
            Swal.fire('เกิดข้อผิดพลาด', 'LIFF ไม่สามารถเริ่มต้นได้', 'error');
        });
};

/**
 * ฟังก์ชันสำหรับส่งข้อมูลที่สแกนแล้วไปบันทึก
 * @param {string} scannedData - ข้อมูลที่ได้จากการสแกน (UserID)
 */
function saveScannedData(scannedData) {
    Swal.fire({
        title: 'กำลังบันทึกข้อมูล',
        text: 'กรุณารอสักครู่...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    fetch(API_SUBMIT_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ scannedData: scannedData })
        // ไม่ต้องใช้ mode: 'no-cors' เพราะ Vercel API ของเรารองรับ CORS อยู่แล้ว
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to save data');
        return response.json();
    })
    .then(() => {
        Swal.fire('บันทึกข้อมูลสำเร็จ!', '', 'success');
        document.getElementById('scannedData').value = ''; // เคลียร์ช่องข้อมูล
    })
    .catch(error => {
        console.error('Error saving data:', error);
        Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้', 'error');
    });
}