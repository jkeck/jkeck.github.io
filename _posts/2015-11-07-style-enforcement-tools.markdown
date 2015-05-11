---
layout: post
title:  "Using Style Enforcement Tools"
date:   2015-11-07 20:00:00
header: '/images/rubocop-linter.png'
tags: RuboCop SCSS-Lint JSHint Testing
---

<blockquote>
  <p>I have had individual developers complain to me about the usage of a style guide and I'll be honest, it boggles my mind. If you find negative value in adhering to a style guide, what you're saying is that your preferences are more important than the health of the codebase over time. Yes, I believe adherence to a style guide produces a healthy codebase.</p>
  <footer>
    BJ Neilsen in
    <cite title='http://localshred.github.io/consistency.html'>
      <a href='http://localshred.github.io/consistency.html'>Consistency</a>
    </cite>
  </footer>
</blockquote>

I have started to regularly implement linters and style enforcement tools into my development practices. I have found this to be **extremely** helpful to my growth as a developer. I write cleaner and more idiomatic code when using a linter. The process of fixing violations in my own code has made me really think about the design of my software in general. I find that implementing these tools as a development team is less about enforcing a particular style and more about defining and enforcing the team's agreed upon style.

## Implementing style enforcement tools

There are various degrees to which you or your team can implement style enforcement tools. In many of the cases below I'll use RuboCop as an example, but many of the concepts are universal.

### Running the tool locally

The very lowest level of implementation is to simply run the tool locally yourself. This makes particular sense when contributing to a piece of software that may not implement a style enforcement tool itself.  If you're working with ruby you can simply install the RuboCop gem `$ gem install rubocop` and run the linter in your project `$ bundle exec rubocop`.

In addition to simply using the tool on the command line most text editors have plugins to implement linters for most major languages. There are naturally various pros and cons to each of the plugins based on your personal style and the plugin's flexibility. The main benefit that the plugins provide is a way for you to know that you have made a style violation while you're editing a file.

![RuboCop Editor Output](/images/rubocop-editor-output.png)

### Adding as a dependency

The next level of integration is to add the tool as a dependency of your project. In the case of RuboCop this would most likely involve checking in a config file (typically `.rubocop.yml`). This config file is where the developers can define their agreed upon style. Tools like RuboCop even allow inheriting from remote configuration files which can be helpful in larger organizations.

At this point there is an agreed upon style and developers should keep to it. How they run the tool is up to them and it is on the developers to police themselves.

### Enforcing in CI

On the more extreme level of integration you can enforce the configured style guide in test suites and continuous integration. There are services like [HoundCI](https://houndci.com) that can be used to run linters externally and comment on GitHub pull requests. It can enforce community style guides for many languages such as Ruby (RuboCop), Javascript (JSHint), SCSS (SCSS-Lint), and others.

![HoundCI comment](/images/hound-comment.png)

You can also add the style enforcement to your local test suite itself.  This can be used to ensure that any style violations introduced fail the build entirely.  RuboCop ships with a rake task to run the linter and exit with an error code when style violations are found.

## Implementing in an existing project

Implementing style enforcement tools in an exiting project can have some unique challenges. RuboCop has a handy auto-fix feature `$ rubocop -a` where it will fix a variety of violations that are safe to do in an automated manner. This can save a lot of the technical overhead to implementing a style enforcement tool. I like to then go through and address a suite of other simple violations that I feel comfortable doing without consequence (line length, indentation, etc).

Once RuboCop has auto-fixed what it can, and you have made any simple changes to address other issues, you can then use RuboCop's `--auto-gen-config` option. This creates a `.rubocop_todo.yml` file which can be inherited from in the main `.rubocop.yml` file. This file configures RuboCop to set the threshold and exceptions based on the current codebase. This allows the RuboCop linter to run without any violations with the code in its current state, which means you can add it to your build without causing it to fail every time.

This `.rubocop_todo.yml` file will do things like set the line length to the longest line in your codebase as well as other baselines and exceptions. This is nice in that it won't let anybody introduce code that exceeds those thresholds. One caveat however is that developers can still add code that is at or just below that threshold. This can in-turn add more debt in your way to getting the threshold down to a more acceptable level or removing the exception entirely.

When moving forward with development you can refactor existing classes that need to be worked on and re-generate the `.rubocop_todo.yml` file. The goal is to only commit reductions in thresholds and exceptions in the todo file until it can be removed entirely.

## Conclusion

Introducing linters and style enforcement tools into your development practice is an excellent way to increase your code quality and keep your best practices up to date with the community. They can be used as a tool for development teams to define and adhere to the style of their choosing. A project that defines and adheres to the community style is a likely indication (although not guaranteed) that the software will be easy to jump in, understand, and work with.
