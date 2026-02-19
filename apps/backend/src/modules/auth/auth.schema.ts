import { z } from "zod";

export const registerSchema = z
    .object({
        email: z.string().email("Invalid email address"),
        username: z.string().min(1, "Username is required"),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters long")
            .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
            .regex(/[0-9]/, "Password must contain at least one number")
            .regex(/[^A-Za-z0-9]/, "Password must contain at least one special symbol"),
        confirmPassword: z.string(),
        gender: z.enum(["male", "female"]),
        phone: z
            .string()
            .min(10, "Phone number must be at least 10 digits")
            .regex(
                /^\+?[1-9]\d{9,14}$/,
                "Please enter a valid phone number with country code"
            ),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;