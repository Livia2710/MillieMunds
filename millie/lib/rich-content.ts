import sanitizeHtml from "sanitize-html"

const ALLOWED_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "s", "ul", "ol", "li",
  "blockquote", "h1", "h2", "h3", "h4", "hr", "a", "img", "pre", "code",
  "table", "thead", "tbody", "tr", "th", "td", "div", "span", "mark",
]

export function sanitizeRichContent(value: string) {
  const input = value.trim()
  if (!input) return ""
  const looksLikeHtml = /<\/?[a-z][^>]*>/i.test(input)
  if (!looksLikeHtml) {
    const escaped = input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    return `<p>${escaped.replace(/\r?\n/g, "<br>")}</p>`
  }
  return sanitizeHtml(input, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { a: ["href", "target", "rel"], img: ["src", "alt", "title", "width", "height", "style", "data-align"], th: ["colspan", "rowspan", "style"], td: ["colspan", "rowspan", "style"], p: ["style"], h1: ["style"], h2: ["style"], h3: ["style"], h4: ["style"], span: ["style"], mark: ["style", "data-color"], div: ["data-page-break"] },
    allowedStyles: {
      "*": {
        "text-align": [/^(left|right|center|justify)$/],
        "color": [/^#[0-9a-f]{3,8}$/i],
        "background-color": [/^#[0-9a-f]{3,8}$/i],
        "font-size": [/^\d+(?:\.\d+)?(?:px|pt|em|rem)$/],
        "font-family": [/^[a-z0-9 ,\'"-]+$/i],
      },
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["https"] },
    transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }, true) },
  })
}
