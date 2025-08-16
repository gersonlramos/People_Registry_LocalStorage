import { App } from "./App.js";

/**
 * Application entry point
 */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Check for browser compatibility
    if (!checkBrowserCompatibility()) {
      showBrowserCompatibilityError();
      return;
    }

    // Create and initialize the application
    const app = new App();
    await app.init();

    // Make app globally available for onclick handlers
    window.app = app;

    console.log("People Registry Application started successfully");

    // Add performance monitoring
    if (window.performance && window.performance.mark) {
      window.performance.mark("app-initialized");
    }
  } catch (error) {
    console.error("Failed to start application:", error);

    // Show fallback error message
    const container = document.querySelector(".container");
    if (container) {
      container.innerHTML = `
                <div class="error-container">
                    <h1>Erro ao Inicializar</h1>
                    <p>Ocorreu um erro ao inicializar a aplicação. Recarregue a página para tentar novamente.</p>
                    <button onclick="window.location.reload()">Recarregar Página</button>
                    <details style="margin-top: 20px; text-align: left;">
                        <summary>Detalhes do erro</summary>
                        <pre style="background: rgba(0,0,0,0.1); padding: 10px; border-radius: 4px; margin-top: 10px; font-size: 12px;">${
                          error.stack || error.message
                        }</pre>
                    </details>
                </div>
            `;
    }
  }
});

/**
 * Check browser compatibility
 * @returns {boolean}
 */
function checkBrowserCompatibility() {
  // Check for required features
  const requiredFeatures = [
    "localStorage" in window,
    "JSON" in window,
    "Promise" in window,
    "fetch" in window || "XMLHttpRequest" in window,
    "addEventListener" in document,
    "querySelector" in document,
    "classList" in document.createElement("div"),
  ];

  return requiredFeatures.every((feature) => feature);
}

/**
 * Show browser compatibility error
 */
function showBrowserCompatibilityError() {
  const container = document.querySelector(".container") || document.body;
  container.innerHTML = `
        <div class="error-container">
            <h1>Navegador Não Compatível</h1>
            <p>Seu navegador não suporta todas as funcionalidades necessárias para esta aplicação.</p>
            <p>Por favor, atualize seu navegador ou use uma versão mais recente do:</p>
            <ul style="text-align: left; display: inline-block;">
                <li>Chrome 60+</li>
                <li>Firefox 55+</li>
                <li>Safari 12+</li>
                <li>Edge 79+</li>
            </ul>
        </div>
    `;
}

// Handle unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);

  // Prevent the default browser behavior
  event.preventDefault();

  // Show user-friendly error if app is available
  if (window.app && window.app.showError) {
    window.app.showError("Ocorreu um erro inesperado. Tente novamente.");
  }
});

// Handle global errors
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);

  // Show user-friendly error if app is available
  if (window.app && window.app.showError) {
    window.app.showError(
      "Ocorreu um erro inesperado. Recarregue a página se o problema persistir."
    );
  }
});

// Performance monitoring
if ("performance" in window) {
  window.addEventListener("load", () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType("navigation")[0];
      if (perfData) {
        console.log("Performance metrics:", {
          domContentLoaded:
            perfData.domContentLoadedEventEnd -
            perfData.domContentLoadedEventStart,
          loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
          totalTime: perfData.loadEventEnd - perfData.fetchStart,
        });
      }
    }, 0);
  });
}
