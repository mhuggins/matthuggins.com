---
title: Step-by-Step Guide to Building Your First Ruby Gem
date: 2014-03-08
tags: [ruby]
summary: Building your first Ruby gem may seem like a daunting task, but it's actually not so bad. It's quite rewarding to not only release a gem, but to see its download count climb as others put your hard work to good use, and even still as others offer to contribute new features and bug fixes to your very own gem. And thanks to RubyGems.org and Bundler, the process of creating, releasing, and implementing gems couldn't be easier.
---

Building your first Ruby gem may seem like a daunting task, but it's actually not so bad.  It's quite rewarding to not only release a gem, but to see its download count climb as others put your hard work to good use, and even still as others offer to contribute new features and bug fixes to your very own gem.  And thanks to [RubyGems.org](https://rubygems.org/) and [Bundler](https://bundler.io/), the process of creating, releasing, and implementing gems couldn't be easier.

## What is a gem?

A gem is essentially a Ruby plugin.  Before digging into gems though, let's look at some history.

The concept of Ruby plugins actually predates the concept and implementation of Ruby gems.  However, plugins of the past required the full code hierarchy to be included directly into your own project, committed to source and all.  Updating plugins was a manual process as well, where the updated code would have to be downloaded and extracted atop the previous version in your project.  Due to the lack of automation, propensity for mistakes, and potential for developers to modify plugin code as a result of it being included in the code base, this is less than ideal.

Ruby gems makes life much, much easier.  Rather than including third party code directly into your application, you just reference the name (and optionally version) of the gem you want to use.  Generally speaking, Bundler acts as a package manager by determining the full set of direct dependencies needed by your application, as well as sub-dependencies needed by those first-level dependencies.  The code for required gems is still downloaded to your system, but it is kept separate from your application in the sense that it does not have to be maintained in source control.  The only aspect of gems that you'll have to manage is the list of names within a special file, known as a `Gemfile`.

## Why gems?

Before we get into the "how" of creating a gem, let's first consider why you might want to do so.  One of the most obvious reasons relates to code reuse.  If you find yourself implementing the same feature over and over again across projects, there's a good chance that you've found the need for a gem.

Assuming that code will be reused prior to doing so is generally not the best deciding factor for diving in and building a gem.  However, there are cases where the you might consider doing so.  Take for example a web service with a public API.  In order to encourage potential users to consume your service, you might consider releasing a gem that acts as a client for your API, thereby reducing the barrier to entry.

Additionally, releasing a gem as open-source provides others the opportunity to contribute by adding features, addressing issues that you might have overlooked, and generally making your gem provide an all-around better experience for its users.  This is especially true for topics that require deep domain knowledge, such as security and encryption.

Lastly, you might consider releasing a gem to demonstrate your abilities as a developer.  Whether you consider it good or bad, some companies and recruiters have been using Github to find developers.  Other developers might individually reach out to you based upon your coding contributions as well.  (Both have happened to me on numerous occasions!)  Let Github act as a portfolio for your coding skills.

## Learning by example

If you've come this far and you feel like building a gem is still worth pursuing, then let's get started.  You'll need to make sure you have the [bundler](https://rubygems.org/gems/bundler) gem installed.

```bash
$ gem install bundler
```

Now that bundler is installed, you just need to select the name of your gem.  For mine, I'll be going with "dogeify".  My gem will take everyday English text and convert it into [doge](https://en.wikipedia.org/wiki/Doge_(meme)).

```bash
$ bundle gem dogeify
```

This creates the "dogeify" directory with the bare minimum gem structure, as follows.

```bash
$ tree dogeify
dogeify
├── .gitignore
├── Gemfile
├── LICENSE.txt
├── README.md
├── Rakefile
├── dogeify.gemspec
└── lib
├── dogeify
│   └── version.rb
└── dogeify.rb
```

Let's first look at the gemspec file (`dogeify.gemspec` in this case).  This file provides metadata about the gem, such as the name, description, author, license, and any gem dependencies required for it to work.  It also provides path information that specifies what files to include when packaging, as well as updating the load path to include this directory when the gem is first loaded so that absolute paths are not needed when requiring any of your gem's files.

```ruby
# coding: utf-8
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'dogeify/version'

Gem::Specification.new do |spec|
  spec.name          = "dogeify"
  spec.version       = Dogeify::VERSION
  spec.authors       = ["Matt Huggins"]
  spec.email         = ["matt.huggins@gmail.com"]
  spec.description   = %q{Convert everyday boring English into doge speak!}
  spec.summary       = %q{English to doge translations}
  spec.homepage      = ""
  spec.license       = "MIT"

  spec.files         = \`git ls-files\`.split($/)
  spec.executables   = spec.files.grep(%r{^bin/}) { |f| File.basename(f) }
  spec.test_files    = spec.files.grep(%r{^(test|spec|features)/})
  spec.require_paths = ["lib"]

  spec.add_dependency 'engtagger';

  spec.add_development_dependency 'bundler', '~> 1.3'
  spec.add_development_dependency 'rake'
  spec.add_development_dependency 'rspec'
end
```

The first grouping of lines (assigning `name`, `version`, `authors`, etc.) are relatively straightforward string (and array of string) assignments, so I won't dive into those beyond pointing out that they exist.

The next group of lines (assigning `files`, `executables`, `test_files`, and `require_paths`) are generated automatically.  Most of the time, you won't need to touch these lines.  However, if you have additional folders that contain binary files or testing files, then you'll need to update the appropriate lines so that code is run and/or packaged properly.

The last groups of lines (referencing `add_dependency` and `add_development_dependency`) will likely require customization, depending on your gem.  Bundler and rake are included as development dependencies automatically, and any additional gem requirements can be added per your need.  A development dependency is something that is needed during development or testing (e.g.: the `rspec` gem that I added for dogeify), while a dependency -- also known as a runtime dependency via `add_runtime_dependency` -- is something that is required by your gem at runtime.  When your gem is included in a third party application, it will tell Bundler to also install all runtime dependencies, while all development dependencies are ignored.

Now that we're familiar with the gemspec, let's take a look at `lib/dogeify.rb` and `lib/dogeify/version.rb`.  These two files are initially very simple.  Let's start with `version.rb`.

```ruby
module Dogeify
  VERSION = "0.0.1"
end
```

This file contains nothing more than the version number encapsulated in the gem's base module.  As updates are released, it's necessary to update the version number here to reflect the latest available version on RubyGems.org.  It's considered a best practice to follow [semantic versioning](https://semver.org/).  In short, what this means according to semver.org:

> 1. MAJOR version when you make incompatible API changes,
> 1. MINOR version when you add functionality in a backwards-compatible manner, and
> 1. PATCH version when you make backwards-compatible bug fixes.
>    Additional labels for pre-release and build metadata are available as extensions to the MAJOR.MINOR.PATCH format.

Let's now take a look at `dogeify.rb`.

```ruby
require "dogeify/version"

module Dogeify
  # Your code goes here...
end
```

This is the file that is first loaded by default when your gem is required by Bundler.  It initially contains nothing more than a reference to the version file from above along with an empty module definition.  As you begin coding, this file will either grow in terms of code or grow in terms of requires (or both).

For smaller gems (e.g.: a few simple methods), you might end up adding all your code to this file.  For larger gems (e.g.: difficult verbose processing; multiple internal or external classes), you'll likely want to separate your code into multiple files, requiring them from this file similar to how `version.rb` is required.  It's also important to note that despite our gem being defined as a module, you're free to change this to a class.  Note though that changing this from a module to a class in this file also requires other files referencing `Dogeify` to be updated as well.

Now that we have our bearings, let's dive in.  Remember, the goal of Dogeify is to take an English string and convert it to Doge-speak.  That's really just one simple method that accepts a string and returns a string.

```ruby
require "dogeify/version.rb"

module Dogeify
  def self.process(str)
    # TODO: process \`str\`
    str
  end
end
```

Now we have to ask an important question that impacts the heart of how our gem works: _how_ are we going to process the text?  After doing a bit of research on [Doge linguistics](https://the-toast.net/2014/02/06/linguist-explains-grammar-doge-wow/), we can see there are a few main facets of the "language":

- Everything is lowercased
- Limited set of adjectives generally used: so, such, many, much, very
- Short 2-3 word sentences combining above adjectives with nouns: so sweater, such montage
- Single words summarizing emotion: wow, amaze, excite
- Slight misspellings: doge, plz

For the sake of simplicity, let's just apply a small subset of these rules to our gem:

- Convert input to lowercase
- Extract nouns, prefixing each with one of the above adjectives into sentences of 2 words
- End every input with "wow"

## Writing tests first

Since Quick Left practices test-driven development (TDD), let's start by writing some tests for the above conditions.  I'm a fan of [RSpec](https://rspec.info/), so my example tests will be using that [DSL](https://en.wikipedia.org/wiki/Domain-specific_language).  (Feel free to use your testing platform of choice when writing your own gem.)  First, the `rspec` gem will need to be included by adding a call to `add_development_dependency` in `dogeify.gemspec`:

```ruby
Gem::Specification.new do |spec|
  # code snipped ...

  spec.add_development_dependency 'rspec'
end
```

Next we'll create a top-level `spec` directory in our gem with the following structure:

```bash
spec
├─ dogeify_spec.rb
└─ spec_helper.rb
```

The `spec_helper.rb` file will be relatively simple for our needs, but this file is a good place to reference any test globals or configuration.  Regardless of the level of simplicity or complexity in your test suite's setup, we'll always need the gem to be loaded from this file.

```ruby
require 'dogeify'
```

The `dogeify_spec.rb` file will host all the tests for the `Dogeify#process` method, which is the meat of our gem.  These tests should cover the linguistics points we outlined previously that our gem will cover.

```ruby
require 'spec_helper'

describe Dogeify do
  subject { Dogeify.new }

  describe '#process' do
    let(:input) { 'My grandmom gave me a sweater for Christmas.' }
    let(:output) { subject.process(input) }

    it 'converts to lowercase' do
      expect(output.downcase).to eq output
    end

    it 'combines nouns with doge adjectives' do
      expect(output).to match /so grandmom./i
      expect(output).to match /such sweater./i
      expect(output).to match /very christmas./i
    end

    it 'always appends "wow."' do
      expect(output).to end_with 'wow.'
    end
  end
end
```

Finally, we need to make the `rspec` rake task available.  To do this, we _could_ modify the `Rakefile` that Bundler provided automatically.  However, adding tasks directly to this file can lead to bloat, which is why I prefer to set up a separate `tasks` folder.  For now, this folder will only host one file, which we'll call `rspec.rake`.

```ruby
require 'rspec/core/rake_task'

RSpec::Core::RakeTask.new(:spec)
```

Don't worry too much about this code, as it's basically [lifted straight from the RSpec docs](https://www.relishapp.com/rspec/rspec-core/v/3-0/docs/command-line/rake-task).

In order for rake to be aware of these tasks though, we will need our `Rakefile` to import any files in the new directory.  This can be done by adding a one-liner to this file:

```ruby
Dir.glob('tasks/**/*.rake').each(&method(:import))
```

Running `bundle exec rake spec` will show us 3 failing tests.  Success!

## Implementing functionality

Now that we have some failing tests added to our test suite, let's write some code to make them pass.

After a bit of searching on natural language processing, possible services, and existing plugins, I decided to go with the [engtagger gem](https://github.com/yohasebe/engtagger).  To use this gem, we'll need to first reference it by calling the `add_dependency` method in `dogeify.gemspec`:

```ruby
Gem::Specification.new do |spec|
  # code snipped ...

  spec.add_dependency 'engtagger'
end
```

We can now dive back into the `Dogeify.process` method we stubbed out earlier.

```ruby
require 'dogeify/version'
require 'engtagger'

class Dogeify
  ADJECTIVES = %w(so such very much many).freeze

  def initialize
    @tagger = EngTagger.new
  end

  def process(str)
    # Convert input to lowercase.
    str = str.downcase

    # Extract nouns, prefixing each with one of the
    # above adjectives into sentences of 2 words.
    tagged_str = @tagger.add_tags(str)
    phrases = @tagger.get_nouns(tagged_str).keys
    phrases = phrases.each_with_index.map do |phrase, i|
      "#{adjective(i)} #{phrase}.";
    end

    # End every input with "wow".
    phrases << 'wow.'

    # Return a string, separating each sentence
    # with a space.
    phrases.join(' ')
  end

  private

  def adjective(i)
    ADJECTIVES[i % ADJECTIVES.size]
  end
end
```

There are a few key points worth noting here.  First, I added a `require` line to ensure the engtagger gem is included whenever this file is required.  Second, I changed `Dogeify` from a module to a class.  The reason for doing so is that an instance of `EngTagger` needs to be initialized, and I don't want this initialization to have to occur every time Dogeify processes text.  As such, I added this into Dogeify's `#initialize` method.  Third, I added the list of adjectives we're going to be working with as a constant array, along with a helper method for extracting the next viable adjective from the array.  Finally, the `#process` method was converted from a class method into an instance method, and its processing instructions were added.

Running the test suite once more will show that our tests now pass.

## Releasing your gem

Now that you're happy with your gem, let's share it with the world.  First, make sure your `version.rb` file reflects the version number you want your gem to start with.  Something like "1.0.0" is probably a good starting place.

Next, it's important to commit your code to Github (or wherever you're hosting it).  Bundler assumes that you're working with some sort of git repository, though that isn't mandatory.

Now that your code is committed, let's release it to the world.  You'll want to [create an account on RubyGems.org](https://rubygems.org/sign_up) assuming you don't already have one.  Once you have an account, from your command line type:

```bash
$ bundle exec rake release
```

If you've never released a gem before, you'll be prompted to enter your RubyGems.org credentials so that they know it's you.  After you've done this once, Bundler will remember for the future, meaning you won't be prompted for any other info.

When this command runs successfully, it does two things:

1. Your git repository will be tagged with the version number using a name like "v1.0.0".
1. Your gem will be accessible through RubyGems.org.  [Here's dogeify's gem page.](https://rubygems.org/gems/dogeify)

If you made it this far, congratulations!  Your gem can now be used by the world just by adding it to their `Gemfile`.

If you're interested in accessing [the full Dogeify source](https://github.com/mhuggins/dogeify), it's available on [my Github page](https://github.com/mhuggins).
Here's [how to get access](http://go.quickleft.com/engineering-lunch-series-guide-to-building-your-first-ruby-gem-0) to the 45 minute video tutorial complete with slidedeck too.
