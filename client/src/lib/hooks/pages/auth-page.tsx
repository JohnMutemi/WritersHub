import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Pen, BookOpen, User } from "lucide-react";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Registration form schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Please enter a valid email"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  role: z.enum(["writer", "client"], {
    required_error: "Please select a role",
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const { loginMutation, registerMutation, user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && !isLoading) {
      if (user.role === 'writer') {
        navigate("/writer");
      } else if (user.role === 'client') {
        navigate("/client");
      } else if (user.role === 'admin') {
        navigate("/admin");
      } else {
        navigate("/");
      }
    }
  }, [user, isLoading, navigate]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      fullName: "",
      role: "writer",
    },
  });

  const onLoginSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values, {
      onSuccess: (user) => {
        if (user.role === 'writer') {
          navigate("/writer");
        } else if (user.role === 'client') {
          navigate("/client");
        } else if (user.role === 'admin') {
          navigate("/admin");
        } else {
          navigate("/");
        }
      },
    });
  };

  const onRegisterSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate(values, {
      onSuccess: (user) => {
        if (user.role === 'writer') {
          navigate("/writer");
        } else if (user.role === 'client') {
          navigate("/client");
        } else {
          navigate("/");
        }
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary/5 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full flex flex-col md:flex-row shadow-xl rounded-xl overflow-hidden transform hover:scale-[1.01] transition-all duration-300">
        {/* Left side - form */}
        <div className="flex-1 bg-white p-8 sm:p-10 md:p-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mr-2">
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
              <h1 className="text-3xl font-extrabold text-gray-900">Sharp<span className="text-primary">Quill</span></h1>
            </div>
            <p className="mt-2 text-gray-600 text-lg">
              The premium platform for freelance writers
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-primary/5 rounded-lg">
              <TabsTrigger value="login" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-white py-3">Login</TabsTrigger>
              <TabsTrigger value="register" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-white py-3">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your username" 
                            className="border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-md py-6" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Enter your password" 
                            className="border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-md py-6" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-6 mt-4"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Logging in...
                      </span>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Full Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your full name" 
                            className="border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-md py-6" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Choose a username" 
                            className="border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-md py-6" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="Enter your email" 
                            className="border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-md py-6" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Create a password" 
                            className="border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-md py-6" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-md py-6">
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="writer" className="py-3">
                              <div className="flex items-center">
                                <Pen className="h-4 w-4 mr-2" />
                                <span>Writer</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="client" className="py-3">
                              <div className="flex items-center">
                                <BookOpen className="h-4 w-4 mr-2" />
                                <span>Client</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-6 mt-4"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating account...
                      </span>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right side - info */}
        <div className="flex-1 bg-gradient-to-br from-primary to-primary/80 text-white p-8 sm:p-10 md:p-12 hidden md:block">
          <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm mb-8">
            <h2 className="text-4xl font-bold mb-4">Welcome to SharpQuill</h2>
            <p className="text-white/90 text-lg leading-relaxed">
              Connect with top-quality writers and clients in our premium freelance writing marketplace.
            </p>
          </div>

          <div className="space-y-8">
            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm hover:bg-white/20 transition-colors">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-white/20 rounded-lg p-4 mr-5">
                  <Pen className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-3">For Writers</h3>
                  <p className="text-white/80 leading-relaxed">
                    Showcase your talent, bid on projects that match your expertise, and build your freelance career with our growing network of clients.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm hover:bg-white/20 transition-colors">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-white/20 rounded-lg p-4 mr-5">
                  <BookOpen className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-3">For Clients</h3>
                  <p className="text-white/80 leading-relaxed">
                    Post your writing projects and connect with talented writers who can deliver high-quality content that meets your specific requirements.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm hover:bg-white/20 transition-colors">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-white/20 rounded-lg p-4 mr-5">
                  <User className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-3">Secure Payments</h3>
                  <p className="text-white/80 leading-relaxed">
                    Our platform ensures secure transactions with multiple payment options including PayPal and M-Pesa, with escrow protection for both parties.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
