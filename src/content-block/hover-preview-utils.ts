export const createHoverPreviewElement = (): HTMLIFrameElement => {
  const iframe = document.createElement("iframe");
  iframe.className = "content-block-highlight__preview-frame";

  iframe.setAttribute("sandbox", "allow-scripts");
  iframe.style.width = "300px";
  iframe.style.height = "0px";
  iframe.style.border = "none";
  iframe.style.pointerEvents = "none";
  return iframe;
};

export const makeIframePayload = (html: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <style>
          body { margin: 0; padding: 3px; overflow: hidden; font-family: sans-serif; background: white; }
          #preview-content { display: inline-block; white-space: nowrap; }
        </style>
      </head>
      <body>
        <div id="preview-content">${html}</div>
        <script>let initialWidth = null;
            
            let targetOrigin = '*';
            if (document.referrer) {
              try {
                const referrerUrl = new URL(document.referrer);
                targetOrigin = referrerUrl.origin;
              } catch (e) {
                // Invalid URL, keep fallback
              }
            }
            
            const updateDimensions = () => {
              const el = document.getElementById('preview-content');
              
              const height = el.offsetHeight;
              const width = el.offsetWidth;
              
              // Capture initial width on first render
              if (initialWidth === null) {
                initialWidth = width;
              }
              
              // Always use the maximum of current width and initial width
              // to prevent shrinking below initial render size
              const finalWidth = Math.max(width, initialWidth);
              
              window.parent.postMessage({ 
                type: 'resize-preview', 
                height: height, 
                width: finalWidth 
              }, targetOrigin);
            };
            
            window.addEventListener('load', updateDimensions);
            if ('ResizeObserver' in window) {
              new ResizeObserver(updateDimensions).observe(document.body);
            }
        </script>
      </body>
    </html> 
    `;
};
