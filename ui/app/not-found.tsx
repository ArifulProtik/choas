"use client";

import React from "react";
import Link from "next/link";
import { Home, MessageCircle, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative mx-auto w-64 h-64 mb-6">
            {/* Discord-style illustration */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full blur-3xl"></div>
            <div className="relative bg-muted rounded-full w-full h-full flex items-center justify-center">
              <div className="text-8xl font-bold text-muted-foreground/30">
                404
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center animate-bounce">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <div className="absolute -bottom-4 -left-4 w-10 h-10 bg-destructive/20 rounded-full flex items-center justify-center animate-pulse">
              <Search className="h-5 w-5 text-destructive" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
          <p className="text-xl text-muted-foreground mb-2">
            Oops! The page you're looking for doesn't exist.
          </p>
          <p className="text-muted-foreground">
            It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Home className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">Go Home</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Return to your messages and conversations
              </p>
              <Link href="/">
                <Button className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Messages
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-green-500" />
                </div>
                <h3 className="font-semibold">Start Chatting</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Connect with friends and start conversations
              </p>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Open Chat
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Additional Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>

          <div className="text-sm text-muted-foreground">
            or try refreshing the page
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            If you believe this is an error, please{" "}
            <Link href="/" className="text-primary hover:underline">
              contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
