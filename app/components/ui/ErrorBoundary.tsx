import { useRouteError } from "@remix-run/react";

export function ErrorBoundary() {
  const error = useRouteError();
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Oops! Algo salió mal
          </h1>
          <div className="text-gray-600 dark:text-gray-400 mb-6">
            <p>Lo sentimos, ha ocurrido un error inesperado.</p>
            {error instanceof Error && (
              <pre className="mt-2 text-sm bg-gray-100 dark:bg-zinc-700 p-4 rounded-lg overflow-auto">
                {error.message}
              </pre>
            )}
          </div>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Recargar página
            </button>
            <a
              href="/"
              className="bg-gray-200 dark:bg-zinc-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors"
            >
              Volver al inicio
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 