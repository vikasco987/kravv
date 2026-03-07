const fetch = require('node-fetch');

async function test() {
  try {
    const res = await fetch("https://billing.kravy.in/api/menu/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "hello test group", items: [] })
    });
    console.log("menu/add status:", res.status);
    console.log(await res.text());
  } catch(e) { console.error(e); }
  
  try {
    const res2 = await fetch("https://billing.kravy.in/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "hello test group2" })
    });
    console.log("categories status:", res2.status);
    console.log(await res2.text());
  } catch(e) { console.error(e); }
}

test();
