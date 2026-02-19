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

export async function sendAdminPropertySubmissionMail(
    propertyId: string,
    ownerId: string
) {
    const adminReviewUrl = `${process.env.ADMIN_DASHBOARD_URL}/properties/${propertyId}`;

    await sgMail.send({
        to: process.env.ADMIN_EMAIL!,
        from: {
            email: process.env.EMAIL_FROM!,
            name: "FlatMate.com",
        },
        subject: "New Property Submitted for Review",
        html: `
      <h3>New Property Submission</h3>

      <p><strong>Property ID:</strong> ${propertyId}</p>
      <p><strong>Owner ID:</strong> ${ownerId}</p>

      <p>
        <a href="${adminReviewUrl}" target="_blank">
          Review Property
        </a>
      </p>

      <p>Please verify or reject this property from the admin dashboard.</p>
    `,
    });
}

export async function sendUserPropertyConfirmationMail(
    userEmail: string
) {
    await sgMail.send({
        to: userEmail,
        from: {
            email: process.env.EMAIL_FROM!,
            name: "FlatMate.com",
        },
        subject: "Your Property Has Been Listed",
        html: `
            <h3>Thank You for Listing Your Property</h3>
            <p>Your property has been successfully listed.</p>
            <p>Our team will review and verify your property shortly.</p>
        `,
    });
}


export async function sendPropertyVerifiedMail(
    userEmail: string,
    propertyTitle: string
) {
    await sgMail.send({
        to: userEmail,
        from: {
            email: process.env.EMAIL_FROM!,
            name: "FlatMate.com",
        },
        subject: "Your Property Has Been Verified 🎉",
        html: `
      <h3>Congratulations!</h3>

      <p>Your property <strong>${propertyTitle}</strong> has been successfully verified.</p>

      <p>
        It is now visible to users and will start appearing in search results.
      </p>

      <p>Thank you for listing with FlatMate.</p>
    `,
    });
}


export async function sendPropertyRejectedMail(
    userEmail: string,
    propertyTitle: string
) {
    await sgMail.send({
        to: userEmail,
        from: {
            email: process.env.EMAIL_FROM!,
            name: "FlatMate.com",
        },
        subject: "Your Property Listing Update",
        html: `
      <h3>Property Review Update</h3>

      <p>
        Your property <strong>${propertyTitle}</strong> could not be verified at this time.
      </p>

      <p>
        This may be due to missing or unclear ownership details.
      </p>

      <p>
        You may update your property details and submit again for review.
      </p>

      <p>— Team FlatMate</p>
    `,
    });
}
