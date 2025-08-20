import { supabase } from './db';
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users, type User, type InsertUser } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface AuthUser {
  id: number;
  email: string;
  role: string;
}

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await this.hashPassword(userData.password);
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async authenticateUser(email: string, password: string): Promise<AuthUser | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (!user || !user.isActive) {
      return null;
    }

    const isValidPassword = await this.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return null;
    }

    // Update last login
    await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, user.id));

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  async getUserById(id: number): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    
    return user || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    
    return user || null;
  }

  // Optional: Supabase Auth integration methods
  async signUpWithSupabase(email: string, password: string) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async signInWithSupabase(email: string, password: string) {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async signOutFromSupabase() {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }
  }

  async getCurrentSupabaseUser() {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      throw error;
    }

    return user;
  }
}

export const authService = new AuthService();
