
async function check(url) {
  try {
    const res = await fetch(url);
    console.log(`${url} -> ${res.status} (${res.headers.get('content-type')})`);
  } catch (e) {
    console.log(`${url} -> ERROR: ${e.message}`);
  }
}

async function run() {
  await check("https://billing.kravy.in/api/parties");
  await check("https://kravy.in/api/parties");
  await check("https://kravv.vercel.app/api/parties");
  await check("https://kravy-billing.vercel.app/api/parties");
  await check("https://kravy-pos.vercel.app/api/parties");
  await check("https://kravy-pos.vercel.app/api/parties");
}

run();
