#!/usr/bin/env node
/**
 * SiteBrief — Website Contacts, Pricing & /llms.txt MCP Server (Zero-Dependency Node.js 18+ MCP stdio Server)
 *
 * Run locally via:
 *   npx -y github:yun87457-web/website-contacts-pricing-mcp
 *
 * Authentication (choose one):
 *   - APIFY_TOKEN   (Apify Standby Streamable HTTP MCP backend — Free tier available)
 *   - RAPIDAPI_KEY  (RapidAPI REST backend — Free Basic plan available)
 */
import readline from "node:readline";

const SERVER_NAME = "sitebrief-website-contacts-pricing-mcp";
const SERVER_VERSION = "1.1.0";
const APIFY_MCP_URL = "https://spiky-closet--website-contacts-pricing-intel.apify.actor/mcp";
const APIFY_URL = "https://apify.com/spiky_closet/website-contacts-pricing-intel";
const RAPIDAPI_URL = "https://rapidapi.com/HYunLe/api/website-contacts-socials-pricing-llm-brief-api";
const RAPIDAPI_HOST = "website-contacts-socials-pricing-llm-brief-api.p.rapidapi.com";
const TOOLS = [
  {
    "name": "enrich_company_website",
    "description": "Extract verified emails, phones, social profiles, SaaS /pricing tiers, DNS MX/SPF, and /llms.txt or clean Markdown brief for a domain or work email.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "domain": {
          "type": "string",
          "description": "Company domain, URL, or work email (e.g. linear.app)"
        }
      },
      "required": [
        "domain"
      ]
    },
    "rapidapi": {
      "method": "GET",
      "path": "/enrich"
    }
  }
];

function writeMsg(msg) {
  process.stdout.write(JSON.stringify(msg) + "\n");
}

async function proxyApifyMcp(payload, token) {
  const res = await fetch(APIFY_MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Apify MCP HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("text/event-stream")) {
    const lines = text.split(/\r?\n/).filter((l) => l.startsWith("data:"));
    for (let i = lines.length - 1; i >= 0; i--) {
      const raw = lines[i].slice(5).trim();
      if (raw && raw !== "[DONE]") {
        try { return JSON.parse(raw); } catch {}
      }
    }
    throw new Error("Empty SSE response from Apify MCP endpoint");
  }
  return JSON.parse(text);
}

async function callRapidApi(tool, args, key) {
  const cfg = tool.rapidapi;
  let url = `https://${RAPIDAPI_HOST}${cfg.path}`;
  const headers = {
    "x-rapidapi-key": key,
    "x-rapidapi-host": RAPIDAPI_HOST
  };
  const init = { method: cfg.method, headers };
  if (cfg.method === "GET") {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(args || {})) {
      if (v !== undefined && v !== null) qs.set(k, String(v));
    }
    if ([...qs.keys()].length > 0) url += `?${qs.toString()}`;
  } else {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(args || {});
  }
  const res = await fetch(url, init);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`RapidAPI HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

async function handleRequest(msg) {
  const { id, method, params } = msg;
  const hasId = id !== undefined && id !== null;

  if (method === "initialize") {
    if (!hasId) return;
    return writeMsg({
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: params?.protocolVersion || "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION }
      }
    });
  }

  if (method === "notifications/initialized" || method === "notifications/cancelled") {
    return;
  }

  if (method === "ping") {
    if (!hasId) return;
    return writeMsg({ jsonrpc: "2.0", id, result: {} });
  }

  if (method === "tools/list") {
    if (!hasId) return;
    const apifyToken = process.env.APIFY_TOKEN;
    if (apifyToken) {
      try {
        const remote = await proxyApifyMcp({ jsonrpc: "2.0", id, method: "tools/list", params: params || {} }, apifyToken);
        if (remote?.result?.tools) {
          return writeMsg({ jsonrpc: "2.0", id, result: remote.result });
        }
      } catch (err) {
        process.stderr.write(`[mcp] fallback to local schema: ${err.message}\n`);
      }
    }
    return writeMsg({
      jsonrpc: "2.0",
      id,
      result: {
        tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }))
      }
    });
  }

  if (method === "tools/call") {
    if (!hasId) return;
    const toolName = params?.name;
    const args = params?.arguments || {};
    const apifyToken = process.env.APIFY_TOKEN;
    const rapidApiKey = process.env.RAPIDAPI_KEY;

    try {
      if (apifyToken) {
        const remote = await proxyApifyMcp({ jsonrpc: "2.0", id, method: "tools/call", params }, apifyToken);
        if (remote?.result) {
          return writeMsg({ jsonrpc: "2.0", id, result: remote.result });
        }
        if (remote?.error) {
          return writeMsg({ jsonrpc: "2.0", id, error: remote.error });
        }
      }
      if (rapidApiKey) {
        const tool = TOOLS.find((t) => t.name === toolName) || TOOLS[0];
        const out = await callRapidApi(tool, args, rapidApiKey);
        return writeMsg({
          jsonrpc: "2.0",
          id,
          result: { content: [{ type: "text", text: out }] }
        });
      }
      return writeMsg({
        jsonrpc: "2.0",
        id,
        result: {
          isError: true,
          content: [{
            type: "text",
            text: `Missing credentials. Set APIFY_TOKEN (free tier: ${APIFY_URL}) or RAPIDAPI_KEY (free plan: ${RAPIDAPI_URL}) in your MCP client env.`
          }]
        }
      });
    } catch (err) {
      return writeMsg({
        jsonrpc: "2.0",
        id,
        result: {
          isError: true,
          content: [{ type: "text", text: `Error calling ${toolName}: ${err.message}` }]
        }
      });
    }
  }

  if (hasId) {
    writeMsg({
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: `Method not found: ${method}` }
    });
  }
}

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  try {
    const msg = JSON.parse(trimmed);
    handleRequest(msg).catch((err) => {
      process.stderr.write(`[mcp] unhandled error: ${err.message}\n`);
    });
  } catch (err) {
    process.stderr.write(`[mcp] invalid JSON: ${err.message}\n`);
  }
});
