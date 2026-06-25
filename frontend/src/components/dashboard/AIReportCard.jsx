import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

const AIReportCard = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/reports/ai-summary');
      setSummary(response.data?.summary || 'No summary available.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate AI report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-8">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 relative overflow-hidden">
        {/* Subtle decorative background element */}
        <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none">
          <Sparkles className="w-32 h-32 text-primary-600" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                AI Platform Summary
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Generate an intelligent summary of current platform activity.
              </p>
            </div>
          </div>

          {!summary && !loading && !error && (
            <div className="mt-6">
              <button
                onClick={generateReport}
                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
              >
                <Sparkles className="h-4 w-4" />
                Generate AI Report
              </button>
            </div>
          )}

          {loading && (
            <div className="mt-6 flex items-center gap-3 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
              <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
              <span className="text-sm font-medium">Analyzing platform data...</span>
            </div>
          )}

          {error && (
            <div className="mt-6 flex items-start gap-3 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/10 p-4 rounded-lg border border-rose-100 dark:border-rose-900/20">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Error</p>
                <p className="mt-0.5 opacity-90">{error}</p>
              </div>
              <button
                onClick={generateReport}
                className="ml-auto text-xs font-semibold bg-rose-100 dark:bg-rose-900/30 px-3 py-1.5 rounded-md hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {summary && !loading && (
            <div className="mt-6 space-y-4">
              <div className="prose prose-sm dark:prose-invert max-w-none bg-slate-50 dark:bg-slate-900/50 p-5 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed shadow-inner">
                {summary}
              </div>

              <button
                onClick={generateReport}
                className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                Regenerate Report
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AIReportCard;
