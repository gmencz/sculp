const containerStyle = {
  backgroundColor: "#ffffff",
  padding: "20px",
  borderRadius: "5px",
  maxWidth: "400px",
  margin: "0 auto",
  color: "#09090b",
  fontFamily: "Arial, sans-serif",
};

const titleStyle = {
  fontWeight: "bold",
  fontSize: "20px",
  marginBottom: "10px",
};

const buttonStyle = {
  backgroundColor: "#f97316",
  color: "#ffffff",
  border: "none",
  borderRadius: "3px",
  padding: "10px 20px",
  fontSize: "14px",
  cursor: "pointer",
  marginTop: "15px",
  marginBottom: "15px",
  textDecoration: "none",
};

const linkStyle = {
  color: "#f97316",
};

type PasswordResetEmailTemplateProps = {
  link: string;
};

export function PasswordResetEmailTemplate({
  link,
}: PasswordResetEmailTemplateProps) {
  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>Reset Your Sculped Password</h2>
      <p>Hello,</p>
      <p>
        We received a request to reset your Sculped password. Don't worry, we've
        got you covered! To set a new password and regain access to your
        account, simply click the button below:
      </p>
      <a style={buttonStyle} href={link}>
        Reset My Password
      </a>
      <p>The link expires in 1 hour.</p>
      <p>
        If you didn't request this password reset, please disregard this email.
        Your account security is important to us.
      </p>
      <p>
        If you need further assistance or have any questions, feel free to reach
        out to our support team at{" "}
        <a style={linkStyle} href="mailto:support@sculped.app">
          support@sculped.app
        </a>
        .
      </p>
      <p>Best regards,</p>
      <p>The Sculped Team</p>
    </div>
  );
}
