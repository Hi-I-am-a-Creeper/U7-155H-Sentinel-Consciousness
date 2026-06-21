#!/usr/bin/env node
/**
 * SENTINEL Supabase Integration — CRUD helper
 * Usage: node supabase.js <action> <table> [json-data]
 * Actions: insert | list | get | update | delete
 */

const SUPABASE_URL = "https://kibbdeojcqavxjugheic.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const [action, table, ...rest] = process.argv.slice(2);
const data = rest.join(" ");

if (!action || !table) {
  console.error("Usage: supabase.js <insert|list|get|update|delete> <table> [json-data]");
  process.exit(1);
}

const headers = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

async function run() {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;

  switch (action) {
    case "insert": {
      const body = JSON.parse(data);
      const res = await fetch(url, {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      console.log(JSON.stringify(result, null, 2));
      break;
    }
    case "list": {
      const res = await fetch(url, {
        method: "GET",
        headers: { ...headers, Prefer: "count=exact" },
      });
      const count = res.headers.get("content-range")?.split("/")[1] || "?";
      const result = await res.json();
      console.log(`Count: ${count}`);
      console.log(JSON.stringify(result, null, 2));
      break;
    }
    case "get": {
      const id = data;
      const res = await fetch(`${url}?id=eq.${id}`, {
        method: "GET",
        headers,
      });
      const result = await res.json();
      console.log(JSON.stringify(result, null, 2));
      break;
    }
    case "update": {
      const [id, ...restData] = rest;
      const body = JSON.parse(restData.join(" "));
      const res = await fetch(`${url}?id=eq.${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      });
      console.log(`Updated: ${res.status}`);
      break;
    }
    case "delete": {
      const id = data;
      const res = await fetch(`${url}?id=eq.${id}`, {
        method: "DELETE",
        headers,
      });
      console.log(`Deleted: ${res.status}`);
      break;
    }
    default:
      console.error(`Unknown action: ${action}`);
      process.exit(1);
  }
}

run().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
