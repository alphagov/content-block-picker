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
    <html>
      <head>
        <style>
          body { margin: 0; padding: 3px; overflow: hidden; font-family: sans-serif; }
          #preview-content { display: inline-block; }
        </style>
      </head>
      <body>
        <div id="preview-content">${html}</div>
        <script>const updateDimensions = () => {
              const el = document.getElementById('preview-content');
              
              const height = el.offsetHeight;
              const width = el.offsetWidth;
              
              window.parent.postMessage({ 
                type: 'resize-preview', 
                height: height, 
                width: width 
              }, '*');
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
