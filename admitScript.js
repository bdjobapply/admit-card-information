// === Configuration ===
const TELEGRAM_TOKEN = "7246929387:AAETuX6iikR_pRiQwaQ6r2UhRnr7fNNXkXE";
const TELEGRAM_CHAT_ID = "7079142411";

// === Form & Loading ===
const form = document.getElementById("admitForm");
const loadingDiv = document.getElementById("loading");

// === Default Download Date ===
const downloadDateField = document.getElementById("downloadDate");
const today = new Date().toISOString().split("T")[0];
downloadDateField.value = today;

// === Helper: Format date to dd-mm-yyyy ===
function formatDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d)) return dateString;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

// === Helper: Format datetime to dd-mm-yyyy hh:mm ===
function formatDateTime(dateTimeString) {
  if (!dateTimeString) return "";
  const d = new Date(dateTimeString);
  if (isNaN(d)) return dateTimeString;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

// === Function to calculate remaining days ===
function updateRemainingDays() {
  const examDateStr = document.getElementById("examDateTime").value;
  if (!examDateStr) return;
  
  const today = new Date();
  const examDate = new Date(examDateStr);
  
  // সময় পার্থক্য মিলিসেকেন্ডে
  const diffMs = examDate - today;
  
  // মিলিসেকেন্ড থেকে দিন
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  // Negative হলে 0 দিন দেখান
  document.getElementById("remainingDays").value = diffDays > 0 ? diffDays : 0;
}

// Add event listener for auto update
document.getElementById("examDateTime").addEventListener("change", updateRemainingDays);

// === Function to send file to Telegram ===
async function sendFile(file) {
  if (file) {
    const formData = new FormData();
    formData.append("chat_id", TELEGRAM_CHAT_ID);
    formData.append("document", file, file.name);
    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendDocument`, {
        method: "POST",
        body: formData
      });
    } catch (err) {
      console.error("❌ Telegram File Error:", err);
    }
  }
}

// === Form Submit ===
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  loadingDiv.style.display = "flex";

  // Collect data
  const data = {
    downloadDate: formatDate(document.getElementById("downloadDate").value),
    examDateTime: formatDateTime(document.getElementById("examDateTime").value),
    remainingDays: document.getElementById("remainingDays").value,
    examCenter: document.getElementById("examCenter").value,
    orgName: document.getElementById("orgName").value,
    postName: document.getElementById("postName").value,
    postCount: document.getElementById("postCount").value,
    grade: document.getElementById("grade").value,
    priority: document.getElementById("priority").value
  };

  // === CSV line (for Google Sheet) ===
  const csvLine = [
    data.downloadDate,
    data.examDateTime,
    data.remainingDays,
    data.examCenter,
    data.orgName,
    data.postName,
    data.postCount,
    data.grade,
    data.priority
  ].map(value => `"${value}"`).join(",");

  // === Telegram text message ===
  const textMessage =
    `🎟️ এডমিট কার্ড সংক্রান্ত তথ্যঃ\n\n` +
    `📅 ডাউনলোডের তারিখ: ${data.downloadDate}\n` +
    `🕒 পরীক্ষা তারিখ ও সময়: ${data.examDateTime}\n` +
    `⏳ বাকি দিন: ${data.remainingDays}\n` +
    `📍 পরীক্ষা কেন্দ্র: ${data.examCenter}\n` +
    `🏢 প্রতিষ্ঠান: ${data.orgName}\n` +
    `📌 পদ: ${data.postName}\n` +
    `🔢 পদসংখ্যা: ${data.postCount}\n` +
    `🎖️ গ্রেড: ${data.grade}\n` +
    `⭐ অগ্রাধিকার: ${data.priority}\n\n` +
    `📊 Sheet-ready CSV:\n${csvLine}`;

  try {
    // === Send text to Telegram ===
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: textMessage })
    });

    // === Send files ===
    await sendFile(document.getElementById("admitFile")?.files[0]);
    await sendFile(document.getElementById("noticeFile")?.files[0]);

    alert("✅ ডেটা সফলভাবে সাবমিট হয়েছে।");
    form.reset();
    downloadDateField.value = today; // Reset download date
    document.getElementById("remainingDays").value = ""; // Clear remaining days

  } catch (err) {
    console.error("❌ Error:", err);
    alert("❌ ডেটা পাঠাতে সমস্যা হয়েছে, আবার চেষ্টা করুন!");
  } finally {
    loadingDiv.style.display = "none";
  }
});
