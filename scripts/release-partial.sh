#!/usr/bin/env bash
# Writes site/partials/release.html from the latest GitHub release of this repository, so the
# download section lists the current version and its files. Without a release the committed
# placeholder stays. Needs gh and jq (both on GitHub's runners) and GH_TOKEN.
set -euo pipefail

repo="${GITHUB_REPOSITORY:-BartK1990/byte-bridge-docs}"
out="site/partials/release.html"

if ! json="$(gh api "repos/$repo/releases/latest" 2>/dev/null)"; then
    echo "No release yet; keeping $out"
    exit 0
fi

jq -r '
  def esc: gsub("&"; "&amp;") | gsub("<"; "&lt;") | gsub(">"; "&gt;") | gsub("\""; "&quot;");
  def size: if . >= 1048576 then "\((. / 1048576 * 10 | floor) / 10) MB" else "\((. / 1024) | floor) KB" end;
  "<div class=\"release-assets\">",
  (.assets[] |
    "    <a class=\"btn\" href=\"\(.browser_download_url | esc)\">",
    "        <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 3v12m0 0-5-5m5 5 5-5M4 19h16\"/></svg>",
    "        \(.name | esc) <span style=\"font-weight:400;opacity:.75\">(\(.size | size))</span>",
    "    </a>"),
  (if (.assets | length) == 0 then
    "    <a class=\"btn\" href=\"\(.html_url | esc)\">Release \(.tag_name | esc)</a>" else empty end),
  "</div>",
  "<p class=\"release-meta\">Version <strong>\((.name // .tag_name) | esc)</strong>, released \(.published_at[0:10]).",
  "    <a href=\"\(.html_url | esc)\">Release notes</a> · <a href=\"https://github.com/\($repo)/releases\">all releases</a></p>"
' --arg repo "$repo" <<<"$json" > "$out"

echo "Wrote $out:"
cat "$out"
