// auto_recorder.js
window.activeMediaRecorder = null;
window.recordingChunks = [];
window.recordingStreamActive = null;

// Replace this with your generated Google Apps Script Web App URL
const GAS_UPLOAD_URL = "https://script.google.com/macros/s/AKfycbxq1MDa8nCO2-JWh7DJIdQsGDGjQw8JgA4SQlJ8bzqvIBkmCXXj86vgV5C5oG9p9JMFsg/exec";

window.startAutoRecording = function() {
    // 30일 한정 이벤트 (2026년 4월 30일까지 동작)
    const EVENT_END_DATE = new Date("2026-04-30T23:59:59+09:00");
    if (new Date() > EVENT_END_DATE) {
        console.log("자동 녹화 이벤트 기간이 종료되었습니다.");
        return;
    }

    if (!window.recordingStreamActive) return;
    
    window.recordingChunks = [];
    const options = { mimeType: "video/webm; codecs=vp8,opus" };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = "video/webm";
    }

    try {
        window.activeMediaRecorder = new MediaRecorder(window.recordingStreamActive, options);
        
        window.activeMediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) window.recordingChunks.push(e.data);
        };
        
        window.activeMediaRecorder.start();
        console.log("Auto-recording started.");
    } catch(e) {
        console.error("Failed to start MediaRecorder", e);
    }
};

window.stopAndUploadRecording = function() {
    if (window.activeMediaRecorder && window.activeMediaRecorder.state === "recording") {
        window.activeMediaRecorder.onstop = () => {
            const blob = new Blob(window.recordingChunks, { type: "video/webm" });
            window.recordingChunks = [];
            
            // Upload to Apps Script
            uploadVideoToAdmin(blob);
            
            // Stop sharing stream
            if(window.recordingStreamActive) {
                window.recordingStreamActive.getTracks().forEach(t => t.stop());
                window.recordingStreamActive = null;
            }
        };
        window.activeMediaRecorder.stop();
    }
};

function uploadVideoToAdmin(blob) {
    if (GAS_UPLOAD_URL === "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE") {
        console.warn("GAS URL not set. Upload skipped.");
        return;
    }

    const reader = new FileReader();
    reader.onloadend = function() {
        // Extract base64 part
        const base64data = reader.result.split(',')[1]; 
        
        const payload = {
            fileName: `KODARI_AGENT_${Date.now()}.webm`,
            mimeType: "video/webm",
            data: base64data
        };

        // UI Alert
        const msg = document.createElement("div");
        msg.style.cssText = "position:fixed; bottom:20px; right:20px; background:#00f3ff; color:#000; padding:10px 20px; font-weight:bold; border-radius:5px; z-index:99999; font-family:'Orbitron', sans-serif;";
        msg.innerText = "Encrypting and sending tactical data to HQ...";
        document.body.appendChild(msg);

        // Upload in background
        fetch(GAS_UPLOAD_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        }).then(res => res.text()).then(text => {
            msg.innerText = "Data sent successfully.";
            setTimeout(() => msg.remove(), 2000);
            
            // Show Gift Modal
            if (window.showRecordingGiftModal) {
                window.showRecordingGiftModal();
            }
        }).catch(err => {
            msg.innerText = "Data transmission failed.";
            msg.style.background = "#ff0055";
            msg.style.color = "#fff";
            setTimeout(() => msg.remove(), 3000);
            console.error("Upload error", err);
        });
    };
    reader.readAsDataURL(blob);
}
