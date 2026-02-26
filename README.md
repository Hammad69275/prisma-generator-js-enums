# prisma-generator-js-enums

Prisma generator that creates JavaScript or TypeScript enum objects from your Prisma schema enums.

## Install

```bash
npm install prisma-generator-js-enums
```

## Usage

Add the generator to your `schema.prisma`:

```prisma
generator jsEnums {
  provider = "prisma-generator-js-enums"
  output   = "./generated/enums"
}
```

Then run:

```bash
npx prisma generate
```

### Schema

```prisma
enum Role {
  USER
  ADMIN
  MODERATOR
}

enum Status {
  ACTIVE
  INACTIVE
}
```

### JS output (default)

```js
const Role = Object.freeze({
  USER: "USER",
  ADMIN: "ADMIN",
  MODERATOR: "MODERATOR",
});

const Status = Object.freeze({
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
});

module.exports = { Role, Status };
```

### TypeScript output

Set `outputType = "ts"` to generate TypeScript with `as const` objects and union types:

```prisma
generator jsEnums {
  provider   = "prisma-generator-js-enums"
  output     = "./generated/enums"
  outputType = "ts"
}
```

```ts
export const Role = {
  USER: "USER",
  ADMIN: "ADMIN",
  MODERATOR: "MODERATOR",
} as const;

export type Role = (typeof Role)[keyof typeof Role];
// "USER" | "ADMIN" | "MODERATOR"

export const Status = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

export type Status = (typeof Status)[keyof typeof Status];
// "ACTIVE" | "INACTIVE"
```

## Options

| Option       | Values       | Default | Description              |
| ------------ | ------------ | ------- | ------------------------ |
| `output`     | path         | `./generated/enums` | Output directory |
| `outputType` | `"js"` `"ts"` | `"js"`  | Output format           |

## License

ISC
