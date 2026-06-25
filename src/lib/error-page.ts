export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Loading…</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root { color-scheme: light; }
      html, body { background: #fafafa; }
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #4b5563; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
      .spinner { width: 28px; height: 28px; border-radius: 50%; border: 3px solid #e5e7eb; border-top-color: #111; animation: spin .8s linear infinite; margin: 0 auto 1rem; }
      @keyframes spin { to { transform: rotate(360deg); } }
      #fallback { display: none; }
      #loading { display: block; }
      body.show-fallback #fallback { display: block; }
      body.show-fallback #loading { display: none; }
    </style>
  </head>
  <body>
    <div id="loading" class="card" role="status" aria-label="Loading">
      <div class="spinner"></div>
      <p>Loading…</p>
    </div>
    <div id="fallback" class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="(function(){try{sessionStorage.removeItem('__lov_ssr_retry_at')}catch(e){}location.reload()})()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
    <script>
      (function(){
        try {
          var KEY = '__lov_ssr_retry_at';
          var now = Date.now();
          var last = Number(sessionStorage.getItem(KEY) || 0);
          // Auto-retry once per 15s window. If a recent retry already failed,
          // show the fallback instead of looping forever.
          if (now - last > 15000) {
            sessionStorage.setItem(KEY, String(now));
            setTimeout(function(){ location.reload(); }, 400);
            return;
          }
        } catch (e) { /* ignore */ }
        document.body.classList.add('show-fallback');
      })();
    </script>
  </body>
</html>`;
}
