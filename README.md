# Capture This

Capture This is a small extension to send links and/or selected text on a page
to the URL of your choice.  You can send links/text to websites or to apps that
have custom URL schemes--anything that accepts data via query parameters is
supported.

## Build and Packaging Instructions

You'll need a UNIX-like system (e.g. Mac or Linux) to build Capture This.
Unfortunately, building on Windows is not supported due to the multiple build
steps involved (although patches to make the build more cross-platform are
welcome).  Here's what you need to do:

1. Install dependencies:

   - GNU `make`, `git`, `patch`, `rsync`, `zip` (plus the usual set of standard
     UNIX utilities like `mkdir`, `sed`, etc.)

   - Node.js and `npm` (the latest "Current" release)

   - Inkscape (the CLI must be available as `inkscape` in your PATH)

2. **To build a debug/development version:** Run `make`.  (You can use `-j<...>`
   if you want for a parallel build.)

3. **To build a release version (for packaging or review):**

   1. Make sure your source tree has no uncommitted changes (`git status` should
      say, `nothing to commit, working tree clean`).

   2. `git checkout` the tag for the version you want to build.  (Mozilla
      reviewers, you can skip this step--the provided source bundle should
      already have the correct tag checked out.)

   3. Run `make rel`.  (You can use `-j<...>` if you want for a parallel build.)

4. You'll get the following artifacts:
   - `dist`: The unpacked Firefox extension

   - (release builds only) `releases/tab-stash-X.XX-hhhhhhh.zip`: The packed
     Firefox extension (this is what gets uploaded to AMO)

   - (release builds only) `releases/tab-stash-src-X.XX-hhhhhhh.tar.gz`: A clean
     git checkout of the source tree for the release (also for uploading to AMO)
