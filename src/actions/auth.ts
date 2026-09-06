"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";
import {
  LoginSchema,
  RegisterSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "@/lib/validations";
import { redirect } from "next/navigation";

export async function loginAction(values: z.infer<typeof LoginSchema>) {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, password } = validatedFields.data;

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return { success: "Logged in successfully!" };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials!" };
        default:
          return { error: "Something went wrong!" };
      }
    }
    throw error;
  }
}

export async function registerAction(values: z.infer<typeof RegisterSchema>) {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, password, name } = validatedFields.data;
  
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "Email already in use!" };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
  });

  return { success: "Account created! You can now log in." };
}

export async function logoutAction() {
  await signOut({ redirect: false });
  redirect("/login");
}

export async function forgotPasswordAction(values: z.infer<typeof ForgotPasswordSchema>) {
  const validatedFields = ForgotPasswordSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid email!" };
  }

  const { email } = validatedFields.data;
  
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingUser) {
    // Return success anyway to prevent email enumeration
    return { success: "If an account exists, a reset link has been sent." };
  }

  // Generate a random 64-char token
  const token = Array.from(crypto.getRandomValues(new Uint8Array(48)))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  // Save to DB
  await prisma.passwordResetToken.create({
    data: {
      email,
      token,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 1), // 1 hour
    },
  });

  // Mock email send
  console.log(`[EMAIL_MOCK] Password reset link for ${email}: http://localhost:3000/reset-password?token=${token}`);

  return { success: "If an account exists, a reset link has been sent." };
}

export async function resetPasswordAction(values: z.infer<typeof ResetPasswordSchema>, token?: string) {
  if (!token) return { error: "Missing token!" };

  const validatedFields = ResetPasswordSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { password } = validatedFields.data;

  const existingToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!existingToken) {
    return { error: "Invalid token!" };
  }

  if (new Date() > new Date(existingToken.expires)) {
    return { error: "Token has expired!" };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: existingToken.email },
  });

  if (!existingUser) {
    return { error: "Email does not exist!" };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: existingUser.id },
    data: { passwordHash },
  });

  await prisma.passwordResetToken.delete({
    where: { id: existingToken.id },
  });

  return { success: "Password updated successfully!" };
}
