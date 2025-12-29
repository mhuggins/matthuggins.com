---
title: Building a Secure JavaScript Sandbox for Player Bot Scripts
date: 2025-12-29
published: true
tags: [typescript, javascript, node.js, security]
summary: How I built a secure sandbox for running untrusted player scripts using V8 isolates, a two-layer API architecture, and runtime code generation.
---

In my upcoming collectible card game, [Codebound](https://codebound.io), players don't just pick cards and click buttons. They write TypeScript (or JavaScript) code that controls their deck. These scripts analyze the board state, make decisions, and execute actions autonomously. This creates a unique challenge: how do I let users run arbitrary code on my servers without compromising security?

As you might expect, using `eval()` isn't an option. But I also didn't want to hobble the API so much that writing scripts becomes tedious. Players need to call functions, iterate over playable cards in their hand, and make decisions based on game state.

Here's how I approached building a sandboxed execution environment using V8 isolates that's both secure and in line with my API requirements.

## The Problem

### Running Untrusted Code Safely

When you accept code from users and run it on your servers, you're opening yourself up to several categories of attacks:

- [**Resource exhaustion**](https://en.wikipedia.org/wiki/Resource_exhaustion_attack): A simple `while(true) {}` can peg the CPU. Allocating massive arrays can exhaust memory. Without limits, a single malicious script can take down the service.

- [**Escape attacks**](https://en.wikipedia.org/wiki/Virtual_machine_escape): If user code can access Node.js globals like `require`, `process`, or `fs`, they can read environment variables, access the database, or worse.

- **State pollution**: If global variables persist between executions, one player's script could interfere with another's. Or a script could set up state on turn 1 that gives it an unfair advantage on turn 10.

Despite all these restrictions, I still needed to expose a rich API. Players should be able to write code like the following:

```ts
const hand = api.listHand();
hand.forEach((card) => {
  if (card.canPlay()) {
    card.play();
  }
});
```

That means returning objects with methods defined on them as opposed to simple serializable data structures.

### Why Not vm or vm2?

Node.js has a built-in [`vm`](https://nodejs.org/api/vm.html) module for running code in a separate context. The documentation is refreshingly honest about its limitations:

> The vm module is not a security mechanism. Do not use it to run untrusted code.

What about [`vm2`](https://www.npmjs.com/package/vm2), the popular sandboxing library? It was [discontinued in 2023](https://github.com/patriksimek/vm2/blob/b51d33c49b61e03cf67a075741790e9b938dd80f/README.md) after researchers discovered sandbox escape vulnerabilities that couldn't be fixed without a complete rewrite. The maintainers concluded that true sandboxing isn't possible with the approach `vm2` took.

## Using isolated-vm

Conveniently, vm2's deprecation notice explicitly calls out using [`isolated-vm`](https://github.com/laverdet/isolated-vm) as an alternative. This package provides access to V8 isolates -- the same isolation primitive that Chrome uses to keep tabs from interfering with each other.

Each isolate is a completely separate JavaScript heap. It has its own global object, its own garbage collector, and no shared state with other isolates. You can set hard limits on memory usage and CPU time. If a script exceeds its limits, it gets terminated.

```ts
import ivm from "isolated-vm";

const isolate = new ivm.Isolate({ memoryLimit: 128 }); // 128 MB
const context = await isolate.createContext();
const script = await isolate.compileScript("2 + 2");
const result = await script.run(context, { timeout: 5000 }); // 5 second limit
```

This gives us the isolation guarantees we need. Scripts can't access Node.js globals, can't read files, can't make network requests, etc. They're truly sandboxed.

### The Challenge

There's a catch: functions can't cross the isolate boundary.

V8 isolates can only transfer primitive data between them, limiting us to strings, numbers, booleans, and simple objects. You can't pass a JavaScript function from the host into the isolate and have the isolate call it directly.

For the API to be useful, though, it needs to expose methods on objects. When a player calls `card.play()`, something needs to happen in the game engine. How do I bridge this gap?

The naive approach would be to have players work with raw data, implementing every available function on the global object or an object that is made available to the global scope:

```ts
// Nobody wants to write this
const hand = api.getHand();
hand.forEach((card) => {
  if (api.canPlay(card.id)) {
    api.play(card.id);
  }
});
```

This just doesn't feel intuitive to me. While all functions can be found on one object, it adds complexity in terms of knowing what arguments to pass. For example, what if the user passes an invalid card ID to `api.canPlay()` or `api.play()`?

Instead, I wanted something more object-oriented. Players should be able to interact with rich objects that have built-in functions. But how do I make that work across the isolate boundary?

## A Two-Layer API Architecture

My solution splits the API into two layers that work together.

### Layer 1: Engine Context (The Primitive Layer)

The first layer lives outside the isolate, in normal Node.js land. It consists of pure functions that return serializable data:

```ts
// These functions return plain data, no methods
engine.getHand(state, player)        // → [{ id, name, cost, attack, health }, ...]
engine.canPlayCard(state, cardId)    // → boolean
engine.executePlay(state, cardId)    // → { effects: [...] }
```

These functions have full access to the game engine. They can read game state, validate actions, and execute plays. But they only return data that can be cloned across the isolate boundary.

### Layer 2: Player API (The User-Facing Layer)

The second layer is what players actually interact with. It's built entirely inside the isolate:

```ts
// Players write code like this
const hand = api.listHand();
hand.forEach((card) => {
  if (card.canPlay()) {
    card.play();
  }
});
```

The `api.listHand()` method returns an array of card objects. Each card object has methods like `canPlay()` and `play()`. From the player's perspective, they're working with a normal JavaScript API.

### How They Connect

The key is in how these two layers connect. I use `ivm.Callback` to register functions that can be called from inside the isolate:

```ts
// Simplified concept
const callback = new ivm.Callback((cardId: string) => {
  return engine.executePlay(gameState, cardId);
});
```

When code inside the isolate invokes this callback, the function executes in the host context with full access to the game engine. The return value gets cloned back into the isolate.

But I don't just register callbacks and expose them directly. That would leak implementation details and create security holes. Instead, I generate code that builds a proper API using these callbacks -- then hides them.

## Building APIs with Code Generation

### The API Builder DSL

I didn't want the sandbox to know anything about the game itself. The engine should define what the API looks like, and the sandbox should figure out how to expose it.

I created a declarative builder DSL for defining APIs:

```ts
new APIBuilder()
  .method("me", () => getPlayerSnapshot(state, player))
  .method("opponent", () => getPlayerSnapshot(state, opponent))
  .arrayMethod("listHand",
    () => getHand(state, player),
    cardItemBuilder
  )
  .arrayMethod("listBoard",
    () => getBoard(state, player),
    cardItemBuilder
  );
```

The builder captures two things: the structure of the API (method names, whether they return arrays, etc.) and the callbacks that implement each method.

### The API Interpreter

The sandbox receives this API definition and needs to make it real inside the isolate. The `APIInterpreter` class handles this through code generation. Let's walk through each step.

#### Step 1: Register Callbacks

First, each callback from the API definition is registered with the isolate using `ivm.Callback`. Each callback gets a unique ID:

```ts
async function registerCallbacks(
  apiRef: ivm.Reference,
  definition: APIDefinition
): Promise<void> {
  for (const [callbackId, handler] of definition.callbacks) {
    // Wrap the handler in ivm.Callback so it can be called from inside the isolate
    await apiRef.set(`_${callbackId}`, new ivm.Callback(handler));
  }
}
```

After this step, the `api` object inside the isolate has properties like `api._cb_0`, `api._cb_1`, etc. -- each one a bridge back to the Node.js handlers.

#### Step 2: Generate API Construction Code

Next, I generate JavaScript code that will run inside the isolate to build the actual API. For simple methods, this is straightforward:

```ts
function generateSimpleMethod(methodName: string, callbackId: string): string {
  return `api.${methodName} = function(...args) {
    return deepFreeze(_${callbackId}(...args));
  };`;
}
```

Array methods with item builders are more interesting. The generated code needs to transform each item in the array, attaching methods to each one:

```ts
function generateArrayMethodCode(
  methodName: string,
  listCallbackId: string,
  dataCallbackId: string,
  itemMethods: Map<string, string>
): string {
  // Generate the method attachment code for each item
  const methodLines = Array.from(itemMethods.entries()).map(
    ([name, callbackId]) =>
      `obj.${name} = function(...args) { return deepFreeze(_${callbackId}(item, ...args)); };`
  );

  return `
    api.${methodName} = function(...args) {
      const items = _${listCallbackId}(...args);
      return items.map(function(item) {
        const obj = _${dataCallbackId}(item);
        ${methodLines.join("\n        ")}
        return deepFreeze(obj);
      });
    };
  `;
}
```

Notice how `item` is captured in the closure for each method. When the player calls `card.play()`, the generated function already knows which card it's operating on.

#### Step 3: Execute and Clean Up

Everything gets wrapped in an [IIFE](https://developer.mozilla.org/en-US/docs/Glossary/IIFE). The callback references are captured as local variables, deleted from the accessible `api` object, then the API is frozen:

```ts
function generateAPICode(definition: APIDefinition): string {
  const lines: string[] = ['"use strict";', "(function() {"];

  // Capture all callbacks as local variables
  for (const callbackId of definition.callbacks.keys()) {
    lines.push(`const _${callbackId} = api._${callbackId};`);
  }

  // Generate code for each method
  for (const [methodName, methodDef] of definition.methods) {
    lines.push(generateMethodCode(methodName, methodDef));
  }

  // Delete the callback properties from the api object
  for (const callbackId of definition.callbacks.keys()) {
    lines.push(`delete api._${callbackId};`);
  }

  lines.push("Object.freeze(api);", "})();");
  return lines.join("\n");
}
```

The key insight: callbacks are captured in local variables, then deleted from `api`. The closures still work (they reference the local variables), but user code can't access the raw callbacks.

### A Peek at the Generated Code

The generated code looks something like this:

```ts
(function() {
  // Capture callback references
  const _cb_me = __internal._cb_0;
  const _cb_listHand = __internal._cb_1;
  const _cb_cardData = __internal._cb_2;
  const _cb_canPlay = __internal._cb_3;
  const _cb_play = __internal._cb_4;

  // Build the API
  api.me = function() {
    return deepFreeze(_cb_me());
  };

  api.listHand = function() {
    const items = _cb_listHand();
    return items.map(function(itemRef) {
      const card = _cb_cardData(itemRef);
      card.canPlay = function() {
        return _cb_canPlay(itemRef);
      };
      card.play = function(targetId) {
        return deepFreeze(_cb_play(itemRef, targetId));
      };
      return deepFreeze(card);
    });
  };

  // Delete internal references
  delete __internal._cb_0;
  delete __internal._cb_1;
  // ... etc

  // Freeze the API
  Object.freeze(api);
})();
```

The callbacks are captured in the closure, then their references are deleted from any accessible object. By the time user code runs, there's no way to access the raw callbacks -- only the properly-wrapped API methods.

## Security Considerations

Security isn't one thing you get right. It's layers of protection that work together.

### Process Isolation

The foundation is V8's isolate architecture. Each isolate is a separate heap with its own globals. There's no `require()`, no `process`, no `fs`. The only things that exist in the isolate are whatever's explicitly defined there.

```ts
// These don't exist inside the isolate
require("fs").readFileSync("/etc/passwd"); // ReferenceError
process.env.DATABASE_URL;                  // ReferenceError
global.constructor.constructor("...")();   // No escape via constructor
```

### API Hardening

On top of process isolation, I also hardened the API layer to prevent users from shooting themselves in the foot:

**Callback cleanup**: Internal callback IDs are deleted after API construction, but before running user-provided code. There's no way to enumerate or access them.

**Deep freezing**: Every object returned from the API is recursively frozen with `Object.freeze()`. Players can't modify returned data to corrupt game state.

**Fresh contexts**: Each script execution gets a fresh context. Global variables don't persist between turns. A script can't set up state that affects future executions.

### Testing

The test suite includes security-focused tests:

```ts
// Verify internal callbacks aren't exposed
expect(result.hasUnderscoreCb).toBe(false);
expect(result.apiHasUnderscore).toBe(false);

// Verify callbacks can't be enumerated
expect(result.canEnumerate).toBe(false);
expect(result.hasOwnProperty).toBe(false);

// Verify prototype chain attacks don't work
expect(result.protoAccess).toBe(undefined);
```

These tests verify that internal properties are properly hidden, that enumeration attempts fail, and that there's no state leakage between executions.

## Patterns and Lessons Learned

### Variant Item Builders

Not all cards work the same way. Some cards require a target when played (like "deal 3 damage to a minion"), while others don't (like "draw 2 cards"). This means the `play()` method needs different signatures:

```ts
// Targeted card
fireball.play(targetId);

// Untargeted card
arcaneIntellect.play();
```

I solved this with variant item builders. The API definition includes multiple variants and a selector function that chooses which variant to apply to each item:

```ts
.arrayMethod("listHand",
  () => getHand(state, player),
  {
    variants: {
      targeted: targetedCardBuilder,
      untargeted: untargetedCardBuilder,
    },
    selector: (card) => card.requiresTarget ? "targeted" : "untargeted"
  }
)
```

The generated code checks each card at runtime and applies the appropriate methods.

### Compilation Pipeline

Players can write TypeScript or JavaScript. The sandbox supports both through a two-stage compilation pipeline:

1. **esbuild**: Compiles TypeScript to JavaScript (fast, handles modern syntax)
2. **isolated-vm**: Compiles JavaScript to V8 bytecode

```ts
// Stage 1: TypeScript → JavaScript
const jsCode = await esbuild.transform(playerScript, {
  loader: "ts",
  target: "es2020",
});

// Stage 2: JavaScript → V8 Script
const script = await isolate.compileScript(jsCode);
```

This gives players the ergonomics of TypeScript with the security of isolated execution.

## The Complete Flow

Here's how it all comes together during a match:

1. **Compilation**: When a match starts, the worker compiles each player's script using `createPlayerScript()`. This creates an isolate with memory limits and compiles the code to V8 bytecode.

2. **Turn execution**: Each turn, the engine creates a fresh `EngineContext` containing the current game state and available actions.

3. **API construction**: The sandbox's `APIInterpreter` builds the `PlayerAPI` inside the isolate using the engine context's callbacks.

4. **Script execution**: The player's compiled script runs. It calls methods like `api.listHand()` and `card.play()`.

5. **Callback invocation**: When the script calls API methods, callbacks execute in the engine context (outside the isolate) and return frozen data.

6. **Cleanup**: After the match ends, `playerScript.dispose()` frees the isolate and all associated memory.

## Results and Reflections

### What Worked Well

**Complete decoupling**: The sandbox package knows nothing about cards, game rules, or the specific API. It just knows how to expose any API defined via `APIBuilder`. This architecture could be reused for completely different purposes.

**Zero game-specific code**: The sandbox is roughly 150 lines of core code. All the game-specific logic lives in the engine where it belongs.

**Type safety**: Despite all the dynamic code generation, I maintain full TypeScript type safety. The `APIBuilder` is generic and produces typed definitions. Players get autocomplete in their editor.

### What Was Tricky

**Callback lifecycle**: Getting the timing right -- registering callbacks, generating code, deleting references, then running user code -- required careful thought. Race conditions or ordering bugs would create security holes.

**Debugging generated code**: When something goes wrong in generated code, stack traces point to code that doesn't exist in any source file. I added source annotations to make debugging easier.

**Edge cases in API shapes**: Arrays of objects with methods that return arrays of objects with methods... the code generation needed to handle arbitrary nesting.

### Performance

Isolate creation has overhead -- roughly 10ms. But creating a context within an existing isolate is fast. I reuse isolates across turns, only creating fresh contexts for each execution.

For a game where matches might last 20+ turns, that initial 10ms is negligible. The per-turn overhead is in the low milliseconds.

## Conclusion

Building a secure sandbox for untrusted code is hard, but `isolated-vm` provides a solid foundation. A few key takeaways:

**True isolation matters**: V8 isolates give you real security guarantees that `vm` and `vm2` can't. When security is non-negotiable, start with the strongest primitive available.

**The two-layer pattern is reusable**: Separating primitive callbacks (crossing the boundary) from rich APIs (built inside the sandbox) is a pattern that works for any sandboxing scenario. It gives users a good experience while maintaining security.

**Defense in depth**: Process isolation, callback cleanup, deep freezing, fresh contexts -- each layer catches things the others might miss.

The result is a system where players can write expressive, natural JavaScript to control their bots, while I maintain complete control over what that code can actually do.
