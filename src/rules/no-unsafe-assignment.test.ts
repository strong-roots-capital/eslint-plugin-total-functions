import rule from "./no-unsafe-assignment";
import { RuleTester } from "@typescript-eslint/experimental-utils/dist/ts-eslint";
import { AST_NODE_TYPES } from "@typescript-eslint/experimental-utils/dist/ts-estree";

const ruleTester = new RuleTester({
  parserOptions: {
    sourceType: "module",
    project: "./tsconfig.tests.json",
  },
  parser: require.resolve("@typescript-eslint/parser"),
});

// eslint-disable-next-line functional/no-expression-statement
ruleTester.run("no-unsafe-assignment", rule, {
  valid: [
    // zero parameters
    {
      filename: "file.ts",
      code: `
        const foo = () => {
          return undefined;
        };
        foo();
      `,
    },
    // non-object parameter
    {
      filename: "file.ts",
      code: `
        const foo = (a: string) => {
          return undefined;
        };
        foo("a");
      `,
    },
    // readonly -> readonly (type doesn't change)
    {
      filename: "file.ts",
      code: `
        type ReadonlyA = { readonly a: string };
        const func = (param: ReadonlyA): void => {
          return undefined;
        };
        const readonlyA: ReadonlyA = { a: "" };
        func(readonlyA);
      `,
    },
    // mutable -> mutable (type doesn't change)
    {
      filename: "file.ts",
      code: `
        type MutableA = {a: string};
        const foo = (mut: MutableA) => {
          mut.a = "whoops";
        };
        const mut: MutableA = { a: "" };
        foo(mut);
      `,
    },
    // object literal -> mutable (no reference to object retained)
    {
      filename: "file.ts",
      code: `
        type MutableA = {a: string};
        const foo = (mut: MutableA) => {
          mut.a = "whoops";
        };
        foo({ a: "" });
      `,
    },
    // object literal -> readonly (no reference to object retained)
    {
      filename: "file.ts",
      code: `
        type ReadonlyA = { readonly a: string };
        const func = (param: ReadonlyA): void => {
          return undefined;
        };
        func({ a: "" });
      `,
    },
  ],
  invalid: [
    // mutable -> mutable (type changes)
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type MutableB = { a: string | null };
        const foo = (mut: MutableB): void => {
          mut.a = null; // whoops
        };
        const mut: MutableA = { a: "" };
        foo(mut);
      `,
      errors: [
        {
          messageId: "errorStringCallExpression",
          type: AST_NODE_TYPES.Identifier,
        },
      ],
    },
    // readonly -> mutable
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = Readonly<MutableA>;
        const mutate = (mut: MutableA): void => {
          mut.a = "whoops";
        };
        const readonlyA: ReadonlyA = { a: "readonly?" };
        mutate(readonlyA);
      `,
      errors: [
        {
          messageId: "errorStringCallExpression",
          type: AST_NODE_TYPES.Identifier,
        },
      ],
    },
    // mutable -> readonly
    {
      filename: "file.ts",
      code: `
        type MutableA = { a: string };
        type ReadonlyA = Readonly<MutableA>;
        const func = (param: ReadonlyA): void => {
          return undefined;
        };
        const mutableA: MutableA = { a: "" };
        func(mutableA);
      `,
      errors: [
        {
          messageId: "errorStringCallExpression",
          type: AST_NODE_TYPES.Identifier,
        },
      ],
    },
  ],
});