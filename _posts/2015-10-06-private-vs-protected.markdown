---
layout: post
title:  "Public, Private, and Protected Methods"
date:   2015-10-06 22:00:00
header: '/images/private-vs-protected.png'
tags: Ruby Design
---

<blockquote>
  <dl>
    <dt>Public Interfaces</dt>
    <dd>The methods that make up the public interface of your class comprise the face it presents to the word. They reveal its primary responsibility, are expected to be invoked by others, will not change on a whim, are safe for others to depend on, and are thoroughly documented in the tests.</dd>
    <dt>Private Interfaces</dt>
    <dd>All other methods in the class are part of its private interface. They handle implementation details, are not expected to be sent by other objects, can change for any reason whatsoever, are unsafe for others to depend on, and may not even be referenced in the tests.</dd>
  </dl>
  <footer>Sandi Metz in <cite>Practical Object-Oritented Design in Ruby</cite></footer>
</blockquote>


A very important aspect of developing in ruby is an attention to the public vs private interfaces. Given that all methods in ruby are public by default it requires the developer to actively think about what methods should comprise their public interface. The result of not strictly defining the public vs private interfaces is that every method in your class is now part of the public interface and needs be treated as such. This also requires that major versions be released every time those methods change in a non-backwards compatible way. The result of which is that you most likely either do not follow semantic versioning faithfully or are predisposed to never update the code (or alternatively `¯\_(ツ)_/¯`).

## Public methods

Your public methods should be **only** the methods that are being called outside of your class. Every method that is not actively being called outside of the class is not public and should be defined as such. You can always promote a method from the private to public interface.

Public methods are all tested thoroughly and making any changes to them should be done with great caution. Keeping these methods as simple as possible and the complex logic abstracted to the private interface can be a sign of a healthy codebase.

## Private methods

The rest of the methods are private. One of the benefits of keeping the implementation details in private methods (and keeping your public interface as simple as possible) is that you are free to change these at will as long as it doesn't interfere with the public interface. Given others should not use your private interface, you do not have to worry when refactoring as the public interface's tests will give you confidence in the success of your changes.

Of course since we are in ruby you have access to the private interfaces of all the libraries you interact with (using `send`). As with many things in ruby, just because you can do this does not mean you should. Any time you use `send` you are leaving yourself in a position where the interface could break at any time without notice. `send` can however be useful for unit testing private methods.

{% highlight ruby %}
class AClass
  def do_thing
    run_filter
  end

  private

  def run_filter
    'filter running!'
  end
end

AClass.new.do_thing
=> "filter running!"
AClass.new.run_filter
=> NoMethodError: private method `run_filter` called for #<AClass>
AClass.new.send(:run_filter)
=> "filter running!"
{% endhighlight %}

## Protected methods

There is another kind of private method that you may have seen. Protected methods are used in inheritance hierarchies. Protected methods are just like private methods except that they are available to classes that are inherited from the class where the protected method is defined (even in new instances of the class).

{% highlight ruby %}
class AClass
  private

  def run_filter
    'filter running!'
  end
end

class BClass < AClass
  def do_thing
    AClass.new.run_filter
  end
end

BClass.new.do_thing
=> NoMethodError: private method `run_filter` called for #<AClass>
{% endhighlight %}

{% highlight ruby %}
class AClass
  protected

  def run_filter
    'filter running!'
  end
end

class BClass < AClass
  def do_thing
    AClass.new.run_filter
  end
end

BClass.new.do_thing
=> "filter running!"
{% endhighlight %}

## Conclusion

Defining a concrete public interface is an important part of any code designers process and can have a large impact on the maintainability of a codebase over time. A codebase is more flexible and susceptible to change when the messages that objects send each other (the public interface) are strictly defined and well tested. Keeping complex logic in the private interface lends the code to being refactored more easily and makes the codebase more pleasant to work with.
