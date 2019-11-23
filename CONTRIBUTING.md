# Contributing to Terminus

1. [Getting Involved](#getting-involved)
2. [Commit Message Style](#commit-message-style)
3. [Code Style Guide](#code-style-guide)
4. [Getting Started](#getting-started)

## Getting Involved
There are a number of ways to get involved with the development of Terminus. Even if you've never contributed to an open source project before or have no JavaScript knowledge.  
There's still several ways to make (valuable) contributions!

We are always looking for help with:

* **Documentation:** Finding and fixing typos or documentation improvements, additions or changes, even simple screenshots or gif representations of some feature, but not limited to those aspects, are also important.

* **Helping with support:** If you're an Atom or Terminus user and can answer or guide other fellow users with their issues, sometimes we're just not using it right or documentation is not clear enough. 

* **Filing bug reports of (good) quality:** Read and fill in our provided bug report template and reply to any questions asked within a reasonable timeframe, even just to say you fixed the issue and how you fixed it.

* **Making feature requests:** Share with the Terminus community your vision for a cool, helpful feature! You never know, someone may be interested in it and know JS and have time to implement it.

* **Questions:** Have a question about how to do something with Terminus? Ask the community. Someone is likely to give you a tip or provide some way of achieving it. One day this information can be part of an FAQ or other type of documentation.

* **Code contributions** Fixing a bug, adding a feature, refactoring code, adding tests or improving/extending the API for our front end component or other project dependency that helps things tick in background smoothly.

## Commit Message Style

### Git Commit Guidelines
We have rules over how our git commit messages can be formatted.  This leads to **more
readable messages** that are easy to follow when looking through the **project history**.  But also,
we use the git commit messages to **generate the Terminus changelog**.

### Commit Message Format
Each commit message consists of a **header**, a **body** and a **footer**.  The header has a special
format that includes a **type**, a **scope** and a **subject**

The [subject](#subject) must contain a issue close keyword:

```
<type>(<scope>): <subject> or <type>: <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

The **header** is mandatory and the **scope** of the header is optional.<br>

Any line of the commit message cannot be longer 100 characters!<br>
This allows the message to be read easier on GitHub as well as in other git tools.

### Revert
If the commit reverts a previous commit, it should begin with `revert: `, followed by the header of the reverted commit.<br>
In the body it should say: `This reverts commit <hash>.`, where the hash is the SHA of the commit being reverted.

### Type
Must be one of the following:

| Header       | Description                                                                                               |
| :----------- | :-------------------------------------------------------------------------------------------------------- |
| **feat**     | A new feature                                                                                             |
| **fix**      | A bug fix                                                                                                 |
| **docs**     | Documentation only changes                                                                                |
| **style**    | Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc...) |
| **refactor** | A code change that neither fixes a bug nor adds a feature                                                 |
| **perf**     | A code change that improves performance                                                                   |
| **test**     | Adding missing or correcting existing tests                                                               |
| **chore**    | Changes to the build process or auxiliary tools and libraries such as documentation generation            |


### Scope ( Optional )
The scope could be anything specifying place of the commit change.<br>
For example `$location`, `$browser`, `$compile`, `$rootScope`, `ngHref`, `ngClick`, `ngView`, etc...

You can use `*` when the change affects more than a single scope.

### Subject
The subject contains succinct description of the change:

* Use the imperative, present tense: "change" not "changed" nor "changes"
* Don't capitalize first letter
* No dot (.) at the end

⚠️ If your commit fixes an open issue or replaces another pull request, include fixes/closes #issue-nr at the end of the commit subject. [Read more on this](https://help.github.com/en/articles/closing-issues-using-keywords), as shown below.

```
<type>(<scope>): <subject> <issue close keyword> or <type>: <subject> <issue close keyword>
```

### Body
Just as in the **subject**, use the imperative, present tense: "change" not "changed" nor "changes".
The body should include the motivation for the change and contrast this with previous behavior.

### Footer
The footer should contain any information about **Breaking Changes**

**Breaking Changes** should start with the word `BREAKING CHANGE:` with a space or two newlines.

## Code Style Guide

The project uses [standard JavaScript formatting](https://github.com/standard/standard), this means you can code in any JavaScript style you prefer, before making a commit though you may need to run a provided scripts or two to make things easy to follow and focus on the actual code submitted, rather than wasting time making style changes to suit our coding style.

## Getting Started

To make any contributions to the Terminus project, you must have a GitHub account so you can push code to your own fork of Terminus and open pull requests in the GitHub Repository.

1) [![fork](https://raw.githubusercontent.com/bus-stop/bus-stop.github.io/master/resources/forked.png) Fork](https://github.com/bus-stop/terminus/fork) or clone this repository.<br>
2) Use [node.js](http://nodejs.org/) to run `npm install`.<br>
3) Make any changes to the desired file and save.<br>
4) Enter a commit message according to the [commit message style](#commit-message-style).<br>
5) Run `npm run fix` to get your commit into shape if needed.<br>
6) If more commits rinse and repeat step 3 to 6 until there are no more files you need to change.<br>
6) [![open pull request](https://raw.githubusercontent.com/bus-stop/bus-stop.github.io/master/resources/git-pull-request.png) Open pull request](https://github.com/bus-stop/terminus/compare?expand=1) with Terminus.<br>

### Development Scripts

* test: runs `atom --test spec` on files in our spec folder<br>
* lint: runs `eslint .` on our source files<br>
* fix: runs `eslint . --fix` which formats the code to the JavaScript standard we use.
