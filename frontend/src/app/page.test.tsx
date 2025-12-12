import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import App from "./page";

// ---------- Mocks ----------
beforeEach(() => {
  jest.restoreAllMocks();

  global.fetch = jest.fn(async (url, options) => {
    // Login success
    if (url === "/api/auth/login") {
      return {
        ok: true,
        json: async () => ({ valid: true }),
      };
    }

    // Fetch recipes (empty by default)
    if (url === "/api/recipes" && (!options || options.method === "GET")) {
      return {
        ok: true,
        json: async () => [],
      };
    }

    // Create recipe
    if (url === "/api/recipes" && options?.method === "POST") {
      return {
        ok: true,
        json: async () => ({ id: "new-recipe-id" }),
      };
    }

    // Fallback
    return {
      ok: true,
      json: async () => [],
    };
  }) as unknown as jest.Mock;
});

// ---------- Tests ----------
describe("RecipeShare App (Frontend)", () => {
  test("renders application header", async () => {
    render(<App />);

    const header = screen.getByRole("banner");
    expect(within(header).getByText(/recipeshare/i)).toBeInTheDocument();
  });

  test("shows guest message when not signed in", async () => {
    render(<App />);

    expect(
      await screen.findByText(/viewing as a guest/i)
    ).toBeInTheDocument();
  });

  test("search input is rendered", async () => {
    render(<App />);

    expect(
      await screen.findByPlaceholderText(/search recipes/i)
    ).toBeInTheDocument();
  });

  test("clicking sign in opens login form", async () => {
    render(<App />);

    await userEvent.click(
      screen.getByRole("button", { name: /sign in/i })
    );

    expect(
      await screen.findByRole("heading", { name: /login/i })
    ).toBeInTheDocument();
  });

  test("login button is disabled when fields are empty", async () => {
    render(<App />);

    await userEvent.click(
      screen.getByRole("button", { name: /sign in/i })
    );

    const loginButton = screen.getByRole("button", { name: /^login$/i });
    expect(loginButton).toBeDisabled();
  });

  test("password visibility toggle switches input type", async () => {
    render(<App />);

    await userEvent.click(
      screen.getByRole("button", { name: /sign in/i })
    );

    const passwordInput = screen.getByPlaceholderText("••••••••");
    const toggleButton =
      passwordInput.parentElement!.querySelector("button")!;

    expect(passwordInput).toHaveAttribute("type", "password");

    await userEvent.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "text");
  });

  test("shows empty state when no recipes are available", async () => {
    render(<App />);

    expect(
      await screen.findByText(/no recipes found/i)
    ).toBeInTheDocument();
  });

  // ✅ NEW TEST — ADDING A RECIPE (SIGNED-IN USER)
  test("signed-in user can publish a recipe", async () => {
    render(<App />);

    // Open login
    await userEvent.click(
      screen.getByRole("button", { name: /sign in/i })
    );

    // Fill login form
    await userEvent.type(
      screen.getByPlaceholderText(/your_username/i),
      "sam"
    );
    await userEvent.type(
      screen.getByPlaceholderText("••••••••"),
      "password123"
    );

    await userEvent.click(
      screen.getByRole("button", { name: /^login$/i })
    );

    // Upload button should now be visible
    const uploadButton = await screen.findByRole("button", {
      name: /upload/i,
    });

    await userEvent.click(uploadButton);

    // Fill recipe name
    await userEvent.type(
      screen.getByPlaceholderText(/garlic butter shrimp/i),
      "Test Recipe"
    );

    // Publish recipe
    await userEvent.click(
      screen.getByRole("button", { name: /publish/i })
    );

    // Assert POST request happened
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/recipes",
      expect.objectContaining({
        method: "POST",
      })
    );
  });
});
