// STM32 cihazından gelen mesajları otomatik okuyan kod
const stm32VID = 0x0483; // STMicroelectronics VID
const stm32PIDs = [0x5740, 0x3748]; // STM32 örnek PID'ler

let port;
let reader;

let keepReading = true;

async function listAvailablePorts() {
    if (navigator.serial) {
        // The Web Serial API is supported.
        const portSelect = document.getElementById("portSelect");
        portSelect.innerHTML = ""; // Clear existing options
    
        try {
            const ports = await navigator.serial.getPorts();
            if (ports.length === 0) {
                portSelect.innerHTML = "<option>No available ports</option>";
                return;
            }
    
            for (const p of ports) {
                const option = document.createElement("option");
                option.value = ports.indexOf(p);
                const info = await p.getInfo();
                option.textContent = `VID: ${info.usbVendorId} PID: ${info.usbProductId}`;
                portSelect.appendChild(option);
            }
        } catch (error) {
            console.error("Error listing ports:", error);
        }
    }
    else{
        statusMessage.textContent = "Unsupported browser."
        statusMessage.className = "connectionError"
    }

}

async function connectToSTM32() {
    const statusMessage = document.getElementById("statusMessage");
    const portSelect = document.getElementById("portSelect");

    if(navigator.serial){
        try {
            const availablePorts = await navigator.serial.getPorts();
            const selectedPortIndex = portSelect.value;
            if (availablePorts.length === 0 || selectedPortIndex === "") {
                statusMessage.textContent = "No port selected.";
                return;
            }

            port = availablePorts[selectedPortIndex];
            await port.open({ baudRate: 115200 }); // Baud hızı
            const info = await port.getInfo();
            statusMessage.textContent = `Connected to VID: ${info.usbVendorId} PID: ${info.usbProductId}`;
            statusMessage.className = "connectionSuccessfull"

            const decoder = new TextDecoderStream();
            const inputDone = port.readable.pipeTo(decoder.writable);
            const inputStream = decoder.readable;

            reader = inputStream.getReader();

            // Gelen veriyi sürekli olarak oku
            readSTM32Messages();
        } catch (error) {
            console.error("Connection failed:", error);
            statusMessage.textContent = "Connection failed: " + error.message;
            statusMessage.className = "connectionError"
        }
    }
    else{
        alert(`Web Serial API not on that browser supported.`);
    }
}
async function disconnectDevice() {
    keepReading = false;
    statusMessage.textContent = "Disconnected";
    statusMessage.className = "connectionError"
}


async function readSTM32Messages() {
    const statusMessage = document.getElementById("statusMessage");

    while (true) {
        try {
            const { value, done } = await reader.read();
            if (done) {
                console.log("Stream closed");
                break;
            }

            // STM32'den gelen mesajı göster
            console.log("Message from device:", value);
            deviceMessage.textContent = "Response: " + value;
            deviceMessage.className = "readingSuccessfull"
        } catch (error) {
            console.error("Error reading from device:", error);
            deviceMessage.textContent = "Error reading from device: " + error.message;
            deviceMessage.className = "readingError"
            break;
        }
    }
}


async function readUntilClosed() {
    const statusMessage = document.getElementById("statusMessage");

    while(port.readeble && keepReading){
        reader = port.readeble.getReader();
        try{
            while(true){
                const { value, done } = await reader.read();
                if(done){
                    console.log("Stream closed.")
                    break;
                }
                // STM32'den gelen mesajı göster
                console.log("Message from device:", value);
                deviceMessage.textContent = "Response: " + value;
                deviceMessage.className = "readingSuccessfull"
            }
        } catch(error){
            console.error("Error reading from device:", error);
            deviceMessage.textContent = "Error reading from device: " + error.message;
            deviceMessage.className = "readingError"
            break;
        } finally{
            reader.releaseLock();
        }
    }

    await port.close();
    reader.cancel();
}

// Bağlan butonu için event listener
const connectButton = document.getElementById("connectButton");
connectButton.addEventListener("click", connectToSTM32);

// Sayfa yüklendiğinde portları listele
document.addEventListener("DOMContentLoaded", listAvailablePorts);