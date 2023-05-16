export const configRoutes = {
  newMesocycle: `/app/new-mesocycle`,
  newMesocycleDesign: (id: string) => `/app/new-mesocycle/design/${id}`,
  mesocycles: `/app/mesocycles`,
  mesocycleView: (id: string) => `/app/mesocycles/${id}`,
  newExercise: `/app/new-exercise`,
  exerciseView: (id: string) => `/app/exercises/${id}`,
};
