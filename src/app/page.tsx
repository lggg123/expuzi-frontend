'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
}

const FeatureCard = ({ title, description, icon }: FeatureCardProps) => (
  <Card className="p-6 bg-white/5 backdrop-blur-lg text-white hover:bg-white/10 transition">
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </Card>
);

export default function Home() {
  const [tokenAddress, setTokenAddress] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!tokenAddress) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: tokenAddress }),
      });
      
      if (!response.ok) throw new Error('Analysis failed');
      
      const data = await response.json();
      // Handle successful analysis
      console.log(data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze token');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-black to-purple-900">
      {/* Hero Section */}
      <div className="w-full px-4 py-20 text-center text-white">
        <h1 className="mb-6 text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          Expuzi™
        </h1>
        <p className="mb-8 text-xl text-gray-300">
          AI-Powered Token Analysis & Risk Assessment
        </p>
        <Button 
          variant="default" 
          className="px-8 py-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full font-bold"
        >
          Connect Wallet
        </Button>
      </div>

      {/* Features Grid */}
      <div className="w-full max-w-6xl px-4 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <FeatureCard
          title="Token Analysis"
          description="Real-time risk assessment and tokenomics analysis"
          icon="🔍"
        />
        <FeatureCard
          title="Risk Detection"
          description="Identify potential red flags and security concerns"
          icon="⚠️"
        />
        <FeatureCard
          title="Smart Insights"
          description="AI-powered analysis of market trends and sentiment"
          icon="📊"
        />
      </div>

      {/* CTA Section */}
      <div className="w-full px-4 py-16 text-center text-white bg-gradient-to-r from-purple-900 to-pink-900">
        <h2 className="text-3xl font-bold mb-4">Start Analyzing</h2>
        <p className="mb-8 text-gray-300">
          Enter any SUI token address to get started
        </p>
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-4 w-full max-w-md">
            <input
              type="text"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              placeholder="Token Address"
              className="w-full px-6 py-3 rounded-lg bg-white/10 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Button 
              variant="default" 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !tokenAddress}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </Button>
          </div>
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
        </div>
      </div>
    </main>
  );
}

