import { HeartHandshake, Home, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button.jsx';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center dark:bg-[#080a14]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary-300/15 blur-3xl dark:bg-primary-900/20" />
        <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-violet-300/15 blur-3xl dark:bg-violet-900/15" />
      </div>

      <motion.div
        className="relative"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-500 to-violet-600 shadow-glow mx-auto">
          <HeartHandshake className="h-10 w-10 text-white" />
        </div>

        <h1 className="text-8xl font-black tracking-tight gradient-text">404</h1>
        <h2 className="mt-2 text-2xl font-bold text-slate-800 dark:text-white">Page not found</h2>
        <p className="mt-3 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link to="/dashboard">
            <Button variant="primary">
              <Home className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <Link to="/opportunities">
            <Button variant="secondary">
              <Search className="h-4 w-4" />
              Browse Opportunities
            </Button>
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
