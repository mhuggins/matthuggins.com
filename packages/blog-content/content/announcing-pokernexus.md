---
title: "Announcing PokerNexus: The Social Network for Poker Players"
date: 2026-09-21
published: true
tags: [typescript, react, node.js, graphql]
summary: "PokerNexus is live on the web, the App Store, and Google Play. It's a free social network built for poker players: a feed, forums, direct messages, a directory of US card rooms and their schedules, and equity and ICM calculators whose results post as live cards. Here's what's in it, and how it's built."
image: /blog/announcing-pokernexus.jpg
thumbnail: /blog/announcing-pokernexus.thumb.jpg
---

[PokerNexus](https://pokernexus.com) is live. It's a social network built for poker players, and it's 100% free.

- Create a profile with a unique handle
- Explore a feed of nothing but poker
- Browse longer conversations in the forums
- Send private direct messages to friends
- Organize home games in managed chatrooms
- Stay aware of ongoing tournaments via the built-in directory of card rooms and the events they're running
- Leverage the equity and ICM calculators, sharing the results directly in your posts

PokerNexus runs in any modern browser, and it's on the [App Store](https://apps.apple.com/app/id6800184564) and [Google Play](https://play.google.com/store/apps/details?id=com.pokernexus.app) using the same account across all three.

This post covers why I built it, what it does, and how it's put together.

## Why build PokerNexus

Building software and playing poker are the two hobbies I've spent the most of my life on. I played for a living for a year in my younger days, and more recently created [HuggiePoker](https://www.youtube.com/@HuggiePoker), a vlog about my poker sessions and strategy. I've tinkered with some poker-themed software development ideas over the years, but never before on this scale.

Poker conversation is scattered. Some of it happens on general-purpose feeds, where a hand history sits between a political argument and a photo of someone's lunch, and where the people who care about the game are just a small subset of the audience. Some of it happens on forums that have been running for twenty-some years, several of which are poorly maintained. The tooling lives somewhere else entirely, in a calculator tab you might screenshot to paste into a post.

None of those are broken, but they're just not built with the game in mind. A post about a hand wants to name the players in it, tag the room it happened in, and carry a solved equity result that the reader can open and check. A general-purpose feed has no idea what any of those things are.

PokerNexus is intentionally focused on poker. The shape of a post reflects what a poker post actually is.

This idea had been kicking around on and off for years, and in May, I finally started building it as it exists today. I registered PokerNexus LLC, spent a decent chunk of money getting policy documents for the service drafted by a lawyer, and waited oh-so-long for the slow App Store and Google Play app approval process.

## What's in PokerNexus

**A feed in three views.** "For You" blends the people you follow with what's drawing attention elsewhere, "Discover" surfaces players you haven't found yet, and "Following" shares only the accounts you've already expressed interest in. Posts carry photos, name the players in a hand, and tag the venue and topics they're about.

**Forums, for when a feed isn't the right shape.** Threads and replies, the way a question that needs a real answer deserves to be handled.

**Direct messages**, one to one or as a small group, with the realtime bits you'd expect: typing indicators, read state, push notifications on both platforms.

**Chatrooms**, providing built-in moderation with invite-only controls, useful for organizing home games and discussing strategy with larger groups.

**Profiles you control.** A private account turns new followers into requests you approve one at a time, and it doesn't hide your name or handle, only your posts, your followers, and who you follow. Blocking and reporting sit on every byline, thread, and room. If you've got a Hendon Mob, WSOP, or WPT profile, you can link it.

**Two calculators, free without an account.** An equity calculator covering Hold'em, Omaha, Pineapple, and Stud, and an ICM calculator for the chip-to-money end of a tournament. Both are built on my own [poker-apprentice](https://github.com/poker-apprentice) packages, which have been on npm for a while and now have a real product sitting on top of them. The part I care about is where a result goes: solve a spot in the composer and it attaches to the post as a card showing the cards, the board, and the numbers, and anyone reading can open it and change a card to see what happens.

**A room directory and a live schedule.** Close to two hundred US card rooms across twenty-nine states and growing, each with an address you can navigate to, and the hours and games filled in as we confirm them. Sort by distance, filter by game, stakes, or open right now, and follow the rooms you play. Beside it, the schedule lists tournaments and series in date order, from what's running this minute to what's on next week, filterable by buy-in, guarantee, or game. A series can be subscribed to as a calendar feed, so the whole run lands in your calendar as one subscription. Venue staff can be given access to keep their own page straight.

One thing worth stating plainly, since the subject invites the assumption: PokerNexus is not a card room and not a gambling service. There's no game on it at all, no real-money play, no play money, no wagering, and no prizes. When a tournament is named on the site or app, it's one running at an independent room, described so you can go play it there.

## How PokerNexus is built

It's a [pnpm and Turborepo monorepo](/blog/posts/pnpm-makes-monorepos-effortless), which at this point I reach for without thinking about it. I wrote about [why pnpm makes that painless](/blog/posts/pnpm-makes-monorepos-effortless) a year ago and nothing since has changed my mind.

**One codebase reaches all three platforms.** The client is a TanStack Start app rendered on the server for the web, and the same build is wrapped by Capacitor for the iOS and Android shells. That means a feature is written once. It also means the shells are a real target rather than an afterthought: the native builds compile against the production origins on the command line, because an installed app has no environment to read and a build that quietly inherits localhost is wrong in a way nothing reports until it reaches TestFlight.

**The API is Hono, GraphQL Yoga, Pothos, and better-auth**, over Prisma and PostgreSQL. The schema is defined in code with Pothos, printed to an SDL artifact, and code generated into typed documents and hooks that the client consumes. That's the approach I described in [One Schema, Two Codegens](/blog/posts/typing-graphql-across-client-and-server), and the request context is shaped the way I laid out in [Structuring the GraphQL Request Context](/blog/posts/structuring-the-graphql-request-context): a resolved current user, the shared data layer, and a fresh set of DataLoaders per request.

**Background work is its own process.** BullMQ workers handle push delivery, email, image processing, and the rest, deployed as two services off one image so that a heavy job blowing its heap can't take push notifications down with it. Realtime updates go over Redis pub/sub behind a server-sent events stream.

**The UI is Base UI and Tailwind**, on design tokens, with TanStack Query for data and TanStack Form underneath every form on the site. Most of what I've written about forms over the past year came out of building this: the [component library patterns](/blog/posts/building-a-reusable-form-component-library-with-tanstack-form), [multi-step validation](/blog/posts/multi-step-form-validation-with-tanstack-form), and the [pitfalls I hit along the way](/blog/posts/avoiding-tanstack-form-pitfalls) are all in production here.

**Embeds are a registry rather than a special case.** An equity result, an ICM result, and a poll each declare a payload schema, a composer, and a card, and the composer and the renderer look them up. Adding a third tool means adding a package, not editing the post composer.

The whole thing deploys with the service topology checked into the repo, alongside a separate shortlink host for printed links, which is deliberately not claimed by the mobile apps so that a link on a flyer can still reach a store listing on a phone that doesn't have the app yet.

## Go sign up

Registration is open! There's no invite code and no waitlist anymore, and there's nothing to buy. Pick a handle at [pokernexus.com](https://pokernexus.com), or grab it on [iOS](https://apps.apple.com/app/id6800184564) or [Android](https://play.google.com/store/apps/details?id=com.pokernexus.app), and come talk poker. If something breaks, I'd genuinely like to hear about it: <support@pokernexus.com>.
