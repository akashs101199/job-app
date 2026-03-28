import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RegisterPage from "../pages/Register/RegisterPage";
import { useAuthUser } from "../context/AuthContext";

jest.mock("../context/AuthContext", () => ({
  useAuthUser: jest.fn(),
}));

describe("RegisterPage Component", () => {
  const mockRegister = jest.fn();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthUser.mockReturnValue({ register: mockRegister });

    const reactRouterDom = require("react-router-dom");
    reactRouterDom.useNavigate.mockReturnValue(mockNavigate);
  });

  const fillForm = ({
    firstName = "",
    lastName = "",
    email = "",
    password = "",
    dob = "",
  }) => {
    if (firstName)
      fireEvent.change(screen.getByPlaceholderText("First Name"), {
        target: { value: firstName },
      });
    if (lastName)
      fireEvent.change(screen.getByPlaceholderText("Last Name"), {
        target: { value: lastName },
      });
    if (email)
      fireEvent.change(screen.getByPlaceholderText("Enter your Mail Id"), {
        target: { value: email },
      });
    if (password)
      fireEvent.change(screen.getByPlaceholderText("Password"), {
        target: { value: password },
      });
    if (dob)
      fireEvent.change(screen.getByPlaceholderText("Enter your DOB"), {
        target: { value: dob },
      });
  };

  test("shows error if fields are empty", async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Sign Up"));

    expect(await screen.findByText("Fill in all fields!")).toBeInTheDocument();
  });

  test("calls register function on form submit", async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    fillForm({
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      password: "password123",
      dob: "1990-01-01",
    });

    fireEvent.click(screen.getByText("Sign Up"));

    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1));

    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});
