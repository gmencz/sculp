export const configRoutes = {
  home: "/",

  auth: {
    getStarted: `/auth/get-started`,
    signIn: `/auth/sign-in`,
    signOut: `/auth/sign-out`,
    invalidSubscription: `/auth/invalid-subscription`,
    forgotPassword: `/auth/forgot-password`,
    resetPassword: `/auth/reset-password`,
    stripeCheckoutSuccess: `/auth/stripe-checkout-success?session_id={CHECKOUT_SESSION_ID}`,
  },

  app: {
    home: "/app",
    profile: "/app/profile",
    train: "/app/train",
    exercises: "/app/exercises",
  },
};
