import { useState } from 'react';

interface ComparisonResult {
  strengths: string[];
  weaknesses: string[];
  alignmentScore: number;
  recommendations: string[];
}

interface UseFileUploadResult {
  isLoading: boolean;
  error: string | null;
  result: ComparisonResult | null;
  uploadFiles: (cvFile: File, jobDescriptionFile: File) => Promise<void>;
  reset: () => void;
}

export function useFileUpload(): UseFileUploadResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);

  const uploadFiles = async (cvFile: File, jobDescriptionFile: File) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('cv', cvFile);
      formData.append('jobDescription', jobDescriptionFile);

      const response = await fetch('http://localhost:3001/api/upload-and-compare', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Upload error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while uploading files');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setIsLoading(false);
    setError(null);
    setResult(null);
  };

  return {
    isLoading,
    error,
    result,
    uploadFiles,
    reset,
  };
} 