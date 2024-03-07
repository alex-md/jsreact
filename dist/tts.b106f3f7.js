let e;let t,o=document.querySelector("#textToSpeechButton"),n=document.querySelector("#ttsAudio");function r(e){return/sk-[a-zA-Z0-9]{48}/.test(e)}function a(){var e=document.createElement("div");e.id="toastContainer",e.classList.add("position-fixed","bottom-0","start-0","p-3");var t=document.createElement("div");t.id="apiKeyToast",t.classList.add("toast"),t.setAttribute("role","alert"),t.setAttribute("aria-live","assertive"),t.setAttribute("aria-atomic","true");var o=document.createElement("div");o.classList.add("toast-header","bg-warning");var n=document.createElement("strong");n.classList.add("mr-auto"),n.textContent="Missing API Key";var r=document.createElement("button");r.type="button",r.classList.add("ml-2","mb-1","close","hidden"),r.setAttribute("data-bs-dismiss","toast"),r.setAttribute("aria-label","Close"),o.appendChild(n);var a=document.createElement("div");a.classList.add("toast-body","text-body-secondary"),a.textContent="Please enter a valid OpenAI API key.",t.appendChild(o),t.appendChild(a),e.appendChild(t),document.body.appendChild(e),new bootstrap.Toast(t).show()}o.addEventListener("click",(function(){if(!e||!r(e))return void a();console.log("start convertToSpeedch()");const t=document.getElementById("textToSpeechInput").value,o=document.querySelector('input[name="voice"]:checked').value;fetch("https://api.openai.com/v1/audio/speech",{method:"POST",headers:{Authorization:`Bearer ${e}`,"Content-Type":"application/json"},body:JSON.stringify({model:"tts-1",input:t,voice:o.toLowerCase()})}).then((e=>{if(!e.ok)throw new Error(`HTTP error! status: ${e.status}`);return e.blob()})).then((e=>{const t=URL.createObjectURL(e);n.src=t,n.play()})).catch((e=>console.error("Error:",e)))}));let d=[],i=!1,s=document.querySelector("#pressthenreleaseButton"),c=document.querySelector("#transcribedText");function u(){e&&r(e)?(console.log("start rec"),c.innerHTML="start rec...",navigator.mediaDevices.getUserMedia({audio:!0}).then((e=>{t=new MediaRecorder(e),t.ondataavailable=e=>{d.push(e.data)},t.onstop=e=>{const t=new Blob(d,{type:"audio/wav"});d=[];!function(e){const t=document.getElementById("speechToTextInput"),o=e||t.files[0],n="your_openai_api_key";if(!n||!r(n))return void a();const d=new FormData;d.append("file",o),d.append("model","whisper-1"),fetch("https://api.openai.com/v1/audio/transcriptions",{method:"POST",headers:{Authorization:`Bearer ${n}`},body:d}).then((e=>{if(!e.ok)throw new Error(`HTTP error! status: ${e.status}`);return e.json()})).then((e=>{const t=document.getElementById("transcribedText");t&&(t.innerText=e.text);const o=document.getElementById("textToSpeechInput");o&&(o.value=e.text),console.log(e)})).catch((e=>console.error("Error:",e)))}(new File([t],"recordedAudio.wav",{type:"audio/wav"}))},t.start(),i=!0,document.getElementById("recordingStatus").innerText="Recording...",document.getElementById("recordButton").innerText="Stop Recording"}))):a()}function l(){e&&r(e)?(console.log("stop rec"),c.innerHTML="stop rec... wait to transcript",t.stop(),i=!1,document.getElementById("recordingStatus").innerText="Not Recording",document.getElementById("recordButton").innerText="Start Recording"):a()}s.addEventListener("pointerdown",u),s.addEventListener("pointerup",l);
//# sourceMappingURL=tts.b106f3f7.js.map
