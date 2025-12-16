/**
 * Toast Notifications Section
 *
 * Tests the toast notification system with different variants.
 */

interface ToastFunctions {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

interface ToastSectionProps {
  toast: ToastFunctions;
}

export function ToastSection({ toast }: ToastSectionProps) {
  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Toast Notifications
      </h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => toast.success("Success notification test")}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          Success
        </button>
        <button
          onClick={() => toast.error("Error notification test")}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Error
        </button>
        <button
          onClick={() => toast.warning("Warning notification test")}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
        >
          Warning
        </button>
        <button
          onClick={() => toast.info("Info notification test")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Info
        </button>
      </div>
    </section>
  );
}
