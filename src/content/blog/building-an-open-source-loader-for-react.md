---
title: Building an Open-Source Loader for React
date: 2014-09-16
tags: [react, javascript]
summary: Sometimes when building client projects, it quickly becomes clear when some code is going to be used and reused. Such is the case with a loader implementation for Gociety, a mobile app we recently worked on that uses React. When that happens, we like to give back -- and what better way than to open-source some code for others to use?
---

While working on a mobile application for [Gociety](https://gociety.com/), we found that there were a handful of screens that needed to fetch data from an API endpoint before showing any details.  Since we knew enough about the state of the app (e.g.: the user is viewing a profile), we were able to show the general screen UI, but we needed a way to indicate to the user that the content is loading.

To solve this, I built and open-sourced [react-loader](https://github.com/quickleft/react-loader) to take advantage of [spin.js](https://spin.js.org/) in the context of a [React.js](https://react.dev/) component.  Installation and usage is trivial.

First, install the package via npm:

```bash
npm install react-loader --save
```

Next, simply wrap the `<Loader>` component around your loading content.

```js
/** @jsx React.DOM */

var UI = require('../components/ui');
var Loader = require('react-loader');

var ProfileScreen = React.createClass({
  propTypes: {
    id: React.PropTypes.number.isRequired,
    name: React.PropTypes.string.isRequired
  },

  getInitialState: function () {
    return { loaded: false, profile: null };
  },

  componentDidMount: function () {
    new Profile({ id: this.props.id }).fetch({
      success: this.onSuccess,
      error: this.onError
    })
  },

  onSuccess: function (profile) {
    this.setState({ profile: profile, loaded: true });
  },

  onError: function (err) {
    // error handling goes here
  },

  render: function () {
    return (
      <UI.Container>
        <UI.Header>{this.props.name}'s Profile</UI.Header>

        <Loader loaded={this.state.loaded}>
          <UI.Profile model={this.state.profile} />
        </Loader>
      </UI.Container>
    );
  }
});
```

As long as the Loader has a `loaded` value of `false`, the spinner will render; otherwise, your encapsulated content will be displayed.

In addition, the react-loader component supports all the configuration settings that spin.js enables via component properties.  For example, setting the color can be done by passing in a simple string:

```js
<Loader loaded={false} color="#CCC" />
```

Check out the [Github repo](https://github.com/quickleft/react-loader) for more usage details, and pull requests are always welcome!
