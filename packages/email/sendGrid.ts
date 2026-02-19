import sgMail from "@sendgrid/mail";

export const configureEmail = (apiKey: string) => {
    sgMail.setApiKey(apiKey);
};

export async function sendEmailVerification(to: string, token: string) {
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`;

    await sgMail.send({
        to,
        from: {
            email: process.env.EMAIL_FROM!,
            name: "FlatMate.com",
        },
        subject: "Verify your email for FlatMate",
        html: `
            <p>Please verify your email by clicking the link below:</p>
            <a href="${verifyUrl}">verifyEmail</a>
            <p>This link expires in 15 minutes.</p>
        `,
    });
}
