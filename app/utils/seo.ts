export function getMeta(
  title: string = "Sculped - Hypertrophy Training",
  description: string = "Unleash the muscle-building potential within you using our groundbreaking app. Design customized mesocycles and keep a close eye on your progress. Say goodbye to plateaus and hello to extraordinary results."
) {
  const keywords =
    "Sculped, hypertrophy training, muscle building, mesocycles, progress tracking, results";

  const baseUrl = "https://sculped.app";
  const imageUrl = `${baseUrl}/logo.png`;

  return [
    { title, charset: "utf-8" },
    { name: "viewport", content: "width=device-width,initial-scale=1" },
    { name: "description", content: description },
    { name: "keywords", content: keywords },

    { name: "og:title", content: title },
    { name: "og:description", content: description },
    { name: "og:type", content: "website" },
    { name: "og:image", content: imageUrl },
    { name: "og:url", content: baseUrl },

    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: imageUrl },
  ];
}
