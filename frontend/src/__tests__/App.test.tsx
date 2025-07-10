import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

describe('App', () => {
  it('renders the main heading', () => {
    render(<App />);
    
    expect(screen.getByText('CV Analysis Tool')).toBeInTheDocument();
    expect(screen.getByText('AI-powered comparison of CVs against job descriptions')).toBeInTheDocument();
  });

  it('shows upload section initially', () => {
    render(<App />);
    
    expect(screen.getByText('Upload Documents')).toBeInTheDocument();
    expect(screen.getByText('Candidate CV')).toBeInTheDocument();
    expect(screen.getByText('Job Description')).toBeInTheDocument();
  });

  it('shows disabled analyze button initially', () => {
    render(<App />);
    
    const analyzeButton = screen.getByRole('button', { name: /analyze documents/i });
    expect(analyzeButton).toBeDisabled();
  });
}); 