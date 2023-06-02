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
  fontSize: "16px",
  cursor: "pointer",
  marginTop: "20px",
};

const linkStyle = {
  color: "#f97316",
};

export function PasswordResetEmailTemplate() {
  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>Reset Your Sculped Password</h2>
      <p>Hello,</p>
      <p>
        We received a request to reset your Sculped password. Don't worry, we've
        got you covered! To set a new password and regain access to your
        account, simply click the button below:
      </p>
      <button style={buttonStyle}>Reset My Password</button>
      <p>
        If you didn't request this password reset, please disregard this email.
        Your account security is important to us.
      </p>
      <p>
        If you need further assistance or have any questions, feel free to reach
        out to our support team at{" "}
        <a style={linkStyle} href="mailto:support@sculpedapp.com">
          support@sculpedapp.com
        </a>
        .
      </p>
      <p>Best regards,</p>
      <p>The Sculped Team</p>
    </div>
  );
}
