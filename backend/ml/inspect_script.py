import urllib.request
import re

url = "https://static.data.mendeley.com/scripts/script-v2.0.8.min.js"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req) as r:
    js = r.read().decode("utf-8", errors="ignore")

for m in re.finditer(r'files', js):
    start = max(0, m.start() - 40)
    end = min(len(js), m.end() + 80)
    snippet = js[start:end]
    if "http" in snippet or "get" in snippet.lower() or "fetch" in snippet.lower():
        print(snippet)
        break
