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
import { logAuditEvent, getClientMetadata } from "@/lib/security";

export async function loginAction(values: z.infer<typeof LoginSchema>) {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: validatedFields.error.errors[0].message || "Invalid fields!" };
  }

  const { email, password } = validatedFields.data;
  const { ipAddress, userAgent } = await getClientMetadata();

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (user) {
      await logAuditEvent({
        action: "AUTH_LOGIN_SUCCESS",
        entityType: "AUTH",
        userId: user.id,
        entityId: user.id,
        details: { email },
        ipAddress,
        userAgent,
      });
    }

    return { success: "Logged in successfully!" };
  } catch (error) {
    await logAuditEvent({
      action: "AUTH_LOGIN_FAILED",
      entityType: "AUTH",
      details: { email, reason: error instanceof AuthError ? error.type : "Unknown" },
      ipAddress,
      userAgent,
    });

    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password!" };
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
    return { error: validatedFields.error.errors[0].message || "Invalid fields!" };
  }

  const { email, password, name } = validatedFields.data;
  const { ipAddress, userAgent } = await getClientMetadata();
  
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
  });

  await logAuditEvent({
    action: "AUTH_LOGIN_SUCCESS",
    entityType: "AUTH",
    userId: newUser.id,
    entityId: newUser.id,
    details: { event: "REGISTER", email },
    ipAddress,
    userAgent,
  });

  return { success: "Account created! You can now log in." };
}

export async function logoutAction() {
  const { ipAddress, userAgent } = await getClientMetadata();
  try {
    await logAuditEvent({
      action: "AUTH_LOGOUT",
      entityType: "AUTH",
      details: { event: "LOGOUT" },
      ipAddress,
      userAgent,
    });
  } catch {}

  await signOut({ redirect: false });
  redirect("/login");
}

export async function forgotPasswordAction(values: z.infer<typeof ForgotPasswordSchema>) {
  const validatedFields = ForgotPasswordSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid email address!" };
  }

  const { email } = validatedFields.data;
  const { ipAddress, userAgent } = await getClientMetadata();
  
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingUser) {
    // Return success anyway to prevent email enumeration
    return { success: "If an account exists, a reset link has been sent." };
  }

  // Generate a cryptographically random 64-char token
  const token = Array.from(crypto.getRandomValues(new Uint8Array(48)))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  await prisma.passwordResetToken.create({
    data: {
      email,
      token,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 1), // 1 hour
    },
  });

  await logAuditEvent({
    action: "AUTH_PASSWORD_RESET_REQUESTED",
    entityType: "AUTH",
    userId: existingUser.id,
    entityId: existingUser.id,
    details: { email },
    ipAddress,
    userAgent,
  });

  console.log(`[EMAIL_MOCK] Password reset link for ${email}: http://localhost:3000/reset-password?token=${token}`);

  return { success: "If an account exists, a reset link has been sent." };
}

export async function resetPasswordAction(values: z.infer<typeof ResetPasswordSchema>, token?: string) {
  if (!token) return { error: "Missing reset token!" };

  const validatedFields = ResetPasswordSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: validatedFields.error.errors[0].message || "Invalid fields!" };
  }

  const { password } = validatedFields.data;
  const { ipAddress, userAgent } = await getClientMetadata();

  const existingToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!existingToken) {
    return { error: "Invalid or expired reset token!" };
  }

  if (new Date() > new Date(existingToken.expires)) {
    return { error: "Token has expired. Please request a new link." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: existingToken.email },
  });

  if (!existingUser) {
    return { error: "User account does not exist." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: existingUser.id },
    data: { passwordHash },
  });

  await prisma.passwordResetToken.delete({
    where: { id: existingToken.id },
  });

  await logAuditEvent({
    action: "AUTH_PASSWORD_RESET_COMPLETED",
    entityType: "AUTH",
    userId: existingUser.id,
    entityId: existingUser.id,
    details: { email: existingUser.email },
    ipAddress,
    userAgent,
  });

  return { success: "Password updated successfully! You can now log in." };
}
