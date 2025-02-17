let port;
let reader;

let keepReading = true;

async function listAvailablePorts() {
    if (navigator.serial) {
        // The Web Serial API is supported.
        const portSelect = document.getElementById("portSelect");
        portSelect.innerHTML = ""; // Clear existing options
    
        try {
            // Request permission for ports (must be inside a user event)
            const ports = await navigator.serial.getPorts();
            if (ports.length === 0) {
                portSelect.innerHTML = "<option>No available ports</option>";
                return;
            }
    
            // Display ports informations
            for (const p of ports) {
                const option = document.createElement("option");
                option.value = ports.indexOf(p);
                const info = await p.getInfo();
                option.value = 0;
                option.textContent = `VID: ${info.usbVendorId} PID: ${info.usbProductId}`;
                portSelect.appendChild(option);
            };
            
            

        } catch (error) {
            console.error("Error listing ports:", error);
        }
    }
    else{
        statusMessage.textContent = "Unsupported browser."
        statusMessage.className = "connectionError"
    }

}

async function addManuallyDevice() {
    await navigator.serial.requestPort();
    listAvailablePorts();
}

async function connectToDevice() {
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

            // Read data
            readMessages();
        } catch (error) {
            console.error("Connection failed:", error);
            statusMessage.textContent = "Connection failed: " + error.message;
            statusMessage.className = "connectionError"
        }
    }
    else{
        alert(`Web Serial API not supported on that browser.`);
    }
}

async function readMessages() {
    const statusMessage = document.getElementById("statusMessage");

    while (true) {
        try {
            const { value, done } = await reader.read();
            if (done) {
                console.log("Stream closed");
                break;
            }

            // Display messages
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

// Bağlan butonu için event listener
const connectButton = document.getElementById("connectButton");
connectButton.addEventListener("click", connectToDevice);

// Add event listener for the refresh button
document.getElementById("refreshPortsButton").addEventListener("click", listAvailablePorts);

// Add event listener for the addManually button
document.getElementById("addManually").addEventListener("click", addManuallyDevice);

// Sayfa yüklendiğinde portları listele
document.addEventListener("DOMContentLoaded", listAvailablePorts);
