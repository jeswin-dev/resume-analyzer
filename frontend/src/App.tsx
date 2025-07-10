import React, { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, RotateCcw } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';

function App() {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [jobFile, setJobFile] = useState<File | null>(null);
  const { isLoading, error, result, uploadFiles, reset } = useFileUpload();

  const handleAnalyze = async () => {
    if (!cvFile || !jobFile) return;
    
    await uploadFiles(cvFile, jobFile);
  };

  const handleReset = () => {
    setCvFile(null);
    setJobFile(null);
    reset();
  };

  const canAnalyze = cvFile && jobFile && !isLoading;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            CV Analysis Tool
          </h1>
          <p className="text-lg text-muted-foreground">
            AI-powered comparison of CVs against job descriptions
          </p>
        </div>

        {/* Upload Section */}
        {!result && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Upload Documents</CardTitle>
              <CardDescription>
                Upload a CV and job description to get detailed analysis and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FileUpload
                  label="Candidate CV"
                  file={cvFile}
                  onFileSelect={setCvFile}
                  disabled={isLoading}
                />
                <FileUpload
                  label="Job Description"
                  file={jobFile}
                  onFileSelect={setJobFile}
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
                  <p className="text-sm text-destructive font-medium">Error</p>
                  <p className="text-sm text-destructive/80 mt-1">{error}</p>
                </div>
              )}

              <div className="flex justify-center">
                <Button
                  onClick={handleAnalyze}
                  disabled={!canAnalyze}
                  size="lg"
                  className="min-w-[200px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Analyze Documents
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {result && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Analysis Results</h2>
              <Button onClick={handleReset} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                New Analysis
              </Button>
            </div>
            <ResultsDisplay result={result} />
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-muted-foreground">
          <p>Powered by Google Gemini AI • Built with React and TypeScript</p>
        </footer>
      </div>
    </div>
  );
}

export default App; 