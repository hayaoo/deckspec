export const dashboardJS = /* js */ `
(function() {
  /* -- SSE live reload --------------------------------------------- */
  if (typeof EventSource !== 'undefined') {
    var es = new EventSource('/events');
    es.addEventListener('reload', function() {
      location.reload();
    });
    es.onerror = function() {
      // Reconnect handled automatically by EventSource
    };
  }
})();
`;
