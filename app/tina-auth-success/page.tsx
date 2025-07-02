export default function TinaAuthSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Authentication Successful!</h1>
      <p className="text-gray-600">You have successfully authenticated with TinaCMS.</p>
      <p className="text-gray-600">You can now navigate to the TinaCMS admin panel.</p>
      <a href="/admin" className="mt-4 text-blue-500 hover:underline">Go to TinaCMS Admin</a>
    </div>
  )
}
