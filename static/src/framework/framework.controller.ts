import {
  Controller,
  Get,
  Autowired,
  Value,
  WithErrorHandler,
  Resp,
} from "sgridnode/build/main";
import { Request, Response, Express, Router } from "express";
import { FrameworkService } from "./framework.service";
import loggerComponent from "../components/logger";
import { Handler } from "../interceptor/error";

@Controller("/framework")
class FrameworkController {
  public ctx: Express;
  public router: Router | undefined;

  @Autowired(loggerComponent) logger: loggerComponent;
  @Autowired(FrameworkService) frameworkService: FrameworkService;

  @Value("server.name") serverName: string;

  constructor(ctx: Express) {
    this.ctx = ctx;
  }

  @Get("/hello")
  @WithErrorHandler(Handler)
  async hello(req: Request, res: Response) {
    this.logger.data("req.url ", req.url);
    return Resp.Ok(
      this.serverName + " :: hello ::" + this.frameworkService.greet()
    );
  }

  @Get("/error")
  @WithErrorHandler(Handler)
  async errorTest(req: Request, res: Response) {
    this.logger.data("req.url ", req.url);
    return Resp.Ok(
      this.serverName + " :: hello ::" + this.frameworkService.createError()
    );
  }
}

export { FrameworkController };
