import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { DashboardLayout } from "@/components/ui/dashboard-layout";

export default function HomePage() {
  const { user } = useAuth();

  // If logged in, redirect to respective dashboard
  const [, navigate] = useLocation();
  
  useEffect(() => {
    if (user) {
      if (user.role === 'writer') {
        navigate('/writer');
      } else if (user.role === 'client') {
        navigate('/client');
      } else if (user.role === 'admin') {
        navigate('/admin');
      }
    }
  }, [user, navigate]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header/Navbar */}
      <header className="bg-white py-4 px-6 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mr-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">Sharp<span className="text-primary">Quill</span></h1>
          </div>
          <nav className="hidden md:flex items-center space-x-2">
            <a href="#about" className="px-4 py-2 rounded-md text-gray-700 hover:bg-primary/10 hover:text-primary font-medium transition-colors">
              About
            </a>
            <a href="#services" className="px-4 py-2 rounded-md text-gray-700 hover:bg-primary/10 hover:text-primary font-medium transition-colors">
              Services
            </a>
            <a href="#how-it-works" className="px-4 py-2 rounded-md text-gray-700 hover:bg-primary/10 hover:text-primary font-medium transition-colors">
              How It Works
            </a>
            <div className="ml-4 pl-4 border-l border-gray-200">
              <Link href="/auth">
                <Button variant="outline" className="mr-2 border-primary text-primary hover:bg-primary/10">
                  Login
                </Button>
              </Link>
              <Link href="/auth?tab=register">
                <Button variant="default" className="bg-primary hover:bg-primary/90">
                  Register
                </Button>
              </Link>
            </div>
          </nav>
          <div className="md:hidden">
            <Button variant="ghost" size="icon" className="text-gray-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary/80 to-primary/50 text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <div className="inline-block px-4 py-1 rounded-full bg-white/20 text-white text-sm font-medium mb-6">
              PREMIUM CONTENT PLATFORM
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white drop-shadow-sm">
              Quality Content Writing Made <span className="bg-white text-primary px-2 rounded">Simple</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-xl">
              Connect with skilled writers to bring your ideas to life. SharpQuill provides a platform for businesses to find professional writers for all their content needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth">
                <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 hover:text-primary/90">
                  Get Started
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10">
                  Learn More
                </Button>
              </a>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl transform rotate-1 hover:rotate-0 transition-all duration-300">
              <div className="mx-auto w-20 h-20 mb-6 bg-primary/10 rounded-full flex items-center justify-center border-4 border-primary/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-center mb-6 text-gray-800">Join SharpQuill Today</h3>
              <div className="space-y-8">
                <div className="flex items-center bg-primary/5 p-4 rounded-lg transform hover:scale-105 transition-all duration-200">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">For Clients</h4>
                    <p className="text-gray-600">Post jobs and find skilled writers</p>
                  </div>
                </div>
                <div className="flex items-center bg-primary/5 p-4 rounded-lg transform hover:scale-105 transition-all duration-200">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">For Writers</h4>
                    <p className="text-gray-600">Bid on projects and grow your career</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 px-6 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block p-2 px-4 bg-primary/10 rounded-full mb-4">
              <h2 className="text-primary font-medium text-sm">ABOUT US</h2>
            </div>
            <h2 className="text-4xl font-bold mb-6 text-gray-900">About SharpQuill</h2>
            <p className="text-gray-700 max-w-3xl mx-auto text-lg leading-relaxed">
              SharpQuill is a premier freelance writing platform connecting businesses with talented writers from around the world. Our mission is to create a marketplace where quality content creation is accessible, fair, and efficient for both clients and writers.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white p-8 rounded-xl shadow-sm transition-all duration-300 hover:shadow-md">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M12 2v20" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Competitive Pricing</h3>
              <p className="text-gray-700 leading-relaxed">
                Our transparent bidding system ensures fair pricing for quality work. Writers set their own competitive rates, and clients choose based on their budget and needs.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm transition-all duration-300 hover:shadow-md">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3Z" />
                  <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Quality Guarantee</h3>
              <p className="text-gray-700 leading-relaxed">
                We've implemented a comprehensive vetting process for writers, ensuring that all content meets high quality standards. Revisions are included with every order to guarantee client satisfaction.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm transition-all duration-300 hover:shadow-md">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Timely Delivery</h3>
              <p className="text-gray-700 leading-relaxed">
                Our platform is designed to help you meet deadlines with an efficient workflow system. Track project progress in real-time and receive notifications at every stage of your project.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Services</h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              From blog posts to technical documentation, our writers excel in creating content for various industries and purposes.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Blog & Article Writing</h3>
              <p className="text-gray-600 mb-4">
                Engaging blog posts and articles tailored to your audience and SEO goals.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Website Content</h3>
              <p className="text-gray-600 mb-4">
                Compelling website copy that converts visitors into customers.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Technical Writing</h3>
              <p className="text-gray-600 mb-4">
                Clear and concise technical documentation, guides, and manuals.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Product Descriptions</h3>
              <p className="text-gray-600 mb-4">
                Persuasive product descriptions that highlight features and benefits.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Social Media Content</h3>
              <p className="text-gray-600 mb-4">
                Engaging social media posts designed to increase engagement and reach.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Email Newsletters</h3>
              <p className="text-gray-600 mb-4">
                Effective email campaigns that nurture leads and drive conversions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Our simple process makes it easy to get the content you need.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 relative">
                <span className="text-xl font-bold text-primary">1</span>
                <div className="absolute hidden md:block h-1 bg-gray-200 w-full right-0 top-1/2 translate-x-1/2 -z-10"></div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Post a Job</h3>
              <p className="text-gray-600">
                Describe your content needs, budget, and timeline.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 relative">
                <span className="text-xl font-bold text-primary">2</span>
                <div className="absolute hidden md:block h-1 bg-gray-200 w-full right-0 top-1/2 translate-x-1/2 -z-10"></div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Receive Bids</h3>
              <p className="text-gray-600">
                Qualified writers will submit proposals and samples.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 relative">
                <span className="text-xl font-bold text-primary">3</span>
                <div className="absolute hidden md:block h-1 bg-gray-200 w-full right-0 top-1/2 translate-x-1/2 -z-10"></div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Choose a Writer</h3>
              <p className="text-gray-600">
                Select the best fit for your project and requirements.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-primary">4</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Get Quality Content</h3>
              <p className="text-gray-600">
                Receive polished content ready for your use.
              </p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <Link href="/auth">
              <Button size="lg" className="px-8">Get Started Today</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
                <h2 className="ml-2 text-xl font-bold">SharpQuill</h2>
              </div>
              <p className="text-gray-400 mb-4">
                Connecting businesses with professional writers for quality content.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Press</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Writer Guidelines</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Client Resources</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Support</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Cookie Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Copyright</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">© {new Date().getFullYear()} SharpQuill. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}