---
layout: post
title: "What 99 Bottles Taught Me About Prompting"
date:   2026-08-28 10:00:00
tags:
  - AI / Machine Learning
  - Best Practices
summary: "A workshop showed the right constraints can make a room full of non-deterministic developers converge on nearly identical solutions. How can this apply to coding agents?"
---

A few years ago I spent a several days in a workshop led by Sandi Metz and Avdi Grimm working through the 99 Bottles exercise. The premise is simple: write code that prints the lyrics to "99 Bottles of Beer" then refactor it under a series of constraints (primarily [SOLID](https://en.wikipedia.org/wiki/SOLID)). The main takeaway wasn't the exercise itself, it was what happened across the room. Dozens of developers, working in small groups, kept arriving at nearly identical solutions.

That's not supposed to happen. Ask five developers to solve the same problem and you get five different answers, usually more. This was even proven initially on in the workshop with the same group of developers. But once those people were given the right constraints, and the space of reasonable solutions collapsed. Not because anyone was told what to write, but because the guidelines made certain choices obviously better than others.

I have often thought back to that workshop throughout my career and lately I have been running into the same dynamic with coding agents.

When I'm working with a coding agent on something nontrivial, I'm not writing the code anymore. I'm describing what I want and reviewing what comes back. That's a different job than the one I trained for, and for a while I treated it like prompting was just clearer writing: be specific, give examples, state the goal. That helps, but it doesn't solve the actual problem.

The actual problem is the same one we had in the workshop before we worked thorugh various SOLID exercises. Left on its own, an agent will make a long string of small, reasonable-sounding design decisions, and there's no guarantee any two runs make the same ones. In a single function that's barely noticeable. In a system with any size to it, those decisions compound. A class that should have been split doesn't get split. A dependency goes in the wrong direction. Nothing is wrong on its own, but the shape of the thing gets harder to reason about with every change.

I don't think this is the same mechanism as a room full of developers converging on an answer. An agent isn't having an insight the way a person does mid-workshop. But the outcome I'm after is the same one Sandi Metz's exercise produced: less arbitrary variation, and code that's easier to read, extend, and trust. If the right constraints got there with people, it's worth finding out what the equivalent is for agents.

So what are the right constraints? I don't think it's a list of rules to paste into a system prompt. It's closer to a question: is this something a deterministic tool can already catch?

If the answer is yes, that's not where my instructions should be spending effort. A linter knows when a line is too long. A formatter knows where the whitespace goes. A static analyzer can flag unused variables, cyclomatic complexity, dead code, functions that have grown too long. These tools are fast, consistent, and don't need to be convinced of anything. When I see people writing detailed prompt instructions telling an agent how to shape code, keep functions short, keep nesting shallow, that's the kind of thing these tools already enforce. It feels like the agent should just know, but it's a misallocation. You're spending judgment-shaped effort on a problem that's already solved by something deterministic.

The constraints that actually move the needle are the ones a static tool can't evaluate, because they require understanding _intent_. Does this class have one reason to change, or three? Does this abstraction model the actual problem, or just the first version of the problem? Is this dependency pointing the direction it should, or did it end up backwards because that was the path of least resistance? SOLID principles, the kind of OOP design judgment that took me years to internalize, that's the stuff that's hard to statically analyze and exactly the stuff worth putting in front of an agent.

This is roughly the same split that showed up in the 99 Bottles workshop, even if nobody phrased it that way. The exercise wasn't about syntax or style, every solution could've been auto-formatted into agreement. It was about design choices: where responsibility lives, how much duplication is acceptable, when an abstraction is earning its keep. Those are the choices that are hard to specify cleanly and easy to get wrong, which is exactly why they're worth being deliberate about.

I can't tell you this approach is faster, or that it cuts token usage, or any other number that would make this tidy. I haven't run that experiment, and I'd be skeptical of anyone who claims they have without showing their work. What I can tell you is what I've noticed: when I take the time to put design-level constraints in front of an agent instead of just describing the feature, I get a better first answer more often. Not perfect, but closer, in a way that means less back and forth before I'm willing to trust it.

That trust matters more than it sounds like it should. A lot of the friction in working with agents isn't the time it takes to generate code, it's the time it takes me to decide whether the code is right. Code that already reflects sound design is faster for me to review, because I'm not untangling the structure before I can even evaluate the logic. It's the same reason the 99 Bottles solutions were easy to compare across groups. Once everyone's working from the same design principles, the differences that remain are the ones worth talking about.

This matters more as the loop changes shape. The more engineers have moved into a human-in-the-loop role, reviewing and steering rather than writing every line, the more agents are operating without someone looking over their shoulder in real time. If the guidelines live in a prompt I type fresh each session, that's fragile, it depends on me remembering to say it again. If they're codified somewhere the agents actually read, a CLAUDE.md/AGENT.md, a project's style and architecture guide, whatever the equivalent is in your setup, then every agent working in that system picks them up without me having to ask. That's closer to what happened in the workshop than the one-off prompting is. Nobody had to keep reminding the room of the constraints once they were set. The room just worked within them.

I don't think this makes agents smarter. I think it removes some of the noise around decisions that were never going to be hard for a human reviewer to make, by making sure they don't have to be made arbitrarily in the first place.
