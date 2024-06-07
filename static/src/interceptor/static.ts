import path from "path";
import { WithStatic } from "sgridnode/build/main";
import { cwd } from "process";
export class SpaFile extends WithStatic {
  staticHandle(): [string, string] {
    const filePath = path.resolve(cwd(), "dist");
    return ["/docs/", filePath];
  }
}
