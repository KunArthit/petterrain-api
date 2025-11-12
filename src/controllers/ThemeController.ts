import { Elysia, t } from "elysia";
import ThemeService from "../classes/ThemeService";

const themeController = new Elysia({
  prefix: "/themes",
  tags: ["Themes"],
})
  // Get theme by name (defaults to "default")
  .get("/", async () => {
    try {
      const theme = await ThemeService.getThemeByName("default");
      if (!theme) throw new Error("Theme not found");
      return theme;
    } catch (error) {
      throw new Error("Failed to fetch theme");
    }
  })

  // Create a new theme
  .post(
    "/",
    async ({ body }) => {
      try {
        const themeId = await ThemeService.createTheme({
          ...body,
        });
        return { message: "Theme created", theme_id: themeId };
      } catch (error) {
        throw new Error("Failed to create theme");
      }
    },
    {
      body: t.Object({
        name: t.String(),
        primaryColor: t.String(),
        secondaryColor: t.String(),
        backgroundColor: t.String(),
      }),
    }
  )

  // Update theme by name
  .put(
    "/:name",
    async ({ params, body }) => {
      try {
        const success = await ThemeService.updateTheme(params.name, body);
        if (!success) throw new Error("Theme update failed");
        return { message: "Theme updated successfully" };
      } catch (error) {
        throw new Error("Failed to update theme");
      }
    },
    {
      body: t.Partial(
        t.Object({
          primaryColor: t.String(),
          secondaryColor: t.String(),
          backgroundColor: t.String(),
        })
      ),
    }
  )

  // Delete a theme by name
  .delete("/:name", async ({ params }) => {
    try {
      const success = await ThemeService.deleteTheme(params.name);
      if (!success) throw new Error("Theme deletion failed");
      return { message: "Theme deleted successfully" };
    } catch (error) {
      throw new Error("Failed to delete theme");
    }
  });

export default themeController;
