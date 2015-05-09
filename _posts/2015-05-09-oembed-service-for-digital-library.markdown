---
layout: post
title:  "Introducing SUL Embed"
date:   2015-05-09 15:00:00
tags: IIIF oEmbed OpenSeadragon
header: '/images/embed-header-bg.png'
---

## An oEmbed Service for Stanford University's Digital Library

Last year [DLSS](http://library.stanford.edu/department/digital-library-systems-and-services-dlss) started work on unifying the experience of displaying objects from our digital library. With the increasing number of environments needing to display our objects the need to **A)** Make it as easy as possible to display content and **B)** Make the experience across the various environments more consistent was apparent.

We had a variety of methods of indexing and displaying *primarily* images from the digital library. Every application would typically re-invent the wheel for how to display these images (all with varying interfaces) and would all potentially require manual updates if significant changes were made in our digital stacks.

### Looking to Successful Content Providers

We want to make embedding our digital objects as easy as dropping a flickr image or YouTube video into your website. Users expect this type of experience, especially as we begin to support content like streaming audio and video.  The only thing a user should need in order to embed an object is its URL.

One commonality between many of the successful content providers was the use of an **Embed** feature that allows users to very easily copy/paste a code snippet to embed the content into their website (typically an iframe or a javascript include) as you can see in the [example below](#youtube-embed).

This same feature is typically also available in a machine readable way through an [oEmbed](http://oembed.com) service. The response from the service will tell a consumer how to render the object. Existing consumer libraries will allow you to consume oEmbeddable content from various providers of your choosing in a single interface (useful for aggregating content from multiple places like in [Spotlight](http://spotlight.projectblacklight.org)).

#### YouTube Embed
![YouTube oEmbed](/images/youtube-embed.png)

### oEmbed

Over 2 months we developed an oEmbed service for embedding objects from our digital repository. The result of which can be seen below. This is an [OpenSeadragon](https://openseadragon.github.io/) image viewer using our [IIIF](http://iiif.io/) service.

<iframe src='//embed.stanford.edu/iframe?url=http://purl.stanford.edu/cp088pb1682&maxheight=500' height='500px' width='100%' frameborder='0' marginwidth='0' marginheight='0' scrolling='no' allowfullscreen></iframe>

oEmbed has various supported types that it can respond with.  We exclusively use the rich type which allows us to deliver a full HTML payload to be embedded into a consumer's web page.

### Rails::API For Fun, and Profit!

We are heavy users of Rails and naturally wanted to look there when building an API.  However; we really don't need a lot of the frameworks automatically packaged with rails.  In comes [Rails::API](https://github.com/rails-api/rails-api).  We get the opinionated nature of a rails application but get to selectively pick and choose which frameworks we include to optimize efficiency. This allows us to get a lot of throughput and extremely fast response times (mostly waiting on network responses).

![embed-response-times](/images/embed-response-times.png)

Rails::API [will be introduced to core in rails 5](http://wyeworks.com/blog/2015/4/20/rails-api-is-going-to-be-included-in-rails-5) so moving forward we will be able to remove the additional depenendcy and simply use rails.

### PURL Service

In nearly all of the the instances of existing oEmbed services, you have the API endpoint `http://example.com/embed` and the resource you are embedding `http://example.com/thing/123`.  The oEmbed API call is then `http://example.com/embed?url=http://example.com/thing/123`.  This will return the oEmbed response which will tell a consumer how to embed the object.

Since the objects we want to embed ultimately will be represented in our Persistent URL service we proxy our oEmbed service through that host. Our oEmbed service is setup as follows

* API Endpoint: `http://purl.stanford.edu/embed`
* URL Scheme: `http://purl.stanford.edu/*`
* Example URL: `http://purl.stanford.edu/embed?url=http://purl.stanford.edu/fq789sz0110`

The viewers generate their markup based on the public-xml of the PURL object being embedded `http://purl.stanford.edu/fq789sz0110.xml`.  This public-xml is a mix of a few data-streams of the digital object in one easy place.

### Extensible Viewer Framework

As of this blog post we only support image objects natively.  Everything else falls back to displaying the object's files in a file list. However we will be bringing various new content types online in the near future (e.g. Video, Audio, PDF, Web Archive, etc).  We wanted to make the process of adding new viewers as easy as possible.

New viewers are [very easy](https://github.com/sul-dlss/sul-embed#creating-viewers) to add by simply creating a class that registers itself as being responsible for particular content types and at the very minimum returns some markup for the body of the viewer.

### Preview-able Items in Hybrid Objects

Not all objects fit into a single viewer.  Many times an object may have various files of differing types.  In these cases, we render a file list of all the object's files.  If we are able to provide a preview of the item (only JP2 as of this blog post) you get a toggle-able preview as you can see below.

<iframe src='//embed.stanford.edu/iframe?url=http://purl.stanford.edu/tn629pk3948&maxheight=400' height='400px' width='100%' frameborder='0' marginwidth='0' marginheight='0' scrolling='no' allowfullscreen></iframe>

### Embed via iframe

In most cases the Embed function for other oEmbed providers was through an iframe.  We provide the viewer content at a URL suitable for embedding in an iframe directly through the embed service.  `http://embed.stanford.edu/iframe?url=http://purl.stanford.edu/fq789sz0110`.  However; the HTML payload returned in our service is the content itself, not the iframe (although we could decide to change that at anytime).  We do generate the iframe code for users to easily embed the objects into their site in the optional Embed panel. The iframe is also a more secure way to embed objects for those who may not necessarily trust us to inject markup directly into their site.

![Embed Panel](/images/embed-panel.png)

### Conclusion

The oEmbed service allows us to maintain a consistent experience across our various discovery environments as well as allows users to easily embed our objects into existing websites/CMS with existing consumer libraries. We are able to enhance embedded objects with new technologies and/or viewers without the consumer needing to change how they're embedding the object into their site.

### Links

* [SUL Embed Source](https://github.com/sul-dlss/sul-embed): https://github.com/sul-dlss/sul-embed
* [oEmbed](http://oembed.com): http://oembed.com
* [OpenSeadragon](https://openseadragon.github.io): https://openseadragon.github.io
* [IIIF](http://iiif.io): http://iiif.io
