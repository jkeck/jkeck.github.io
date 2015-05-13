---
layout: post
title:  "Discovering superfluous API requests in your test suite"
date:   2015-05-13 18:00:00
tags: RSpec APIs Testing
header: '/images/api-requests-bg.png'
---

*NOTE: this code assumes RSpec but the principles still apply in other test frameworks.*

You may find yourself in the situation where your project's build is rapidly slowing down as the number of tests and code increases. In some cases this is a direct correlation with application code that consumes information from external APIs. There are many great resources in dealing with stubbing/mocking these external responses (see [VCR](https://github.com/vcr/vcr), [WebMock](https://github.com/bblimke/webmock), etc) but this post focuses on identifying when particular external responses have become a burden on your test suite.

Let's say you have a class in your code that GETs an HTTP response like so:
<pre>
def response
  @response ||= Faraday.get('http://sushi.com/nigiri/sake.json')
end
</pre>

This response may get called any number of times in your application. The request is memoized so it won't be executed more than once in the same instance of the class, however; there may be various times where this request is made unnecessarily during the test suite (particularly during integration tests). You may or may not find that your test suite is making a lot of extra HTTP requests that are unnecessary and slowing down the build.

One extremely simple way to find out **A)** How many times your particular HTTP request is being executed, and **B)** Where in your tests superfluous API requests are being made is to add a counter that can be incremented every time an API call is made.

Add this module into your `rails_helper.rb` (or `spec_helper.rb` if you're on older versions of RSpec)

<pre>
module APICounter
  mattr_accessor :count do
    0
  end
end
</pre>
In your `RSpec.configure` block add
<pre>
config.after(:suite) do
  puts "Total API requests: #{APICounter.count}"
end
</pre>

Then you can increment the counter in the code that makes the API request.

<pre>
def response
  @response ||= begin
    APICounter.count += 1
    Faraday.get('http://sushi.com/nigiri/sake.json')
  end
end
</pre>

This will give you the total number of times that API request was called in the test suite.  You can also narrow down when API requests are made by printing some sort of statement when the API counter is increased and running the tests with a formatter that will show you which test was being run at the time.

<pre>
def response
  @response ||= begin
    APICounter.count += 1
    puts "API Request #{APICounter.count} Executed"
    Faraday.get('http://sushi.com/nigiri/sake.json')
  end
end
</pre>
<pre>
$ rspec -f d
</pre>

Now that you've identified the superfluous API requests you can work on eliminating them by stubbing them out in the cases where a legitimate response is not necessary.
