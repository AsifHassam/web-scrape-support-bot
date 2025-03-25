
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import UrlForm from '@/components/UrlForm';
import KnowledgeBase from '@/components/KnowledgeBase';
import ChatWidget from '@/components/ChatWidget';
import { ScrapeProgress, initialScrapeProgress } from '@/utils/scraper';
import { Button } from '@/components/ui/button';
import { ArrowDown, Brain, Bot, Database, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const [scrapeResult, setScrapeResult] = useState<ScrapeProgress>(initialScrapeProgress);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowScrollIndicator(false);
      } else {
        setShowScrollIndicator(true);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <Navbar />
      
      <main className="pt-28 pb-20">
        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24 flex flex-col items-center justify-center min-h-[80vh] relative">
          <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 animate-bounce-small">
              <span>Intercom on steroids</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-balance tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
              Your Support On AutoPilot
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-balance">
              Train a custom AI chatbot for your website. Automate support, lead generation, and more.
            </p>
            
            <div className="pt-6 w-full flex flex-col items-center space-y-4">
              <UrlForm />
              <Link to="/auth?signup=true">
                <Button variant="link" className="text-primary">
                  Or sign up to manage your bots
                </Button>
              </Link>
            </div>
          </div>
          
          {showScrollIndicator && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-12 w-12 bg-white/80 dark:bg-gray-800/80 shadow-md hover:shadow-lg transition-all duration-300"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <ArrowDown className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </Button>
            </div>
          )}
        </section>
        
        {/* Features Section */}
        <section id="features" className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance text-gray-900 dark:text-white">
              Powerful Features, Simple Interface
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Our intelligent scraping technology turns your website content into a powerful knowledge base.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-start hover-scale border border-gray-100 dark:border-gray-700">
              <div className="bg-primary/10 p-3 rounded-lg mb-4">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Intelligent Web Scraping</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our advanced scraping technology extracts content from your entire website, including subpages and hidden content.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-start hover-scale border border-gray-100 dark:border-gray-700">
              <div className="bg-primary/10 p-3 rounded-lg mb-4">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Knowledge Base Creation</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Automatically organize and structure your website content into a comprehensive knowledge base.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-start hover-scale border border-gray-100 dark:border-gray-700">
              <div className="bg-primary/10 p-3 rounded-lg mb-4">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">AI-Powered Understanding</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our advanced algorithms understand the context and relationships between different pieces of content.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-start hover-scale border border-gray-100 dark:border-gray-700">
              <div className="bg-primary/10 p-3 rounded-lg mb-4">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Instant Support Bot</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Instantly transform your knowledge base into a chat support bot that can answer customer questions.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-start hover-scale border border-gray-100 dark:border-gray-700">
              <div className="bg-primary/10 p-3 rounded-lg mb-4">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="h-6 w-6 text-primary"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Privacy Focused</h3>
              <p className="text-gray-600 dark:text-gray-300">
                We prioritize your data security. Your website content is processed securely and never shared.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-start hover-scale border border-gray-100 dark:border-gray-700">
              <div className="bg-primary/10 p-3 rounded-lg mb-4">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="h-6 w-6 text-primary"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path>
                  <circle cx="12" cy="8" r="2"></circle>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Custom Branding</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Personalize your support bot with your brand colors, logo, and messaging to create a seamless experience.
              </p>
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section id="how-it-works" className="bg-gray-50 dark:bg-gray-900/50 py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance text-gray-900 dark:text-white">
                How It Works
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Three simple steps to create your intelligent support bot
              </p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="relative">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <span className="text-xl font-bold text-white">1</span>
                  </div>
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10 transform -translate-x-8"></div>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Import your Data</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Train your AI from various data sources websites, pdfs, etc...
                </p>
              </div>
              
              <div className="text-center">
                <div className="relative">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <span className="text-xl font-bold text-white">2</span>
                  </div>
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10 transform -translate-x-8"></div>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Customize</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Setup your Agent persona and goals. Customize to fit your brand.
                </p>
              </div>
              
              <div className="text-center">
                <div className="relative">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <span className="text-xl font-bold text-white">3</span>
                  </div>
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10 transform -translate-x-8"></div>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Deploy</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Add your chatbot to your website or to your existing tools in few clicks.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <span className="text-xl font-bold text-white">4</span>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Monitor</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Monitor conversations across all channels. Take over your AI chatbot when needed with smart human takeover.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Knowledge Base Section (conditional) */}
        {scrapeResult.status === 'complete' && (
          <section id="knowledge-base" className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-4xl mx-auto">
              <KnowledgeBase scrapeResult={scrapeResult} />
              
              <div className="mt-8 p-6 bg-primary/10 rounded-lg border border-primary/20">
                <h3 className="text-xl font-semibold text-primary mb-2">Ready to customize your bot?</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Sign up now to customize your bot's appearance, analyze its performance, and add it to your website.
                </p>
                <Link to="/auth">
                  <Button className="bg-primary hover:bg-primary/90 text-white">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}
        
        {/* CTA Section */}
        <section id="get-started" className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-primary/80 to-primary rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 md:px-12 py-12 md:py-16 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
                Ready to Transform Your Website?
              </h2>
              <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                Enter your website URL above to create an intelligent support bot in minutes. No coding required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth?signup=true">
                  <Button 
                    size="lg"
                    variant="secondary"
                    className="bg-white text-primary hover:bg-gray-100 hover-scale"
                  >
                    Get Started
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="bg-transparent border-white text-white hover:bg-white/10"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="bg-gray-100 dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <Link to="/" className="flex items-center space-x-2">
                <span className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="w-5 h-5 text-white"
                  >
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="17" x2="12" y2="17"></line>
                  </svg>
                </span>
                <span className="text-xl font-semibold text-gray-900 dark:text-white">Chatwise</span>
              </Link>
            </div>
            
            <div className="flex space-x-6">
              <a href="#" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                Terms of Service
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                Contact
              </a>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Chatwise. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      
      {/* Chat Widget component always visible */}
      <ChatWidget />
    </div>
  );
};

export default Index;
