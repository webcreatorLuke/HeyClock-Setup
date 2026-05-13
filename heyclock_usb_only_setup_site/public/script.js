let port = null;
let reader = null;
let writer = null;

const logBox = document.getElementById("logBox");

function setStep(num){
  for(let i=1;i<=3;i++){
    document.getElementById(`step${i}`).classList.toggle("active", i === num);
  }
}

function show(id){document.getElementById(id).classList.remove("hidden");}
function hide(id){document.getElementById(id).classList.add("hidden");}

function log(t){
  console.log(t);
  logBox.textContent += "\n" + t;
  logBox.scrollTop = logBox.scrollHeight;
}

async function send(cmd){
  if(!writer){
    log("ERROR: HeyClock is not connected.");
    alert("HeyClock is not connected. Click Connect HeyClock first.");
    return;
  }

  const msg = JSON.stringify(cmd) + "\n";
  log("Sending: " + msg.trim());

  try {
    await writer.write(new TextEncoder().encode(msg));
    log("Sent successfully.");
  } catch (err) {
    log("Send failed: " + err.message);
  }
}

async function readLoop(){
  try {
    const decoder = new TextDecoderStream();
    port.readable.pipeTo(decoder.writable).catch(err => log("Readable stream error: " + err.message));
    reader = decoder.readable.getReader();

    let buffer = "";

    while(true){
      const {value, done} = await reader.read();
      if(done) break;
      if(!value) continue;

      buffer += value;
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for(const line of lines){
        handleLine(line.trim());
      }
    }
  } catch (err) {
    log("Read loop error: " + err.message);
  }
}

function handleLine(line){
  if(!line) return;
  log("Device: " + line);

  try{
    const data = JSON.parse(line);

    if(data.type === "HELLO" || data.type === "BOOT"){
      log("HeyClock detected.");
    }

    if(data.type === "SETUP_SAVED"){
      hide("settingsPanel");
      show("readyPanel");
      setStep(3);
    }
  } catch(e) {}
}

document.addEventListener("DOMContentLoaded", () => {
  log("Page loaded.");

  document.getElementById("connectBtn").addEventListener("click", async () => {
    log("Connect button clicked.");

    if(!("serial" in navigator)){
      alert("Web Serial is not supported. Use Chrome or Edge on a computer.");
      return;
    }

    try{
      port = await navigator.serial.requestPort();
      await port.open({baudRate:115200});
      writer = port.writable.getWriter();

      log("Connected over USB.");
      readLoop();

      await send({type:"HELLO"});

      hide("connectPanel");
      show("settingsPanel");
      setStep(2);
    } catch(err) {
      log("USB connect failed: " + err.message);
    }
  });

  document.getElementById("saveSetupBtn").addEventListener("click", async () => {
    await send({
      type:"SAVE_SETUP",
      deviceName:document.getElementById("deviceName").value,
      timezone:document.getElementById("timezone").value,
      language:document.getElementById("language").value,
      alarmTime:document.getElementById("alarmTime").value
    });
  });
});
