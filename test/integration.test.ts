import { execSync } from "child_process";
import path from "path";
import fs from "fs";

const projectRoot = path.join(__dirname, "..");
const generatedDir = path.join(__dirname, "generated");
const generatedTsDir = path.join(__dirname, "generated-ts");
const generatedEmptyDir = path.join(__dirname, "generated-empty");

function generate(schema: string) {
  execSync(`npx prisma generate --schema ${schema}`, {
    cwd: projectRoot,
    stdio: "pipe",
  });
}

function cleanup(...dirs: string[]) {
  for (const dir of dirs) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true });
    }
  }
}

beforeAll(() => {
  cleanup(generatedDir, generatedTsDir, generatedEmptyDir);
});

afterAll(() => {
  cleanup(generatedDir, generatedTsDir, generatedEmptyDir);
});

describe("JS output", () => {
  beforeAll(() => {
    generate("test/schema.prisma");
  });

  it("generates index.js", () => {
    expect(fs.existsSync(path.join(generatedDir, "index.js"))).toBe(true);
  });

  it("exports all enums with correct values", () => {
    const enums = require("./generated");

    expect(enums.Role.USER).toBe("USER");
    expect(enums.Role.ADMIN).toBe("ADMIN");
    expect(enums.Role.MODERATOR).toBe("MODERATOR");
    expect(enums.Status.ACTIVE).toBe("ACTIVE");
    expect(enums.Status.INACTIVE).toBe("INACTIVE");
    expect(enums.Status.PENDING).toBe("PENDING");
    expect(enums.Color.RED).toBe("RED");
    expect(enums.Color.GREEN).toBe("GREEN");
    expect(enums.Color.BLUE).toBe("BLUE");
  });

  it("freezes enum objects", () => {
    const enums = require("./generated");

    expect(Object.isFrozen(enums.Role)).toBe(true);
    expect(Object.isFrozen(enums.Status)).toBe(true);
    expect(Object.isFrozen(enums.Color)).toBe(true);
  });

  it("handles single-value enum", () => {
    const enums = require("./generated");

    expect(enums.Singleton.ONLY).toBe("ONLY");
    expect(Object.keys(enums.Singleton)).toHaveLength(1);
    expect(Object.isFrozen(enums.Singleton)).toBe(true);
  });

  it("rejects mutation on frozen objects", () => {
    const enums = require("./generated");

    expect(() => {
      enums.Role.NEW_ROLE = "NEW_ROLE";
    }).toThrow(TypeError);
  });
});

describe("TS output", () => {
  let content: string;

  beforeAll(() => {
    generate("test/schema-ts.prisma");
    content = fs.readFileSync(
      path.join(generatedTsDir, "index.ts"),
      "utf-8"
    );
  });

  it("generates index.ts", () => {
    expect(fs.existsSync(path.join(generatedTsDir, "index.ts"))).toBe(true);
  });

  it("uses as const syntax", () => {
    expect(content).toContain("export const Role = {");
    expect(content).toContain("} as const;");
  });

  it("exports union types for each enum", () => {
    expect(content).toContain(
      "export type Role = (typeof Role)[keyof typeof Role];"
    );
    expect(content).toContain(
      "export type Status = (typeof Status)[keyof typeof Status];"
    );
    expect(content).toContain(
      "export type Color = (typeof Color)[keyof typeof Color];"
    );
  });

  it("includes all enum values", () => {
    expect(content).toContain('  USER: "USER",');
    expect(content).toContain('  ADMIN: "ADMIN",');
    expect(content).toContain('  MODERATOR: "MODERATOR",');
    expect(content).toContain('  ACTIVE: "ACTIVE",');
    expect(content).toContain('  RED: "RED",');
  });

  it("handles single-value enum", () => {
    expect(content).toContain("export const Singleton = {");
    expect(content).toContain('  ONLY: "ONLY",');
    expect(content).toContain(
      "export type Singleton = (typeof Singleton)[keyof typeof Singleton];"
    );
  });
});

describe("empty schema", () => {
  beforeAll(() => {
    generate("test/schema-empty.prisma");
  });

  it("generates index.js with empty exports", () => {
    const file = path.join(generatedEmptyDir, "index.js");
    expect(fs.existsSync(file)).toBe(true);

    const content = fs.readFileSync(file, "utf-8");
    expect(content).toContain("module.exports = {};");
  });

  it("exports an empty object", () => {
    const enums = require("./generated-empty");
    expect(enums).toEqual({});
  });
});

describe("stale file cleanup", () => {
  it("removes index.js when switching to TS output", () => {
    // generated-empty currently has index.js from the previous test
    const staleSchema = path.join(__dirname, "schema-stale.prisma");
    fs.writeFileSync(
      staleSchema,
      `datasource db {
  provider = "postgresql"
}

generator jsEnums {
  provider   = "tsx src/bin.ts"
  output     = "../test/generated-empty"
  outputType = "ts"
}

enum Temp {
  A
}

model M {
  id Int @id @default(autoincrement())
}
`
    );

    try {
      generate("test/schema-stale.prisma");

      expect(
        fs.existsSync(path.join(generatedEmptyDir, "index.js"))
      ).toBe(false);
      expect(
        fs.existsSync(path.join(generatedEmptyDir, "index.ts"))
      ).toBe(true);
    } finally {
      fs.unlinkSync(staleSchema);
    }
  });
});
