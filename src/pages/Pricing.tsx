
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Pricing = () => {
  const [billingCycle] = useState<'monthly' | 'yearly'>('monthly');
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <Navbar />
      
      <main className="pt-28 pb-20">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Choose the plan that's right for your business.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <Card className="flex flex-col border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-8">
                <CardTitle className="text-2xl font-bold">Starter</CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">For small businesses just getting started</CardDescription>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold tracking-tight">$29</span>
                  <span className="ml-1 text-xl text-gray-500 dark:text-gray-400">/month</span>
                </div>
              </CardHeader>
              <CardContent className="pb-6 flex-grow">
                <ul className="space-y-3">
                  <li className="flex">
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span>1,000 messages per month</span>
                  </li>
                  <li className="flex">
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span>Email support</span>
                  </li>
                  <li className="flex">
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span>Basic analytics</span>
                  </li>
                  <li className="flex">
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span>1 team member</span>
                  </li>
                  <li className="flex">
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span>48-hour response time</span>
                  </li>
                  <li className="flex">
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span>Website integration</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="pt-2">
                <Link to="/auth?signup=true" className="w-full">
                  <Button className="w-full">Get Started</Button>
                </Link>
              </CardFooter>
            </Card>
            
            {/* Pro Plan */}
            <Card className="flex flex-col border-2 border-primary dark:border-primary relative hover:shadow-lg transition-all duration-300">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-bold">
                Most Popular
              </div>
              <CardHeader className="pb-8">
                <CardTitle className="text-2xl font-bold">Pro</CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">For growing businesses scaling up</CardDescription>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold tracking-tight">$79</span>
                  <span className="ml-1 text-xl text-gray-500 dark:text-gray-400">/month</span>
                </div>
              </CardHeader>
              <CardContent className="pb-6 flex-grow">
                <ul className="space-y-3">
                  <li className="flex">
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span>5,000 messages per month</span>
                  </li>
                  <li className="flex">
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span>Priority email support</span>
                  </li>
                  <li className="flex">
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span>Advanced analytics</span>
                  </li>
                  <li className="flex">
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span>4 team members</span>
                  </li>
                  <li className="flex">
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span>24-hour response time</span>
                  </li>
                  <li className="flex">
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span>Custom branding</span>
                  </li>
                  <li className="flex">
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span>Connect with Whatsapp & Instagram</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="pt-2">
                <Link to="/auth?signup=true" className="w-full">
                  <Button className="w-full" variant="default">Get Started</Button>
                </Link>
              </CardFooter>
            </Card>
            
            {/* Enterprise Plan */}
            <Card className="flex flex-col border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-8">
                <CardTitle className="text-2xl font-bold">Enterprise</CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">For large organizations with custom needs</CardDescription>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold tracking-tight">Contact Us</span>
                </div>
              </CardHeader>
              <CardContent className="pb-6 flex-grow">
                <ul className="space-y-3">
                  <li className="flex">
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span>10,000+ messages per month</span>
                  </li>
                  <li className="flex">
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span>24/7 priority support</span>
                  </li>
                  <li className="flex">
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span>Enterprise analytics</span>
                  </li>
                  <li className="flex">
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span>Unlimited team members</span>
                  </li>
                  <li className="flex">
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span>1-hour response time</span>
                  </li>
                  <li className="flex">
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span>Custom branding</span>
                  </li>
                  <li className="flex">
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span>Dedicated account manager</span>
                  </li>
                  <li className="flex">
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span>Custom integrations</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="pt-2">
                <Link to="/contact" className="w-full">
                  <Button className="w-full" variant="outline">Contact Sales</Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
          
          <div className="mt-16 text-center max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Need Something Custom?</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Contact our sales team for a custom solution tailored to your specific requirements.
            </p>
            <Link to="/contact">
              <Button size="lg" variant="outline">Get in Touch</Button>
            </Link>
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
              <Link to="/contact" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                Contact
              </Link>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Chatwise. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
