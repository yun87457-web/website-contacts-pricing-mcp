#!/usr/bin/env python3
import os, sys, json, urllib.request, urllib.parse

key = os.environ.get("RAPIDAPI_KEY")
if not key:
    sys.exit("Set RAPIDAPI_KEY first (free tier: https://rapidapi.com/HYunLe/api/website-contacts-socials-pricing-llm-brief-api)")
domain = sys.argv[1] if len(sys.argv) > 1 else "linear.app"
url = "https://website-contacts-socials-pricing-llm-brief-api.p.rapidapi.com/enrich?" + urllib.parse.urlencode({"domain": domain})
req = urllib.request.Request(url, headers={"x-rapidapi-key": key, "x-rapidapi-host": "website-contacts-socials-pricing-llm-brief-api.p.rapidapi.com"})
with urllib.request.urlopen(req, timeout=20) as r:
    print(json.dumps(json.loads(r.read().decode()), indent=2))
