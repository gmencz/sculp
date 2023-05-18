export const configRoutes = {
  root: "/",

  appRoot: "/app",

  auth: {
    signIn: `/?modal=sign_in`,
    requestAccess: `/?modal=request_access`,
    forgotPassword: "/?modal=forgot_password",
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
