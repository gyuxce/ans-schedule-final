import React from 'react';

export function ConfigMissing() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl max-w-md w-full border-2 border-rose-100 dark:border-rose-900/30 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-xl font-black text-slate-800 dark:text-white mb-2">Configuration Missing</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-6">
          Please configure your Supabase environment variables.
        </p>
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl text-left">
          <code className="text-xs text-slate-600 dark:text-slate-300 font-mono break-all font-medium">
            VITE_SUPABASE_URL<br/>
            VITE_SUPABASE_ANON_KEY
          </code>
        </div>
        <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
          Copy <code className="font-bold">.env.example</code> to <code className="font-bold">.env.local</code> and set the values.
        </p>
      </div>
    </div>
  );
}
