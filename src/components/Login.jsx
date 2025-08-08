import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router";
import { toast, ToastContainer } from "react-toastify";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../features/user/userSlice";

const formSchema = z.object({
  // name:z.string().trim().min(4,"Minimum four charcter required"),
  email: z.string().email(),
  password: z.string().min(6, "Password Must be 6 or more characters long"),
});

const loginUser = async (data) => {
  const res = await axios.post(
    "https://dummy-socket-io-jnra.onrender.com/api/v1/users/login",
    data
  );
  return res;
};

const Login = () => {
  const [errMsg, setErrMsg] = useState("");
  const dispatch = useDispatch()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
  });
  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (response) => {
      console.log("on login response",response.data);
      const token = response.data.token;
      const user = response.data.user;
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("userName", user.name);
      sessionStorage.setItem("userEmail", user.email);
      sessionStorage.setItem("userId", user.id);
      sessionStorage.setItem("isAdmin", user.isAdmin);
      const loginUserData = {
        token,
        userName:user.name,
        userEmail:user.email,
        userId:user.id,
        isAdmin:user.isAdmin
      }
      dispatch(loginSuccess(loginUserData))
      if (response.data.success) {
        navigate("/chat");
      }
    },
    onError: (err) => {
      console.log("mutation Error", err);
      const errorMeassge =
        err.response?.data.message || "Something went wrong.Try it again!";
      setErrMsg(errorMeassge);
      // toast
      toast.error(errorMeassge, { position: "top-right" });
    },
  });
  const navigate = useNavigate();
  const onSubmit = (data) => {
    console.log(data);
    mutation.mutate(data);
  };

  return (
    <div className="container grid w-full min-h-screen grid-cols-1 place-items-center bg-dashboard/50">
      <div className="w-full max-w-lg p-8 rounded-lg shadow-lg bg-card/75">
        <h1 className="self-center mt-1 text-2xl font-bold text-center text-copy-primary">
          Sign Up
        </h1>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col self-center w-full p-4 mt-2 rounded shadow-md bg-amber-200/10"
        >
          <span className="self-center font-medium text-left text-gray-100/80">
            Enter your information to create an account
          </span>
          <br />
          {mutation.isError && (
            <span className="self-center mb-1 text-sm text-red-500">
              {errMsg}
            </span>
          )}
          {/* <label className="mt-1">
                <span className="block text:md after:content-['*'] after:ml-0.5 after:text-red-500 font-semibold  mt-1 text-copy-secondary ">Name</span>
                <input 
                className="w-full p-1 mb-1 font-medium text-black border rounded peer focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500 invalid:text-red-500 invalid:focus:border-red-500 invalid:focus:ring-red-500 placeholder:text-gray-400"
                {...register("name",{
                    required:"name is required",
                    minLength:4
                    })} type="text" placeholder="Enter your name" />
            </label> */}
          {/* {errors.name && <span className="text-sm font-medium text-red-600"> {errors.name.message}</span>} */}
          {/* <label className="mt-1">
            <span className="block text:md after:content-['*'] after:ml-0.5 after:text-red-500 font-semibold  mt-1 text-copy-secondary ">
              Email
            </span>
            <input
              className="w-full p-1 mb-1 font-medium text-black border rounded peer focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500 invalid:text-red-500 invalid:focus:border-red-500 invalid:focus:ring-red-500 placeholder:text-gray-400"
              {...register("email", {
                required: "email is required",
                validate: (value) => value.includes("@"),
              })}
              type="email"
              placeholder="Enter your email"
            />
          </label> */}

          <label className="input w-full mb-4">
            <span className="label">Email</span>
            <input
              {...register("email", {
                required: "email is required",
                validate: (value) => value.includes("@"),
              })}
              type="email"
              placeholder="Enter your email"
            />
          </label>
          {errors.email && (
            <span className="text-sm font-medium text-red-600">
              {" "}
              {errors.email.message}
            </span>
          )}

          {/* <label className="mt-1">
            <span className="block text:md after:content-['*'] after:ml-0.5 after:text-red-500 font-semibold  mt-1 text-copy-secondary ">
              Password
            </span>
            <input
              className="w-full p-1 mb-1 font-medium text-black border rounded peer focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500 invalid:text-red-500 invalid:focus:border-red-500 invalid:focus:ring-red-500 placeholder:text-gray-400 "
              {...register("password", {
                required: "Password is required",
                minLength: 6,
              })}
              type="password"
              placeholder="Enter the password"
            />
          </label> */}
          <label className="input w-full mb-2">
            <span className="label">Password</span>
            <input
              {...register("password", {
                required: "Password is required",
                minLength: 6,
              })}
              type="password"
              placeholder="Enter the password"
            />
          </label>
          {errors.password && (
            <span className="text-sm font-medium text-red-600">
              {errors.password.message}
            </span>
          )}

          {/* <label className="mt-1">
                <span className="block text:md after:content-['*'] after:ml-0.5 after:text-red-500 font-semibold  mt-1 text-copy-secondary ">Confirm Password</span>
                <input 
                className="w-full p-1 mb-1 font-medium text-black border rounded peer focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500 invalid:text-red-500 invalid:focus:border-red-500 invalid:focus:ring-red-500 placeholder:text-gray-400 "
                {...register("confirmPassword",
                    {
                        required:"confirmPassword is required",
                        minLength:6

                    })} type="password" placeholder="Enter the confirm password"/>
            </label> */}
          {/* {errors.confirmPassword && <span className="text-sm font-medium text-red-600">{errors.confirmPassword.message}</span>} */}

          {/* <button
            className={` bg-cta hover:bg-cta-active transition-colors text-cta-text font-semibold w-full py-2 rounded-md mt-6 mb-4 flex items-center justify-center gap-2 ${
              mutation.isPending ? "cursor-not-allowed opacity-45" : ""
            }`}
            type="submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending && (
              <span>
                <LoaderCircle
                  strokeWidth={2}
                  className="text-bg-cta animate-spin"
                />
              </span>
            )}
            Submit
          </button> */}
          <button className="btn btn-primary mt-2 mb-4" type="submit" disabled={mutation.isPending}>Submit</button>
          <div className=" text-copy-primary">
            <p className="text-sm ">
              By continuing, I agree to the Terms of Use & Privacy Policy
            </p>

            <p className="font-normal ">
              Already have an Account?{" "}
              <span
                className="font-semibold cursor-pointer"
                onClick={() => navigate("/auth/login")}
              >
                Try Login
              </span>
            </p>
          </div>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Login;
