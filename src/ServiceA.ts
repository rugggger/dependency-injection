import Logger from "./Logger";
import { InjectableClass, InjectProperty } from "./di/decorators";

@InjectableClass()
class ServiceA {

    @InjectProperty("Logger")
    loggingService: Logger

    constructor(
        
    ){
        console.log('initialising service A')
        console.log('check value of ServiceA', this);
    }
    run(){
        console.log('running service A');
        this.loggingService.log("this works !")
    }
}

export default ServiceA;