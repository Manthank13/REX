'use client';
import { useRouter } from 'next/navigation';

export default function Messages() {
  const router = useRouter();

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8">Messages</h1>
      <div className="text-[var(--text-muted)] p-8 bg-[var(--card)] border border-[var(--border-color)] rounded-xl text-center">
        <p className="mb-4">Messages are tied strictly to active exchange requests.</p>
        <button 
          onClick={() => router.push('/exchanges')} 
          className="bg-[var(--accent)] text-black px-6 py-2 rounded-md font-medium"
        >
          View Exchanges
        </button>
      </div>
    </div>
  );
}
