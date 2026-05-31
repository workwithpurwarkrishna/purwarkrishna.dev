const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const markdownIt = require("markdown-it");
const markdownItFootnote = require("markdown-it-footnote");

module.exports = function (eleventyConfig) {
  // ---- Static passthrough ----
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("icons");
  eleventyConfig.addPassthroughCopy("site.webmanifest");
  eleventyConfig.addPassthroughCopy("resume.pdf");
  eleventyConfig.addPassthroughCopy("_redirects");
  eleventyConfig.addPassthroughCopy("_headers");

  // ---- Syntax highlighting (runs at build, ships plain HTML + CSS, no client JS) ----
  eleventyConfig.addPlugin(syntaxHighlight);

  // ---- Markdown: footnotes ([^1]) + inline HTML ----
  const md = markdownIt({ html: true, linkify: true, typographer: true }).use(markdownItFootnote);
  // wrap tables so they scroll horizontally on mobile
  const defaultTableOpen = md.renderer.rules.table_open || ((t, i, o, e, s) => s.renderToken(t, i, o));
  const defaultTableClose = md.renderer.rules.table_close || ((t, i, o, e, s) => s.renderToken(t, i, o));
  md.renderer.rules.table_open = (t, i, o, e, s) => '<div class="table-scroll">' + defaultTableOpen(t, i, o, e, s);
  md.renderer.rules.table_close = (t, i, o, e, s) => defaultTableClose(t, i, o, e, s) + "</div>";
  eleventyConfig.setLibrary("md", md);

  const mdInline = markdownIt({ html: true, linkify: true });

  // ---- Filters ----
  eleventyConfig.addFilter("readingTime", function (content) {
    const words = (content || "").split(/\s+/).length;
    return Math.max(1, Math.round(words / 200)) + " min";
  });
  eleventyConfig.addFilter("dateDisplay", function (date) {
    return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  });
  eleventyConfig.addFilter("dateShort", function (date) {
    return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
  });
  eleventyConfig.addFilter("relatedPosts", function (posts, currentUrl, n) {
    return (posts || [])
      .filter(function (p) { return p.url !== currentUrl; })
      .slice()
      .reverse()
      .slice(0, n || 3);
  });

  // ---- Collections ----
  eleventyConfig.addCollection("categories", function (api) {
    const set = new Set();
    api.getFilteredByTag("posts").forEach(function (p) {
      if (p.data.category) set.add(p.data.category);
    });
    return Array.from(set).sort();
  });

  // ---- Shortcodes ----

  // {% callout "warning", "Optional title" %}body **markdown**{% endcallout %}
  eleventyConfig.addPairedShortcode("callout", function (content, type, title) {
    type = type || "key";
    const icons = { note: "i", tip: "✓", warning: "!", key: "✦" };
    const ic = icons[type] || "✦";
    const titleHtml = title ? '<span class="callout-title">' + title + "</span>" : "";
    return '<div class="callout ' + type + '"><span class="callout-ic">' + ic + '</span><div class="callout-body">' + titleHtml + md.render(content) + "</div></div>";
  });

  // {% pullquote "Optional cite" %}Big editorial line{% endpullquote %}
  eleventyConfig.addPairedShortcode("pullquote", function (content, cite) {
    const citeHtml = cite ? "<cite>" + cite + "</cite>" : "";
    return '<p class="pullquote">' + mdInline.renderInline(content.trim()) + citeHtml + "</p>";
  });

  // {% aside "Label" %}margin note{% endaside %}
  eleventyConfig.addPairedShortcode("aside", function (content, label) {
    label = label || "Note";
    return '<aside class="post-aside"><span class="aside-label">' + label + "</span>" + mdInline.renderInline(content.trim()) + "</aside>";
  });

  // {% figure "/assets/images/x.png", "Caption" %}
  eleventyConfig.addShortcode("figure", function (src, caption) {
    const cap = caption ? "<figcaption>" + caption + "</figcaption>" : "";
    return '<figure><div class="fig-frame"><img src="' + src + '" alt="' + (caption || "") + '" /></div>' + cap + "</figure>";
  });

  return {
    dir: { input: ".", output: "_site", layouts: "_layouts", includes: "_includes" },
    templateFormats: ["html", "md", "njk"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};
