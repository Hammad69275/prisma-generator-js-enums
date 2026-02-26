import { generatorHandler } from "@prisma/generator-helper";
import { generateJsEnums, generateTsEnums } from "./enum-generator";
import fs from "fs";
import path from "path";

generatorHandler({
  onManifest() {
    return {
      defaultOutput: "./generated/enums",
      prettyName: "JS Enums Generator",
    };
  },
  async onGenerate(options) {
    const outputDir = options.generator.output?.value;
    if (!outputDir) {
      throw new Error("No output directory specified");
    }

    fs.mkdirSync(outputDir, { recursive: true });

    const enums = options.dmmf.datamodel.enums;
    const outputType = options.generator.config?.outputType || "js";
    const isTs = outputType === "ts";
    const content = isTs ? generateTsEnums(enums) : generateJsEnums(enums);
    const filename = isTs ? "index.ts" : "index.js";
    const staleFile = isTs ? "index.js" : "index.ts";

    // Remove stale file from a previous outputType config
    const stalePath = path.join(outputDir, staleFile);
    if (fs.existsSync(stalePath)) {
      fs.unlinkSync(stalePath);
    }

    fs.writeFileSync(path.join(outputDir, filename), content);
  },
});
