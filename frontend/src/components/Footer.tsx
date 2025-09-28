export default function Footer() {
  return (
    <footer className="w-full border-t border-green-300 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-black/70">© {new Date().getFullYear()} Rate my <span className="text-green-600">Landlord</span></p>
        <p className="text-sm text-black/60">Built to help renters share real experiences.</p>
      </div>
    </footer>
  );
}

