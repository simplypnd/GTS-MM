export function ThemeScript() {
  const script = `(function(){try{var m=document.cookie.match(/(?:^|; )theme=(light|dark)/);if(m&&m[1]==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;
  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
