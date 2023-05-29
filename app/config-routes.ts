export const configRoutes = {
  root: "/",

  appRoot: "/app",

  auth: {
    signIn: `/auth/sign-in`,
    getStarted: `/auth/get-started`,
    forgotPassword: `/auth/forgot-password`,
    checkout: `/auth/checkout?session_id={CHECKOUT_SESSION_ID}`,
  },

  mesocycles: {
    newStepOne: `/app/new-mesocycle`,
    newStepTwo: (id: string) => `/app/new-mesocycle/design/${id}`,
    view: (id: string) => `/app/mesocycles/${id}`,
    list: `/app/mesocycles`,
  },

  exercises: {
    new: `/app/new-exercise`,
    view: (id: string) => `/app/exercises/${id}`,
    list: `/app/exercises`,
  },
};
