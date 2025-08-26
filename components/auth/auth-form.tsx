import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import GithubSignInButton from "./github-oauth-button";
import GoogleSignInButton from "./google-oauth-button";
import { Separator } from "../ui/separator";
import EmailAuthForm from "./email-auth-form";

export default function AuthForm() {
  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle>Sign in or create an account</CardTitle>
        <CardDescription>
          Sign in to your account to continue or create an account to get
          started.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <GoogleSignInButton />
        <GithubSignInButton />

        <div className="relative w-full my-2">
          <Separator dir="horizontal" />
          <p className="text-muted-foreground dark:bg-card absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2  px-2 text-sm font-medium">
            or
          </p>
        </div>

        <EmailAuthForm />
      </CardContent>
    </Card>
  );
}
