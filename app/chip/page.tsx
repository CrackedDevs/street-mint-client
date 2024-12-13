'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ChipContent() {
  const searchParams = useSearchParams();
  
  const tagID = searchParams.get('x');
  const count = searchParams.get('n');
  const code = searchParams.get('e');

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Chip Parameters</h1>
      <div className="space-y-2">
        <p><strong>Tag ID:</strong> {tagID || 'Not provided'}</p>
        <p><strong>Count:</strong> {count || 'Not provided'}</p>
        <p><strong>Code:</strong> {code || 'Not provided'}</p>
      </div>
    </div>
  );
}

export default function ChipPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <ChipContent />
    </Suspense>
  );
} 