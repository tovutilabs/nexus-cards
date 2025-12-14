export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-12 text-center max-w-md">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Card Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          The card you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
