import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-navy">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">Page not found.</p>
        <Link
          href="/home/"
          className="mt-6 inline-flex rounded-md bg-navy px-4 py-2 text-sm text-navy-foreground"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
