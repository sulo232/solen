/**
 * Inline script to prevent flash of wrong theme (FOUC).
 * Reads localStorage before React hydration and applies .dark class.
 * Content is 100% static string literal — no user input, safe from XSS.
 */
export default function ThemeScript() {
  // Static script content — hardcoded, no dynamic data
  const themeScript = [
    "(function(){",
    "try{",
    "var t=localStorage.getItem('solen_theme');",
    "var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches);",
    "if(d)document.documentElement.classList.add('dark')",
    "}catch(e){}",
    "})()",
  ].join("");

  return (
    <script
      // eslint-disable-next-line react/no-danger -- static content, no XSS risk
      dangerouslySetInnerHTML={{ __html: themeScript }}
    />
  );
}
