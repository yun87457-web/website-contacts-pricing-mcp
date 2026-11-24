---
name: website-contacts-pricing-llms
description: Enrich any company domain, URL, or work email with verified business emails, phones, 12+ social profiles, auto-discovered SaaS /pricing tiers, DNS MX/SPF providers, and /llms.txt or boilerplate-free Markdown company briefs.
---

# Website Contacts, SaaS Pricing & /llms.txt Skill (SiteBrief)

Use this skill when researching a prospect domain, pulling SaaS pricing tiers, verifying contact emails/socials, or fetching a clean `/llms.txt` or Markdown brief without wasting tokens on raw HTML.

## Single-Domain Enrichment (`GET /enrich`)
```bash
curl -sG "https://website-contacts-socials-pricing-llm-brief-api.p.rapidapi.com/enrich" \
  --data-urlencode "domain=linear.app" \
  -H "x-rapidapi-key: $RAPIDAPI_KEY" \
  -H "x-rapidapi-host: website-contacts-socials-pricing-llm-brief-api.p.rapidapi.com"
```

## Remote Streamable HTTP MCP (`mcp.json`)
```json
{
  "mcpServers": {
    "website-contacts-pricing-intel": {
      "url": "https://spiky-closet--website-contacts-pricing-intel.apify.actor/mcp",
      "headers": { "Authorization": "Bearer ${APIFY_TOKEN}" }
    }
  }
}
```
