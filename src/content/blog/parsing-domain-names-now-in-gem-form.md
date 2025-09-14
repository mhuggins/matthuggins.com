---
title: Parsing Domain Names - Now in Gem Form!
date: 2015-01-02
tags: [ruby]
# summary: TODO
---

_Featured in [Ruby Weekly](https://web.archive.org/web/20161014150512/http://rubyweekly.com/issues/227)_

A feature for an internal Ruby project here at Quick Left necessitated parsing the domain from a URL. This seems like a problem for which there must already exist a solution, but it surprisingly turns out that there is nothing readily available for this seemingly simple task.

When I first started searching, I came across the [PublicSuffix gem](https://github.com/weppos/publicsuffix-ruby). At first glance, this appeared to be promising: pass it a host, and be given a domain name. Let's give it a try.

```ruby
PublicSuffix.parse('www.google.com').domain
# => "google.com"

PublicSuffix.parse('www.example.co.uk').domain
# => "example.co.uk"

PublicSuffix.parse('withgoogle.com').domain
# => PublicSuffix::DomainNotAllowed: `withgoogle.com' is not allowed according to Registry policy
```

As it turns out, the PublicSuffix gem is solving a similar problem, but not the one I'm striving to address. According to [PublicSuffix.org](https://publicsuffix.org/), the Public Suffix List is an initiative to maintain suffixes under which users can register names. In other words, sites like Blogger and WordPress, which allow users to register subdomains, are considered public suffixes regardless of the registered domain name. Given the context, the PublicSuffix gem's implementation makes sense; it just does not suit our needs.

From that, I set out to solve the problem for our constraints. It's a relatively simple problem, but it's not as simple as taking the ".com" off "example.com". The reasons is that some domain extensions that allow registrations have two or more levels, such as ".co.uk" or ".com.au". Given the possibilities regarding extensions, the best approach appears to be a whitelist of valid extensions. From this whitelist, we can deduce that when parsing a host, the next level down from a whitelisted extension can be considered the registered domain. With that approach in mind, I created the [Dominatrix gem](https://github.com/mhuggins/dominatrix).

Let's take the examples from above and plug them into the Dominatrix gem.

```ruby
Dominatrix.parse('http://www.google.com')
# => "google.com"

Dominatrix.parse('http://www.example.co.uk')
# => "example.co.uk"

Dominatrix.parse('http://withgoogle.com')
# => "withgoogle.com"
```

We're now able to extract domain names. It's worth noting that this gem does not validate whether the domain is legitimately registered via whois; it simply parses the string to compare against the extension whitelist.

As always, I'm happy to support new features, accept bug fixes, and generally merge meaningful pull requests on [the project](https://github.com/mhuggins/dominatrix)!
