import { json } from "@remix-run/node";

export const loader = async () => {
  return json(
    {
      short_name: "Sculped",
      name: "Sculped - Hypertrophy Training",
      start_url: "/app",
      display: "standalone",
      background_color: "#fafafa",
      shortcuts: [
        {
          name: "Mesocycles",
          url: "/app/mesocycles",
          icons: [
            {
              src: "/icons/icon-96x96.png",
              sizes: "96x96",
              type: "image/png",
              purpose: "any monochrome",
            },
          ],
        },
        {
          name: "Exercises",
          url: "/app/exercises",
          icons: [
            {
              src: "/icons/icon-96x96.png",
              sizes: "96x96",
              type: "image/png",
              purpose: "any monochrome",
            },
          ],
        },
        {
          name: "Profile",
          url: "/app/profile",
          icons: [
            {
              src: "/icons/icon-96x96.png",
              sizes: "96x96",
              type: "image/png",
              purpose: "any monochrome",
            },
          ],
        },
      ],
      icons: [
        {
          src: "/icons/icon-48x48.png",
          sizes: "48x48",
          type: "image/png",
          density: "1.0",
        },
        {
          src: "/icons/icon-72x72.png",
          sizes: "72x72",
          type: "image/png",
          density: "1.5",
        },
        {
          src: "/icons/icon-96x96.png",
          sizes: "96x96",
          type: "image/png",
          density: "2.0",
        },
        {
          src: "/icons/icon-128x128.png",
          sizes: "128x128",
          type: "image/png",
          density: "2.5",
        },
        {
          src: "/icons/icon-144x144.png",
          sizes: "144x144",
          type: "image/png",
          density: "3.0",
        },
        {
          src: "/icons/icon-192x192.png",
          sizes: "192x192",
          type: "image/png",
          density: "4.0",
        },
        {
          src: "/icons/icon-384x384.png",
          sizes: "384x384",
          type: "image/png",
          density: "5.0",
        },
        {
          src: "/icons/icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
          density: "6.0",
        },
      ],
    },
    {
      headers: {
        "Cache-Control": "public, max-age=600",
        "Content-Type": "application/manifest+json",
      },
    }
  );
};
