// STM32 cihazından gelen mesajları otomatik okuyan kod
const stm32VID = 0x0483; // STMicroelectronics VID
const stm32PIDs = [0x5740, 0x3748]; // STM32 örnek PID'ler

let reader; // Global reader nesnesi

async function connectToSTM32() {
    const statusMessage = document.getElementById("statusMessage");

    try {
        // STM32 cihazını seç
        const port = await navigator.serial.requestPort();

        /*       
        // STM32 cihazını seç
        const port = await navigator.serial.requestPort({
            filters: [
                { usbVendorId: stm32VID, usbProductId: 0x5740 },
                { usbVendorId: stm32VID, usbProductId: 0x3748 }
            ]
        });
        */

        await port.open({ baudRate: 115200 }); // Baud hızı
        statusMessage.textContent = "Connected to STM32!";
        statusMessage.className = "connectionSuccessfull";

        const decoder = new TextDecoderStream();
        const inputDone = port.readable.pipeTo(decoder.writable);
        const inputStream = decoder.readable;

        reader = inputStream.getReader();

        // Gelen veriyi sürekli olarak oku
        readSTM32Messages();
    } catch (error) {
        console.error("Connection failed:", error);
        statusMessage.textContent = "Connection failed: " + error.message;
        statusMessage.className = "connectionError";
    }
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
            console.log("Message from STM32:", value);
            statusMessage.textContent = "Response: " + value;
            statusMessage.className = "readingSuccessfull";
        } catch (error) {
            console.error("Error reading from STM32:", error);
            statusMessage.textContent = "Error reading from STM32: " + error.message;
            statusMessage.className = "readingError";
            break;
        }
    }
}

// Bağlan butonu için event listener
const connectButton = document.getElementById("connectButton");
connectButton.addEventListener("click", connectToSTM32);
