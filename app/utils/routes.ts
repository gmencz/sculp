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
    exercises: "/app/exercises",
    profile: "/app/profile",
    viewExercise: (exerciseId: string) => `/app/exercises/${exerciseId}`,
    viewRoutine: (routineId: string) => `/app/routines/${routineId}`,
    editRoutine: (routineId: string) => `/app/routines/${routineId}/edit`,
    newRoutine: (folderId: string) => `/app/routines/new/${folderId}`,
    duplicateRoutine: (routineId: string) =>
      `/app/routines/new?fromRoutineId=${routineId}`,
    trainWithRoutine: (routineId: string) =>
      `/app/train?routineId=${routineId}`,
  },
};
