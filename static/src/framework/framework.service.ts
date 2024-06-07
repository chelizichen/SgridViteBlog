import { Autowired, Component } from "sgridnode/build/main";
import loggerComponent from "../components/logger";

@Component()
export class FrameworkService {
  @Autowired(loggerComponent) logger: loggerComponent;

  constructor() {
    console.log("framework service init");
  }

  msg = "greet";

  greet() {
    // this.createError();
    this.logger.data("data :: ", this.msg);
    return this.msg;
  }

  createError() {
    throw new Error("framework service error");
  }
}
