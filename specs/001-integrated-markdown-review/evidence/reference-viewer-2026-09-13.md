# EzPzSpec Reader Reference

The user explicitly requested a Spec Kit canvas reader resembling the deployed
[EzPzSpec viewer](https://red-field-024a6870f.7.azurestaticapps.net/), with the
table-of-contents navigation rail and Markdown preview visible together.

On 2026-09-13 the signed-in reference application was inspected read-only using
the requested GlobalEventManagement repository's Spec Setup constitution. No
repository, document, workflow, or application source was changed. A temporary
dialog screenshot was visually inspected and moved outside this checkout; private
reference content is not part of this evidence directory or a release payload.

Observed presentation:

- A compact header shows the file name and relative path, with a close control.
- The wide reader places a sticky, independently scrollable TOC beside the article.
- The measured reader was 924px wide: a 224px rail, 34px gap, and approximately
  666px article. The rail has a subtle border, 7px radius, and restrained fill.
- Nested headings are indented; the active section has a tinted row and a thin
  accent at its leading edge. The TOC header uses an outline icon and a concise
  label. Long section labels wrap within the rail.
- The article uses 16px Manrope Variable text with 26.88px line height, clear
  heading hierarchy, section rules, readable lists, and distinct inline code.
- A compact footer separates previous/next-file controls from source metadata.

Implementation remains independently written against the accepted specification.
The canvas contract's 190-220px rail, 820px container breakpoint, host typography
tokens, no passive font/image requests, and separate artifact/section navigation
remain authoritative. The reference's proportions and interaction hierarchy guide
the adaptation; private source code and document content are not copied.

Final evidence must include actual native canvas captures with both the wide TOC
and Markdown article visible, plus section navigation and compact-layout checks.
The T016 screenshots prove host loading only and do not satisfy this visual gate.
