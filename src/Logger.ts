import { InjectableSingleton } from "./di/decorators";

@InjectableSingleton("Logger")
class Logger {
    messages=[];
    log(message) {
        this.messages.push(`${Date.now()} :${message}`);
        console.log(this.messages);
    }
}

export default Logger;

