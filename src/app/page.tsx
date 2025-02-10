import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-black to-purple-900">
      {/* Hero Section */}
      <div className="w-full px-4 py-20 text-center text-white">
        <h1 className="mb-6 text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          DeFi Detector
        </h1>
        <p className="mb-8 text-xl text-gray-300">
          AI-Powered DeFi Project Auditing & Meme Generation
        </p>
        <button className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full font-bold hover:opacity-90 transition">
          Launch App
        </button>
      </div>

      {/* Features Grid */}
      <div className="w-full max-w-6xl px-4 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <FeatureCard
          title="Token Audits"
          description="AI-powered analysis of tokenomics, red flags, and risk assessment"
          icon="🔍"
        />
        <FeatureCard
          title="Viral Memes"
          description="Generate engagement-driving memes based on token sentiment"
          icon="🎨"
        />
        <FeatureCard
          title="Multi-Platform"
          description="Access via Telegram, Discord, and Twitter integrations"
          icon="🌐"
        />
      </div>

      {/* CTA Section */}
      <div className="w-full px-4 py-16 text-center text-white bg-gradient-to-r from-purple-900 to-pink-900">
        <h2 className="text-3xl font-bold mb-4">Ready to Become a Degen Detective?</h2>
        <p className="mb-8 text-gray-300">
          Join our community and earn exclusive SUI NFT badges
        </p>
        <div className="flex gap-4 justify-center">
          <SocialButton platform="Telegram" icon="📱" />
          <SocialButton platform="Discord" icon="💬" />
          <SocialButton platform="Twitter" icon="🐦" />
        </div>
      </div>
    </main>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
}

const FeatureCard = ({ title, description, icon }: FeatureCardProps) => (
  <div className="p-6 rounded-xl bg-white/5 backdrop-blur-lg text-white hover:bg-white/10 transition">
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </div>
);

interface SocialButtonProps {
  platform: string;
  icon: string;
}

const SocialButton = ({ platform, icon }: SocialButtonProps) => (
  <button className="px-6 py-3 bg-white/10 rounded-lg hover:bg-white/20 transition flex items-center gap-2">
    <span>{icon}</span>
    <span>{platform}</span>
  </button>
);
