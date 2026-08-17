---
"@zazuko/trifid-markdown-content": patch
---

Fix configured `classes` corrupting elements that already had two or more classes.

The class name was appended by interpolating the existing value into a template
string, but hast represents `className` as an array, so interpolation fell back to
`Array.prototype.toString()` and joined the existing classes with commas. An element
carrying `intro` and `lead` was rendered as `class="intro,lead h1-class"` instead of
`class="intro lead h1-class"`, which silently broke the affected CSS selectors.

Class names are now appended to the array directly. Elements with zero or one existing
class are unaffected, so most output is unchanged.
