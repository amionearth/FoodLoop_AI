import urllib.request
import re
import json

url = "https://data.mendeley.com/datasets/xv5kp6mxv7/1"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
with urllib.request.urlopen(req) as r:
    html = r.read().decode("utf-8", errors="ignore")

idx = html.find("window.INITIAL_STATE")
if idx != -1:
    snippet = html[idx:idx+4000]
    print("Found window.INITIAL_STATE:")
    # extract up to </script>
    end_idx = html.find("</script>", idx)
    raw_js = html[idx:end_idx]
    # find json
    json_start = raw_js.find("{")
    if json_start != -1:
        # extract valid json or search for files inside raw_js
        files_idx = raw_js.find('"files"')
        if files_idx != -1:
            print("Files snippet:", raw_js[files_idx-20:files_idx+500])
        else:
            print("No files key in INITIAL_STATE, snippet:", raw_js[:500])
