---
layout: page
nav: true
title: Portfolio
permalink: /portfolio/
---

Below are some of the many projects I have worked on in both my professional and personal lives.

## Stanford University
{% for project in site.data.portfolios.stanford %}
  {% include project.html variable-project=project %}
{% endfor %}

## Open Source
{% for project in site.data.portfolios.oss %}
  {% include project.html variable-project=project %}
{% endfor %}

## Personal
{% for project in site.data.portfolios.personal %}
  {% include project.html variable-project=project %}
{% endfor %}
