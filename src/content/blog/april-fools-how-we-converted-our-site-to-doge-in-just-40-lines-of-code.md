---
title: April Fools! How We Converted Our Site to Doge in Just 40 Lines of Code
date: 2014-04-01
tags: [ruby, ruby on rails]
summary: I recently wrote a blog post describing how to create your own RubyGem. The sample gem produced, aptly named dogeify, converts English sentences into "Doge" based upon the recently popular meme. For April Fools' Day, we thought it would be fun to implement this gem to convert our entire site into doge. Here's how we did it.
note: This article was originally published as part of the QuickLeft blog while employeed there. Given that the company has been acquired and the site no longer exists, I've rehosted the content here.
---

I recently wrote a blog post describing [how to create your own RubyGem](/blog/posts/step-by-step-guide-to-building-your-first-ruby-gem).  The sample gem produced, aptly named [dogeify](https://github.com/mhuggins/dogeify), converts English sentences into "Doge" based upon the recently popular meme.  For April Fools' Day, we thought it would be fun to implement this gem to convert our entire site into doge.  Here's how we did it.

Approaching this project, we knew that we wanted to covert most, if not all, pages on the site.  There are a few options in terms of where and how to hook into our Rails code to do this.  The place that jumped out as the most convenient in terms of both simplicity and separation of concern is to create a simple Rack middleware.  This middleware could parse HTML responses, find text nodes, and convert the text from English to Doge.

The first step is to include our existing prior work from the dogeify gem.  This can simple be done by adding it to our Gemfile.  Since we're going to need to parse and modify the HTML output, we'll also include Nokogiri.

```ruby
# Gemfile
gem 'dogeify', '>= 1.0.1'
gem 'nokogiri'
```

The next step is to build out the Rack middleware.  We'll place this in the `app/middleware` folder to keep it separate from other application code while still allowing Rails to automatically load the file during initialization.

The basic structure of Rack middleware is as follows:

```ruby
class MyMiddleware
  def initialize(app)
    @app = app
  end

  def call(env)
    status, headers, response = @app.call(env)

    # perform any processing that this class is responsible for

    [status, headers, response]
  end
end
```

The important work occurs in the `call` method.  The first line essentially delegates to `@app.call`, which is what allows other middleware in the Rack pipeline to process normally.  Once all the preceding middleware in the stack have processed, we can perform our custom processing in this method.  Finally, the status, response headers, and response object must be returned as an array from this method such that the remaining Rack stack can continue to process.

Let's take this template and apply it to our own goal of converting English to Doge.

```ruby
# app/middleware/dogeify/rack.rb
class Dogeify
  class Rack
    def initialize(app)
      @app = app
      @dogeifier = Dogeify.new
    end

    def call(env)
      status, headers, response = @app.call(env)

      response.body = dogeify(response.body)

      [status, headers, response]
    end

    private

    def dogeify(html)
      content = Nokogiri.parse(html)
      content.search('//text()').each do |text|
        text.content = @dogeifier.process(text.content)
      end
      content.to_html
    end
  end
end
```

Walking through this code, we see that the `call` method now updates the `response.body` value.  Prior to calling `dogeify`, the `response.body` contains the full HTML response based upon the Rack stack processing that has already happened.

Taking a peak inside the `dogeify` method, all we're doing is parsing the HTML string using Nokogiri, searching for all text nodes, processing the text content via the dogeify gem, and returning the modified HTML string.

There are a few issues and concerns with what we have so far though:

1. Our new middleware is processing _all_ responses, regardless of content-type.  Not only does our new middleware run for HTML requests, but it's also handling calls to the asset pipeline, for example.  Some of these responses will be binary data representing images, CSS, and other miscellaneous files you have available through your application.
1. Our middleware is going to run 24/7.  We only want it to run on April Fools' Day.
1. There are some sections of the site that we don't want to modify.  For example, our "Quick Left" header is using a custom font that does not have any letters beyond those needed for our company name.  Modifying the header would effectively destroy it.

Let's address these issues with a little bit of a refactor.

```ruby
# app/middleware/dogeify/rack.rb
class Dogeify
  class Rack
    def initialize(app)
      @app = app
      @dogeifier = Dogeify.new
    end

    def call(env)
      status, headers, response = @app.call(env)

      if april_fools? && html_response?(headers)
        response.body = dogeify(response.body)
      end

      [status, headers, response]
    end

    private

    def april_fools?
      today = Date.today
      today.month == 4 && today.day == 1
    end

    def html_response?(headers)
      headers['Content-Type'].downcase.start_with?('text/html') rescue false
    end

    def preserve_node?(node)
      node.xpath("ancestor::*[contains(@class, 'preserve')]").any?
    end

    def dogeify(html)
      content = Nokogiri.parse(html)
      content.search('//text()').each do |text|
        next if text.blank? || preserve_node?(text)
        text.content = @dogeifier.process(text.content)
      end
      content.to_html
    rescue
      html
    end
  end
end
```

Looking again at the `call` method, you can see that we're now conditionally processing the response content based upon the date being April 1st as well as the response content being "text/html".  For the content-type check, a `rescue false` was included since either the `headers` object itself or the "Content-Type" key in the `headers` object could be nil.

The `dogeify` method has been updated in two ways as well.  First, a `rescue` was added to the entire method.  If our HTML processing fails for any reason, we don't want to hurt the user experience with our site.  Allowing the original response to be returned is far better than returning a 500 Internal Server error.  Second, the loop used to process text now only converts nodes in the HTML that don't have a parent element with the class name "preserve".  This allows us to prevent sections like our header from being processed to doge.  As an example, this content would be preserved:

```html
<section className="header preserve">
  <h1 className="logo">Quick Left</h1>
  <nav> <!-- ... --> </nav>
</section>
```

Admittedly, our final solution included some special handling beyond what is shared here (e.g.: don't modify blog posts or admin pages).  This was easily done by looking at the current path provided in the `env` object that gets passed into `call`.  It's worth mentioning that the `env` object includes all the details you could possibly need about the user's request as a simple hash, allowing you to conditionally process to your heart's content.

There is still one remaining step to bring everything together.  Although our file containing the Rack class will automatically be loaded by Rails, nothing is telling Rails to include this class in the middleware stack.  This can easily be done by adding a line to our application configuration.

```ruby
# config/application.rb
config.middleware.use('::Dogeify::Rack')
```

And there you have it!  A simple full-site conversion for April Fools in just 40 lines of code.
